import Complaint from "../models/Complaint.js";

const EARTH_RADIUS_METERS = 6378137;
const AI_CLASSIFIER_URL = process.env.AI_CLASSIFIER_URL || "http://127.0.0.1:5001/api/classify";

const isDbConnected = () => Complaint.db?.readyState === 1;
const getDbUnavailableResponse = (res) => {
  return res.status(503).json({
    message: "Database unavailable. Please try again once MongoDB reconnects.",
  });
};

const normalizeStoredComplaint = (item) => {
  const sourceScore = typeof item.urgencyScore === "number"
    ? item.urgencyScore
    : item.priorityScore;
  const syncedScore = normalizePriorityScore(sourceScore);

  return {
    ...item,
    urgencyScore: syncedScore,
    priorityScore: syncedScore,
  };
};

const RESOLUTION_DAYS = {
  "Sanitation": 2,
  "Roads": 7,
  "Water": 3,
  "Electricity": 1,
  "Animal Control": 5,
  "Illegal Construction": 14,
  "Other": 4
};

const CATEGORY_DEPARTMENT_MAP = {
  "Road and Traffic": "Roads",
  "Waste Management": "Sanitation",
  "Street Lighting": "Electricity",
  "Water Supply": "Water",
  "Drainage": "Water",
};

const ISSUE_CATEGORY_KEYWORDS = {
  "Road and Traffic": ["road", "traffic", "pothole", "street", "asphalt", "signal", "junction", "speed breaker"],
  "Waste Management": ["garbage", "waste", "trash", "dump", "sanitation", "dirty", "sewage", "smell"],
  "Street Lighting": ["streetlight", "street light", "light", "dark", "electric", "electricity", "pole", "wire"],
  "Water Supply": ["water", "supply", "tap", "pipeline", "pipe", "leak", "no water", "drinking water"],
  "Drainage": ["drain", "drainage", "waterlogging", "flood", "blocked drain", "overflow", "sewer"],
};

const CATEGORY_OPTIONS = Object.keys(ISSUE_CATEGORY_KEYWORDS);

const suggestCategoryFromText = (text = "") => {
  const normalizedText = String(text).toLowerCase();
  if (!normalizedText.trim()) {
    return {
      suggestedCategory: "Road and Traffic",
      rankedCategories: CATEGORY_OPTIONS.map((category) => ({ category, score: 0 })),
    };
  }

  const rankedCategories = CATEGORY_OPTIONS
    .map((category) => {
      const keywords = ISSUE_CATEGORY_KEYWORDS[category] || [];
      const score = keywords.reduce((count, keyword) => (
        normalizedText.includes(keyword) ? count + 1 : count
      ), 0);

      return {
        category,
        score,
      };
    })
    .sort((first, second) => second.score - first.score);

  return {
    suggestedCategory: rankedCategories[0]?.category || "Road and Traffic",
    rankedCategories,
  };
};

const normalizePriorityScore = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(10, Math.round(value)));
};

const applyCategorySurgeBoost = async ({ department, createdAt, baseScore }) => {
  if (!isDbConnected()) {
    return {
      score: normalizePriorityScore(baseScore),
      count: 0,
      surgeLabel: "normal",
    };
  }

  const thirtyDaysAgo = new Date(createdAt);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sameCategoryCount = await Complaint.countDocuments({
    department,
    createdAt: { $gte: thirtyDaysAgo },
  });

  let boostedScore = normalizePriorityScore(baseScore);
  let surgeLabel = "normal";

  if (sameCategoryCount >= 10) {
    boostedScore = Math.max(9, boostedScore + 3);
    surgeLabel = "severe";
  } else if (sameCategoryCount >= 6) {
    boostedScore = Math.max(8, boostedScore + 2);
    surgeLabel = "high";
  } else if (sameCategoryCount >= 3) {
    boostedScore = Math.max(8, boostedScore + 1);
    surgeLabel = "elevated";
  }

  return {
    score: normalizePriorityScore(boostedScore),
    count: sameCategoryCount,
    surgeLabel,
  };
};

const withTimeout = async (promise, timeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
};

const classifyWithAiModel = async (text) => {
  try {
    const response = await withTimeout(
      (signal) =>
        fetch(AI_CLASSIFIER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ complaint: text }),
          signal,
        }),
      6000
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const labels = Array.isArray(data.labels) ? data.labels : [];
    const scores = Array.isArray(data.scores) ? data.scores : [];

    if (!labels.length || !scores.length || labels.length !== scores.length) {
      return null;
    }

    let topIndex = 0;
    let topScore = -1;

    for (let i = 0; i < scores.length; i += 1) {
      const scoreValue = Number(scores[i]);
      if (!Number.isNaN(scoreValue) && scoreValue > topScore) {
        topScore = scoreValue;
        topIndex = i;
      }
    }

    const aiDepartment = labels[topIndex] || "Other";
    const aiPriorityScore = normalizePriorityScore(topScore * 10);

    return {
      department: aiDepartment,
      priorityScore: aiPriorityScore,
    };
  } catch {
    return null;
  }
};

const metersToRadians = (meters) => meters / EARTH_RADIUS_METERS;

/**
 * Simple rule-based classification for complaints
 */
function classifyComplaint(text) {
  const lowerText = text.toLowerCase();

  // Department classification based on keywords
  const departmentKeywords = {
    "Sanitation": ["garbage", "waste", "trash", "sewage", "toilet", "sanitation", "clean", "dirty", "smell", "dump"],
    "Roads": ["road", "pothole", "street", "traffic", "lane", "asphalt", "repair", "broken"],
    "Water": ["water", "leak", "pipe", "flood", "drainage", "waterlogging", "supply", "tap"],
    "Electricity": ["light", "electricity", "power", "bulb", "streetlight", "wire", "pole", "outage"],
    "Animal Control": ["dog", "animal", "stray", "cattle", "monkey", "pest", "bite"],
    "Illegal Construction": ["construction", "building", "encroachment", "illegal", "demolish", "structure"]
  };

  let department = "Other";
  let maxMatches = 0;

  for (const [dept, keywords] of Object.entries(departmentKeywords)) {
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      department = dept;
    }
  }

  // Urgency scoring based on keywords
  const urgentKeywords = ["danger", "accident", "emergency", "hospital", "death", "injury", "fire", "flood", "urgent", "immediate"];
  const urgencyMatches = urgentKeywords.filter(keyword => lowerText.includes(keyword)).length;
  let urgencyScore = Math.min(10, 3 + urgencyMatches * 2); // Base 3, +2 per urgent keyword

  // Sentiment analysis (simple)
  const negativeKeywords = ["angry", "frustrated", "terrible", "worst", "horrible", "bad", "disgusting", "unacceptable"];
  const positiveKeywords = ["good", "great", "excellent", "thank", "appreciate"];

  let sentiment = "Neutral";
  const negCount = negativeKeywords.filter(k => lowerText.includes(k)).length;
  const posCount = positiveKeywords.filter(k => lowerText.includes(k)).length;

  if (negCount > posCount) {
    sentiment = negCount > 1 ? "Very Negative" : "Negative";
  } else if (posCount > negCount) {
    sentiment = posCount > 1 ? "Very Positive" : "Positive";
  }

  const predictedResolutionDays = RESOLUTION_DAYS[department] || 4;

  // Key tags: extract some keywords
  const allKeywords = Object.values(departmentKeywords).flat();
  const keyTags = allKeywords.filter(k => lowerText.includes(k)).slice(0, 5);

  return {
    department,
    urgencyScore,
    sentiment,
    predictedResolutionDays,
    keyTags
  };
}

/**
 * POST /api/complaints
 * Body: { text, longitude, latitude }
 */
export const createComplaint = async (req, res) => {
  const { text, longitude, latitude, category } = req.body;

  if (!text || typeof longitude !== "number" || typeof latitude !== "number") {
    return res.status(400).json({
      message: "text, longitude, and latitude are required.",
    });
  }

  try {
    if (!isDbConnected()) {
      return getDbUnavailableResponse(res);
    }

    // First, classify based on text
    const classification = classifyComplaint(text);
    let { department, urgencyScore, sentiment, predictedResolutionDays, keyTags } = classification;
    const combinedText = `${text} ${String(category || "")}`.trim();
    const autoSuggestedCategory = suggestCategoryFromText(combinedText).suggestedCategory;
    const normalizedCategory = typeof category === "string" && category.trim().length > 0
      ? category.trim()
      : autoSuggestedCategory;

    const mappedDepartment = CATEGORY_DEPARTMENT_MAP[normalizedCategory];
    if (mappedDepartment) {
      department = mappedDepartment;
      predictedResolutionDays = RESOLUTION_DAYS[mappedDepartment] || predictedResolutionDays;
    }

    const aiResult = await classifyWithAiModel(text);
    let priorityScore = normalizePriorityScore(urgencyScore);

    if (aiResult) {
      department = aiResult.department || department;
      priorityScore = normalizePriorityScore(aiResult.priorityScore);
      predictedResolutionDays = RESOLUTION_DAYS[department] || predictedResolutionDays;
      if (!mappedDepartment && !keyTags.includes(String(department).toLowerCase())) {
        keyTags = [String(department).toLowerCase(), ...keyTags].slice(0, 5);
      }
    } else {
      console.warn("⚠️ AI classifier unavailable, using fallback scoring logic.");
    }

    if (!keyTags.includes(normalizedCategory.toLowerCase())) {
      keyTags = [normalizedCategory.toLowerCase(), ...keyTags].slice(0, 5);
    }

    const surgeBoost = await applyCategorySurgeBoost({
      department,
      createdAt: new Date(),
      baseScore: priorityScore,
    });

    priorityScore = surgeBoost.score;
    urgencyScore = priorityScore;

    if (surgeBoost.surgeLabel !== "normal") {
      const surgeTag = `${department.toLowerCase()}-surge-${surgeBoost.surgeLabel}`;
      if (!keyTags.includes(surgeTag)) {
        keyTags = [surgeTag, ...keyTags].slice(0, 5);
      }
    }

    const complaint = new Complaint({
      originalText: text,
      category: normalizedCategory,
      department,
      priorityScore,
      urgencyScore,
      sentiment,
      predictedResolutionDays,
      keyTags,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });

    const saved = await complaint.save();

    return res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error creating complaint:", err);
    return res.status(500).json({
      message: "Error while creating complaint.",
    });
  }
};

/**
 * GET /api/complaint-categories
 * Returns all available issue categories for dropdowns.
 */
export const getComplaintCategories = async (_req, res) => {
  return res.json({
    categories: CATEGORY_OPTIONS,
  });
};

/**
 * POST /api/complaint-categories/suggest
 * Body: { text }
 * Returns suggested category based on complaint issue text.
 */
export const suggestComplaintCategory = async (req, res) => {
  const { text } = req.body || {};
  const suggestion = suggestCategoryFromText(text);

  return res.json({
    suggestedCategory: suggestion.suggestedCategory,
    rankedCategories: suggestion.rankedCategories,
  });
};

/**
 * GET /api/complaints
 * Returns all complaints for heatmap and listing
 */
export const getComplaints = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return getDbUnavailableResponse(res);
    }

    const complaints = await Complaint.find({}, {
      originalText: 1,
      category: 1,
      department: 1,
      priorityScore: 1,
      urgencyScore: 1,
      sentiment: 1,
      predictedResolutionDays: 1,
      keyTags: 1,
      status: 1,
      location: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    const normalized = complaints.map((item) => {
      const sourceScore = typeof item.urgencyScore === "number"
        ? item.urgencyScore
        : item.priorityScore;
      const syncedScore = normalizePriorityScore(sourceScore);

      const payload = item.toObject();
      payload.urgencyScore = syncedScore;
      payload.priorityScore = syncedScore;
      return payload;
    });

    return res.json(normalized);
  } catch (err) {
    console.error("❌ Error getting complaints:", err);
    return res.status(500).json({
      message: "Error while fetching complaints.",
    });
  }
};

/**
 * GET /api/top-issues
 * Returns top recurring issues based on keyTags
 */
export const getTopIssues = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return getDbUnavailableResponse(res);
    }

    const tags = await Complaint.aggregate([
      { $unwind: "$keyTags" },
      { $group: { _id: "$keyTags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return res.json(tags);
  } catch (err) {
    console.error("❌ Error getting top issues:", err);
    return res.status(500).json({
      message: "Error while fetching top issues.",
    });
  }
};

/**
 * GET /api/complaints/by-department
 * Returns complaints grouped under their assigned department.
 */
export const getComplaintsByDepartment = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return getDbUnavailableResponse(res);
    }

    const complaints = await Complaint.find({}, {
      originalText: 1,
      category: 1,
      department: 1,
      priorityScore: 1,
      urgencyScore: 1,
      sentiment: 1,
      predictedResolutionDays: 1,
      keyTags: 1,
      status: 1,
      location: 1,
      createdAt: 1,
    }).sort({ createdAt: -1 });

    const normalized = complaints.map((item) => normalizeStoredComplaint(item.toObject()));
    const groupedMap = new Map();

    normalized.forEach((item) => {
      const department = item.department || "Other";
      if (!groupedMap.has(department)) {
        groupedMap.set(department, []);
      }
      groupedMap.get(department).push(item);
    });

    const departments = [...groupedMap.entries()].map(([department, groupedComplaints]) => ({
      department,
      count: groupedComplaints.length,
      complaints: groupedComplaints,
    }));

    return res.json({
      totalDepartments: departments.length,
      totalComplaints: normalized.length,
      departments,
    });
  } catch (err) {
    console.error("❌ Error grouping complaints by department:", err);
    return res.status(500).json({
      message: "Error while grouping complaints by department.",
    });
  }
};

/**
 * GET /api/urgency-ranking
 * Returns complaints sorted by urgency score
 */
export const getUrgencyRanking = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return getDbUnavailableResponse(res);
    }

    const urgentComplaints = await Complaint.find({ status: "Pending" }, {
      originalText: 1,
      department: 1,
      priorityScore: 1,
      urgencyScore: 1,
      location: 1,
      createdAt: 1
    }).sort({ urgencyScore: -1 }).limit(20);

    const normalized = urgentComplaints.map((item) => {
      const sourceScore = typeof item.urgencyScore === "number"
        ? item.urgencyScore
        : item.priorityScore;
      const syncedScore = normalizePriorityScore(sourceScore);

      const payload = item.toObject();
      payload.urgencyScore = syncedScore;
      payload.priorityScore = syncedScore;
      return payload;
    });

    return res.json(normalized);
  } catch (err) {
    console.error("❌ Error getting urgency ranking:", err);
    return res.status(500).json({
      message: "Error while fetching urgency ranking.",
    });
  }
};

/**
 * GET /api/dashboard-stats
 * Returns high-level stats for charts: total complaints, count by department,
 * average predicted resolution days, sentiment distribution.
 */
export const getDashboardStats = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return getDbUnavailableResponse(res);
    }

    const [totals, avgResolution, sentiments] = await Promise.all([
      Complaint.aggregate([
        {
          $group: {
            _id: "$department",
            count: { $sum: 1 },
          },
        },
      ]),
      Complaint.aggregate([
        {
          $group: {
            _id: null,
            avgPredictedResolutionDays: { $avg: "$predictedResolutionDays" },
          },
        },
      ]),
      Complaint.aggregate([
        {
          $group: {
            _id: "$sentiment",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalComplaints = totals.reduce((sum, d) => sum + d.count, 0);
    const countByDepartment = {};
    totals.forEach((d) => {
      countByDepartment[d._id || "Unknown"] = d.count;
    });

    const avgPredictedResolutionDays =
      avgResolution[0]?.avgPredictedResolutionDays ?? 0;

    const sentimentDistribution = {};
    sentiments.forEach((s) => {
      sentimentDistribution[s._id || "Unknown"] = s.count;
    });

    return res.json({
      totalComplaints,
      countByDepartment,
      avgPredictedResolutionDays,
      sentimentDistribution,
    });
  } catch (err) {
    console.error("❌ Error getting dashboard stats:", err);
    return res.status(500).json({
      message: "Error while fetching dashboard stats.",
    });
  }
};

/**
 * GET /api/clusters?lng=...&lat=...&radius=...
 *
 * Uses MongoDB geospatial query ($near + $maxDistance) on the `location` field.
 * Because `location` has a 2dsphere index, MongoDB efficiently finds "Pending"
 * complaints within the requested radius (in meters) around [lng, lat].
 */
export const getClusters = async (req, res) => {
  const { lng, lat, radius } = req.query;

  const longitude = parseFloat(lng);
  const latitude = parseFloat(lat);
  const radiusMeters = parseInt(radius, 10);

  if (
    Number.isNaN(longitude) ||
    Number.isNaN(latitude) ||
    Number.isNaN(radiusMeters)
  ) {
    return res.status(400).json({
      message: "lng, lat, and radius (meters) query params are required.",
    });
  }

  try {
    if (!isDbConnected()) {
      return getDbUnavailableResponse(res);
    }

    const count = await Complaint.countDocuments({
      status: "Pending",
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], metersToRadians(radiusMeters)],
        },
      },
    });

    // Simple alert logic for hackathon:
    // - > 50: Severe
    // - > 10: High
    // - > 0: Low
    // - 0: None
    let alertLevel = "None";
    if (count > 50) {
      alertLevel = "Severe";
    } else if (count > 10) {
      alertLevel = "High";
    } else if (count > 0) {
      alertLevel = "Low";
    }

    const isCluster = count > 10;

    return res.json({
      isCluster,
      count,
      alertLevel,
    });
  } catch (err) {
    console.error("❌ Error getting clusters:", err);
    return res.status(500).json({
      message: "Error while fetching cluster information.",
    });
  }
};

/**
 * PUT /api/complaints/:id/status
 * Body: { status }
 */
export const updateComplaintStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Pending", "In Progress", "Resolved", "Closed"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status. Must be one of: Pending, In Progress, Resolved, Closed",
    });
  }

  try {
    if (!isDbConnected()) {
      return getDbUnavailableResponse(res);
    }

    const updated = await Complaint.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }
    return res.json(updated);
  } catch (err) {
    console.error("❌ Error updating complaint status:", err);
    return res.status(500).json({
      message: "Error while updating complaint status.",
    });
  }
};


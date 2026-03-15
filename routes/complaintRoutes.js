import express from "express";
import {
  createComplaint,
  getComplaintCategories,
  getComplaintsByDepartment,
  getDashboardStats,
  getClusters,
  getComplaints,
  suggestComplaintCategory,
  getTopIssues,
  getUrgencyRanking,
  updateComplaintStatus,
} from "../controllers/complaintController.js";

const router = express.Router();

// POST /api/complaints
router.post("/complaints", createComplaint);

// GET /api/complaints
router.get("/complaints", getComplaints);

// GET /api/complaint-categories
router.get("/complaint-categories", getComplaintCategories);

// POST /api/complaint-categories/suggest
router.post("/complaint-categories/suggest", suggestComplaintCategory);

// GET /api/complaints/by-department
router.get("/complaints/by-department", getComplaintsByDepartment);

// PUT /api/complaints/:id/status
router.put("/complaints/:id/status", updateComplaintStatus);

// GET /api/dashboard-stats
router.get("/dashboard-stats", getDashboardStats);

// GET /api/top-issues
router.get("/top-issues", getTopIssues);

// GET /api/urgency-ranking
router.get("/urgency-ranking", getUrgencyRanking);

// GET /api/clusters
router.get("/clusters", getClusters);

export default router;


import mongoose from "mongoose";

const { Schema } = mongoose;

const ComplaintSchema = new Schema(
  {
    originalText: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    department: {
      type: String,
      enum: [
        "Sanitation",
        "Roads",
        "Water",
        "Electricity",
        "Animal Control",
        "Illegal Construction",
        "Other",
      ],
      default: "Other",
    },
    urgencyScore: {
      type: Number,
      min: 1,
      max: 10,
    },
    priorityScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    sentiment: {
      type: String,
      enum: ["Very Negative", "Negative", "Neutral", "Positive", "Very Positive"],
    },
    predictedResolutionDays: {
      type: Number,
      min: 0,
    },
    keyTags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Closed"],
      default: "Pending",
    },
    // GeoJSON Point: [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        // [lng, lat]
      },
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index enables radius/near queries on GeoJSON coordinates
ComplaintSchema.index({ location: "2dsphere" });

const Complaint = mongoose.model("Complaint", ComplaintSchema);

export default Complaint;


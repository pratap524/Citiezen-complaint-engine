import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    organization: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["citizen", "government"],
      default: "citizen",
      required: true,
    },
    governmentAuthorityId: {
      type: String,
      default: "",
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

export default User;

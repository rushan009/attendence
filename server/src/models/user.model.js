import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "teacher"],
      default: "teacher",
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approved: {
      type: Boolean,
      default: false,
    },
    pinHash: {
      type: String,
      required: true,
      select: false,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.pinHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Helper method to check if user account is currently locked
UserSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;

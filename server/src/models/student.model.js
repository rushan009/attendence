import mongoose from "mongoose";

const { Schema } = mongoose;

const StudentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    roll: {
      type: Number,
      required: [true, "Roll number is required"],
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
      index: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    guardianPhone: {
      type: String,
      trim: true,
      default: "",
    },
    guardianName: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// A roll number must be unique within a class
StudentSchema.index({ class: 1, roll: 1 }, { unique: true });

const Student = mongoose.models.Student || mongoose.model("Student", StudentSchema);

export default Student;

import mongoose from "mongoose";

const { Schema } = mongoose;

const ClassSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    section: { type: String, default: "", trim: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

ClassSchema.index({ name: 1, section: 1 }, { unique: true });

const Class = mongoose.models.Class || mongoose.model("Class", ClassSchema);

export default Class;

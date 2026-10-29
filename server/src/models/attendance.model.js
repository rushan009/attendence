import mongoose from "mongoose";

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const AttendanceSchema = new Schema(
  {
    class: { type: ObjectId, ref: "Class", required: true },
    dateBs: { type: String, required: true }, // e.g. "2083-07-15"
    dateAd: { type: Date, required: true },
    present: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    absentees: [{ type: ObjectId, ref: "Student" }], // only absent student IDs are stored
    teacher: { type: ObjectId, ref: "User", required: true }, // who took it
    editedBy: { type: ObjectId, ref: "User" }, // last editor (audit)
    editedAt: { type: Date },
  },
  { timestamps: true }
);

AttendanceSchema.index({ class: 1, dateBs: 1 }, { unique: true });

const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);

export default Attendance;

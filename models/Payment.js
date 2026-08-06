import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    semester: { type: Number, required: true },
    hoursTaught: { type: Number, required: true, default: 0 },
    ratePerHour: { type: Number, required: true, default: 1500 },
    amount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    paymentDate: { type: Date },
    referenceNo: { type: String, trim: true },
    remarks: { type: String, trim: true },
  },
  { timestamps: true },
);

export default mongoose.models.Payment ||
  mongoose.model("Payment", PaymentSchema);

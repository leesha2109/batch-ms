import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import "@/lib/modelsRegistry";
import Payment from "@/models/Payment";

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // Next.js dynamic params must be awaited

    const body = await request.json();
    const update = { ...body };

    const existingPayment = await Payment.findById(id);
    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (
      update.hoursTaught !== undefined &&
      update.ratePerHour !== undefined &&
      update.amount === undefined
    ) {
      update.amount = Number(update.hoursTaught) * Number(update.ratePerHour);
    }

    if (update.status === "paid" && !update.paymentDate) {
      update.paymentDate = new Date();
    }
    if (update.status === "pending") {
      update.paymentDate = null;
    }

    const lecturer = update.lecturer || existingPayment.lecturer;
    const batch = update.batch || existingPayment.batch;
    const subject = update.subject || existingPayment.subject;
    const semester = Number(update.semester ?? existingPayment.semester);

    if (update.status === "paid") {
      const duplicatePaid = await Payment.findOne({
        _id: { $ne: id },
        lecturer,
        batch,
        subject,
        semester,
        status: "paid",
      });

      if (duplicatePaid) {
        return NextResponse.json(
          {
            error:
              "A paid payment already exists for this lecturer, batch, subject and semester.",
          },
          { status: 400 },
        );
      }
    }

    const payment = await Payment.findByIdAndUpdate(id, update, {
      new: true,
    })
      .populate("lecturer", "name email")
      .populate("batch", "name degreeProgram")
      .populate("subject", "name code");

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (err) {
    console.error("PATCH /api/payments/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const deleted = await Payment.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/payments/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 },
    );
  }
}

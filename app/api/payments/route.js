import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import "@/lib/modelsRegistry";
import Payment from "@/models/Payment";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const batch = searchParams.get("batch");
    const lecturer = searchParams.get("lecturer");

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (batch && batch !== "all") filter.batch = batch;
    if (lecturer && lecturer !== "all") filter.lecturer = lecturer;

    const payments = await Payment.find(filter)
      .populate("lecturer", "name email")
      .populate("batch", "name degreeProgram")
      .populate("subject", "name code")
      .sort({ createdAt: -1 });

    return NextResponse.json({ payments });
  } catch (err) {
    console.error("GET /api/payments error:", err);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const {
      lecturer,
      batch,
      subject,
      semester,
      hoursTaught,
      ratePerHour,
      amount,
      status,
      paymentDate,
      referenceNo,
      remarks,
    } = body;

    if (!lecturer || !batch || !subject || !semester) {
      return NextResponse.json(
        { error: "Lecturer, batch, subject and semester are required" },
        { status: 400 },
      );
    }

    const rate =
      ratePerHour !== undefined && ratePerHour !== null && ratePerHour !== ""
        ? Number(ratePerHour)
        : 1500;

    const computedAmount =
      amount !== undefined && amount !== null && amount !== ""
        ? Number(amount)
        : Number(hoursTaught || 0) * rate;

    const existingPaid = await Payment.findOne({
      lecturer,
      batch,
      subject,
      semester,
      status: "paid",
    });

    if (existingPaid) {
      return NextResponse.json(
        {
          error:
            "A completed payment already exists for this lecturer, batch, subject and semester.",
        },
        { status: 400 },
      );
    }

    const payment = await Payment.create({
      lecturer,
      batch,
      subject,
      semester,
      hoursTaught: Number(hoursTaught || 0),
      ratePerHour: rate,
      amount: computedAmount,
      status: status || "pending",
      paymentDate: status === "paid" ? paymentDate || new Date() : null,
      referenceNo,
      remarks,
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (err) {
    console.error("POST /api/payments error:", err);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}

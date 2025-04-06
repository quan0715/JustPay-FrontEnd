import { NextRequest, NextResponse } from "next/server";
import { getAggregatedSignatureDataBySignature } from "@/app/_actions/signatureAggregateAction";

// POST 請求處理函數，用於根據簽名搜索交易
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signature } = body;

    if (!signature) {
      return NextResponse.json(
        { error: "Signature is required" },
        { status: 400 }
      );
    }

    const aggregatedData = await getAggregatedSignatureDataBySignature(
      signature
    );

    if (!aggregatedData) {
      return NextResponse.json(
        { error: "No data found for the provided signature" },
        { status: 404 }
      );
    }

    return NextResponse.json(aggregatedData);
  } catch (error) {
    console.error("Error searching signature:", error);
    return NextResponse.json(
      { error: "Failed to search signature" },
      { status: 500 }
    );
  }
}

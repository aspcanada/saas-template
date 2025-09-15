import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: "priceId is required" },
        { status: 400 }
      );
    }

    // Mock response - in a real app, this would create a Stripe checkout session
    const mockCheckoutUrl = `https://billing.example/checkout?priceId=${priceId}&sessionId=mock_${Date.now()}`;

    return NextResponse.json({
      url: mockCheckoutUrl,
      priceId,
      sessionId: `mock_${Date.now()}`,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

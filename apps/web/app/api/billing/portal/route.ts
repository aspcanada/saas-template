import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Mock response - in a real app, this would create a Stripe customer portal session
    const mockPortalUrl = `https://billing.example/portal?customerId=mock_customer_${Date.now()}`;

    return NextResponse.json({
      url: mockPortalUrl,
      customerId: `mock_customer_${Date.now()}`,
    });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}

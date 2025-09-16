"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: "primary" | "secondary";
  popular?: boolean;
  priceId?: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface Entitlement {
  plan: "FREE" | "PRO" | "BUSINESS";
  status: string;
  currentPeriodEnd: number | null;
  mock?: boolean;
}

// Check if Stripe is configured
const isStripeConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_STRIPE_PRICE_FREE ||
    process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ||
    process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS
  );
};

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Up to 5 notes",
      "Basic templates",
      "Community support",
      "1GB storage",
    ],
    buttonText: "Current Plan",
    buttonVariant: "secondary",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FREE,
    disabled: !process.env.NEXT_PUBLIC_STRIPE_PRICE_FREE,
    disabledReason: "Free plan is always available",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    description: "For growing teams",
    features: [
      "Unlimited notes",
      "Advanced templates",
      "Priority support",
      "10GB storage",
      "Team collaboration",
      "API access",
    ],
    buttonText: "Choose Plan",
    buttonVariant: "primary",
    popular: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    disabled: !process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    disabledReason: "Stripe not configured",
  },
  {
    id: "business",
    name: "Business",
    price: "$99",
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "Custom integrations",
      "Dedicated support",
      "Unlimited storage",
      "Advanced analytics",
      "SSO integration",
      "Custom branding",
    ],
    buttonText: "Choose Plan",
    buttonVariant: "secondary",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS,
    disabled: !process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS,
    disabledReason: "Stripe not configured",
  },
];

export default function BillingPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [entitlementLoading, setEntitlementLoading] = useState(true);

  // Fetch current entitlement
  useEffect(() => {
    const fetchEntitlement = async () => {
      try {
        const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:4000";
        const token = await getToken();
        
        if (!token) {
          setEntitlementLoading(false);
          return;
        }

        const response = await fetch(`${apiBaseUrl}/billing/entitlement`, {
          method: "GET",
          headers: { 
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setEntitlement(data);
        } else {
          console.error("Failed to fetch entitlement:", response.status);
        }
      } catch (error) {
        console.error("Failed to fetch entitlement:", error);
      } finally {
        setEntitlementLoading(false);
      }
    };

    fetchEntitlement();
  }, [getToken]);

  // Map plan names
  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case "FREE": return "Free";
      case "PRO": return "Pro";
      case "BUSINESS": return "Business";
      default: return plan;
    }
  };

  const getCurrentPlan = () => {
    if (!entitlement) return null;
    return plans.find(plan => {
      switch (entitlement.plan) {
        case "FREE": return plan.id === "free";
        case "PRO": return plan.id === "pro";
        case "BUSINESS": return plan.id === "business";
        default: return false;
      }
    });
  };

  const handleChoosePlan = async (plan: Plan) => {
    if (plan.disabled) {
      alert(plan.disabledReason || "This plan is not available");
      return;
    }

    if (!plan.priceId) {
      alert("Price ID not configured for this plan");
      return;
    }

    setLoading(plan.id);
    try {
      const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:4000";
      const token = await getToken();
      
      const response = await fetch(`${apiBaseUrl}/billing/checkout`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId: plan.priceId }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.url) {
        if (data.mock) {
          alert(`Mock checkout URL: ${data.url}\n\nIn production, this would redirect to Stripe checkout.`);
        } else {
          // Redirect to real Stripe checkout
          window.location.href = data.url;
        }
      } else if (response.status === 401) {
        console.error("Authentication failed. Please sign in again.");
        alert("Authentication failed. Please sign in again.");
      } else {
        alert(`Failed to create checkout session: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      alert("Failed to create checkout session");
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading("manage");
    try {
      const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:4000";
      const token = await getToken();
      
      const response = await fetch(`${apiBaseUrl}/billing/portal`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.url) {
        if (data.mock) {
          alert(`Mock billing portal URL: ${data.url}\n\nIn production, this would redirect to Stripe customer portal.`);
        } else {
          // Redirect to real Stripe customer portal
          window.location.href = data.url;
        }
      } else if (response.status === 401) {
        console.error("Authentication failed. Please sign in again.");
        alert("Authentication failed. Please sign in again.");
      } else {
        alert(`Failed to create portal session: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create portal session:", error);
      alert("Failed to create portal session");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Select the perfect plan for your needs
        </p>
      </div>

      {/* Stripe Configuration Status */}
      {!isStripeConfigured() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Stripe Not Configured</h3>
              <p className="text-yellow-700">
                Billing features are in demo mode. To enable real payments, configure Stripe environment variables.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Current Plan</h3>
            {entitlementLoading ? (
              <p className="text-blue-700">Loading...</p>
            ) : entitlement ? (
              <div>
                <p className="text-blue-700">
                  You&apos;re currently on the {getPlanDisplayName(entitlement.plan)} plan
                  {entitlement.mock && " (Demo Mode)"}
                </p>
                {entitlement.currentPeriodEnd && (
                  <p className="text-sm text-blue-600 mt-1">
                    Next billing date: {new Date(entitlement.currentPeriodEnd * 1000).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-blue-700">Unable to load current plan</p>
            )}
          </div>
          <button
            onClick={handleManageBilling}
            disabled={loading === "manage" || entitlementLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading === "manage" ? "Loading..." : "Manage Billing"}
          </button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => {
          const currentPlan = getCurrentPlan();
          const isCurrentPlan = currentPlan?.id === plan.id;
          const isUpgrade = currentPlan && 
            ((currentPlan.id === "free" && plan.id === "pro") ||
             (currentPlan.id === "free" && plan.id === "business") ||
             (currentPlan.id === "pro" && plan.id === "business"));
          const isDowngrade = currentPlan && 
            ((currentPlan.id === "pro" && plan.id === "free") ||
             (currentPlan.id === "business" && plan.id === "free") ||
             (currentPlan.id === "business" && plan.id === "pro"));

          let buttonText = plan.buttonText;
          let buttonVariant = plan.buttonVariant;

          if (isCurrentPlan) {
            buttonText = "Current Plan";
            buttonVariant = "secondary";
          } else if (isUpgrade) {
            buttonText = "Upgrade";
            buttonVariant = "primary";
          } else if (isDowngrade) {
            buttonText = "Downgrade";
            buttonVariant = "secondary";
          }

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-lg p-8 ${
                plan.popular ? "ring-2 ring-indigo-500" : ""
              } ${isCurrentPlan ? "ring-2 ring-blue-500" : ""}`}
            >
              {plan.popular && !isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {plan.price}
                  <span className="text-lg font-normal text-gray-500">/month</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleChoosePlan(plan)}
                disabled={loading === plan.id || plan.disabled || isCurrentPlan}
                title={plan.disabled ? plan.disabledReason : isCurrentPlan ? "This is your current plan" : undefined}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  buttonVariant === "primary"
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                }`}
              >
                {loading === plan.id ? "Processing..." : buttonText}
              </button>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="text-center text-gray-600">
        <p className="mb-2">
          All plans include a 14-day free trial. No credit card required.
        </p>
        <p>
          Need help choosing?{" "}
          <a href="#" className="text-indigo-600 hover:text-indigo-500">
            Contact our sales team
          </a>
        </p>
      </div>
    </div>
  );
}

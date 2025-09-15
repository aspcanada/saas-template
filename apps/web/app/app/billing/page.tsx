"use client";

import { useState } from "react";
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
}

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
    buttonText: "Choose Plan",
    buttonVariant: "secondary",
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
  },
  {
    id: "enterprise",
    name: "Enterprise",
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
  },
];

export default function BillingPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleChoosePlan = async (planId: string) => {
    setLoading(planId);
    try {
      const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:4000";
      const token = await getToken();
      
      const response = await fetch(`${apiBaseUrl}/billing/checkout`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId: planId }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.url) {
        // In a real app, you'd redirect to Stripe checkout
        alert(`Redirecting to checkout: ${data.url}`);
        // window.location.href = data.url;
      } else if (response.status === 401) {
        console.error("Authentication failed. Please sign in again.");
        alert("Authentication failed. Please sign in again.");
      } else {
        alert("Failed to create checkout session");
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
        // In a real app, you'd redirect to Stripe customer portal
        alert(`Redirecting to billing portal: ${data.url}`);
        // window.location.href = data.url;
      } else if (response.status === 401) {
        console.error("Authentication failed. Please sign in again.");
        alert("Authentication failed. Please sign in again.");
      } else {
        alert("Failed to create portal session");
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

      {/* Current Plan Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Current Plan</h3>
            <p className="text-blue-700">You're currently on the Free plan</p>
          </div>
          <button
            onClick={handleManageBilling}
            disabled={loading === "manage"}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading === "manage" ? "Loading..." : "Manage Billing"}
          </button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-lg shadow-lg p-8 ${
              plan.popular ? "ring-2 ring-indigo-500" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
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
              onClick={() => handleChoosePlan(plan.id)}
              disabled={loading === plan.id}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                plan.buttonVariant === "primary"
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              {loading === plan.id ? "Processing..." : plan.buttonText}
            </button>
          </div>
        ))}
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

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, TrendingUp, X, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  bookingLimit: number;
  serviceRadius: number;
  servicesAllowed: number;
  visibility: string;
  analytics: string;
  support: string;
  features: string[];
  isTrial: boolean;
  trialDays?: number;
}

interface Subscription {
  id: string;
  status: string;
  bookingsUsed: number;
  bookingLimit: number;
  startDate: string;
  endDate: string;
  trialEndsAt?: string;
  nextBillingDate?: string;
  plan: Plan;
}

export default function NurseSubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "upgrade" | "downgrade" | "cancel" | null;
    plan?: Plan;
  }>({ open: false, type: null });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.userType !== "NURSE") {
      router.push("/auth/signin");
      return;
    }
    loadData();
  }, [session, status, router]);

  const loadData = async () => {
    try {
      const [plansRes, statusRes] = await Promise.all([
        fetch("/api/subscriptions/plans"),
        fetch("/api/subscriptions/status"),
      ]);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.hasSubscription) {
          setSubscription(statusData.subscription);
        }
      }
    } catch (error) {
      console.error("Failed to load subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setProcessingPlan("trial");
    try {
      const res = await fetch("/api/subscriptions/trial", { method: "POST" });
      if (res.ok) {
        alert("Trial started successfully!");
        loadData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to start trial");
      }
    } catch (error) {
      alert("Failed to start trial");
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setProcessingPlan(planId);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          alert("Payment URL not received. Please contact support.");
        }
      } else {
        const error = await res.json();
        alert(error.error || "Failed to start subscription");
      }
    } catch (error: any) {
      console.error('Subscribe error:', error);
      alert(error.message || "Failed to start subscription");
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleChangePlan = (plan: Plan) => {
    if (!subscription) return;
    
    const isOnTrial = subscription.status === "TRIAL" || subscription.plan.isTrial;
    const isUpgrade = isOnTrial || plan.price > subscription.plan.price;
    const isDowngrade = !isOnTrial && plan.price < subscription.plan.price;
    
    setConfirmDialog({
      open: true,
      type: isUpgrade ? "upgrade" : "downgrade",
      plan,
    });
  };

  const handleCancelClick = () => {
    setConfirmDialog({
      open: true,
      type: "cancel",
    });
  };

  const confirmChangePlan = async () => {
    if (!confirmDialog.plan) return;
    
    setProcessingPlan(confirmDialog.plan.id);
    setConfirmDialog({ open: false, type: null });
    
    try {
      const res = await fetch("/api/subscriptions/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlanId: confirmDialog.plan.id }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          alert("Plan changed successfully!");
          loadData();
        }
      } else {
        const error = await res.json();
        alert(error.error || "Failed to change plan");
      }
    } catch (error) {
      alert("Failed to change plan");
    } finally {
      setProcessingPlan(null);
    }
  };

  const confirmCancelSubscription = async () => {
    setConfirmDialog({ open: false, type: null });
    
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "User requested cancellation" }),
      });

      if (res.ok) {
        alert("Subscription cancelled successfully");
        loadData();
      } else {
        alert("Failed to cancel subscription");
      }
    } catch (error) {
      alert("Failed to cancel subscription");
    }
  };

  const getPlanIcon = (slug: string) => {
    if (slug === "trial") return "🎯";
    if (slug === "basic") return "📦";
    if (slug === "growth") return "🚀";
    if (slug === "premium") return "👑";
    return "📋";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Subscription Plans
          </h1>
          <p className="text-muted-foreground">
            Choose the plan that fits your nursing practice
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscription && (
          <Card className="mb-6 border-primary">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">Current Plan: {subscription.plan.name}</h3>
                    <Badge className={
                      subscription.status === "ACTIVE" ? "bg-green-500" :
                      subscription.status === "TRIAL" ? "bg-blue-500" :
                      subscription.status === "PAUSED" ? "bg-yellow-500" :
                      "bg-gray-500"
                    }>
                      {subscription.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      Bookings: {subscription.bookingsUsed} / {subscription.bookingLimit === -1 ? "Unlimited" : subscription.bookingLimit}
                    </p>
                    {subscription.endDate && (
                      <p>Valid until: {new Date(subscription.endDate).toLocaleDateString()}</p>
                    )}
                    {subscription.nextBillingDate && (
                      <p>Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                {subscription.status === "ACTIVE" && (
                  <Button variant="outline" size="sm" onClick={handleCancelClick}>
                    Cancel Plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan.id === plan.id;
            const canSubscribe = !subscription || subscription.status === "EXPIRED" || subscription.status === "CANCELLED";
            const isOnTrial = subscription?.status === "TRIAL" || subscription?.plan.isTrial;
            const canChangePlan = subscription && (subscription.status === "ACTIVE" || subscription.status === "TRIAL") && !isCurrentPlan && !plan.isTrial;
            const isProcessing = processingPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  isCurrentPlan ? "border-primary border-2" : ""
                } ${plan.slug === "premium" ? "border-yellow-500" : ""}`}
              >
                {plan.slug === "premium" && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500 to-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="text-4xl mb-2">{getPlanIcon(plan.slug)}</div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    {plan.isTrial ? (
                      <div>
                        <span className="text-3xl font-bold">FREE</span>
                        <p className="text-sm text-muted-foreground">{plan.trialDays} days trial</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold">PKR {plan.price.toLocaleString()}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key Stats */}
                  <div className="space-y-2 pb-4 border-b">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bookings</span>
                      <span className="font-semibold">
                        {plan.bookingLimit === -1 ? "Unlimited" : `${plan.bookingLimit}/month`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Radius</span>
                      <span className="font-semibold">
                        {plan.serviceRadius === -1 ? "Unlimited" : `${plan.serviceRadius} KM`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Services</span>
                      <span className="font-semibold">
                        {plan.servicesAllowed === -1 ? "Unlimited" : plan.servicesAllowed}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {plan.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className="w-full mt-4"
                    variant={plan.slug === "premium" ? "default" : "outline"}
                    disabled={isCurrentPlan || isProcessing || (!canSubscribe && !canChangePlan && !plan.isTrial)}
                    onClick={() => {
                      if (plan.isTrial) {
                        handleStartTrial();
                      } else if (canChangePlan) {
                        handleChangePlan(plan);
                      } else {
                        handleSubscribe(plan.id);
                      }
                    }}
                  >
                    {isProcessing ? (
                      "Processing..."
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : canChangePlan ? (
                      isOnTrial ? "Upgrade to Paid" : (plan.price > (subscription?.plan.price || 0) ? "Upgrade" : "Downgrade")
                    ) : plan.isTrial ? (
                      "Start Free Trial"
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Can I change my plan later?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">What happens when I reach my booking limit?</h3>
                <p className="text-sm text-muted-foreground">
                  Your account will be paused until you upgrade to a higher plan or wait for the next billing cycle.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">How do payments work?</h3>
                <p className="text-sm text-muted-foreground">
                  We use SafePay for secure payments. You can pay via Easypaisa, JazzCash, or credit/debit cards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, type: null })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                {confirmDialog.type === "cancel" ? "Cancel Subscription" :
                 confirmDialog.type === "upgrade" ? "Upgrade Plan" : "Downgrade Plan"}
              </DialogTitle>
              <DialogDescription className="pt-4">
                {confirmDialog.type === "cancel" ? (
                  <div className="space-y-3">
                    <p>Are you sure you want to cancel your subscription?</p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">What happens next:</p>
                      <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                        <li>Your subscription will be cancelled immediately</li>
                        <li>You'll lose access to premium features</li>
                        <li>You won't be able to accept new bookings</li>
                        <li>No refunds for the current billing period</li>
                      </ul>
                    </div>
                  </div>
                ) : confirmDialog.type === "upgrade" ? (
                  <div className="space-y-3">
                    <p>You're upgrading to <strong>{confirmDialog.plan?.name}</strong> plan.</p>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-green-800 dark:text-green-200 mb-1">What happens next:</p>
                      <ul className="list-disc list-inside space-y-1 text-green-700 dark:text-green-300">
                        <li>Your current plan will be cancelled</li>
                        <li>New plan starts immediately after payment</li>
                        <li>You'll get {confirmDialog.plan?.bookingLimit === -1 ? "unlimited" : confirmDialog.plan?.bookingLimit} bookings/month</li>
                        <li>New billing cycle begins today</li>
                      </ul>
                    </div>
                    <p className="text-sm font-semibold">New Price: PKR {confirmDialog.plan?.price.toLocaleString()}/month</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p>You're downgrading to <strong>{confirmDialog.plan?.name}</strong> plan.</p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1">What happens next:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                        <li>Your current plan will be cancelled</li>
                        <li>New plan starts immediately after payment</li>
                        <li>You'll get {confirmDialog.plan?.bookingLimit === -1 ? "unlimited" : confirmDialog.plan?.bookingLimit} bookings/month</li>
                        <li>Some premium features may be removed</li>
                      </ul>
                    </div>
                    <p className="text-sm font-semibold">New Price: PKR {confirmDialog.plan?.price.toLocaleString()}/month</p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ open: false, type: null })}
                className="w-full sm:w-auto"
              >
                Go Back
              </Button>
              <Button
                variant={confirmDialog.type === "cancel" ? "destructive" : "default"}
                onClick={confirmDialog.type === "cancel" ? confirmCancelSubscription : confirmChangePlan}
                className="w-full sm:w-auto"
              >
                {confirmDialog.type === "cancel" ? "Yes, Cancel Subscription" :
                 confirmDialog.type === "upgrade" ? "Confirm Upgrade" : "Confirm Downgrade"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

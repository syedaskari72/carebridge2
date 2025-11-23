"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, Clock } from "lucide-react";

export default function NurseEarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.userType !== "NURSE") {
      router.push("/");
      return;
    }

    loadEarnings();
  }, [session, status, router]);

  const loadEarnings = async () => {
    try {
      const response = await fetch("/api/nurse/earnings");
      if (response.ok) {
        const data = await response.json();
        setEarnings(data);
      } else {
        setEarnings({
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          total: 0,
          recentPayments: []
        });
      }
    } catch (error) {
      console.error("Error loading earnings:", error);
      setEarnings({
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0,
        recentPayments: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.userType !== "NURSE") {
    return null;
  }

  return (
    <div className="w-full overflow-x-hidden bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-0 pb-4 sm:pb-8">
        <div className="mb-6 sm:mb-8 pt-6 sm:pt-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            My Earnings
          </h1>
          <p className="text-muted-foreground">Track your income and payments</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-muted-foreground">Today</p>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                PKR {earnings?.today || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-muted-foreground">This Week</p>
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                PKR {earnings?.thisWeek || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-muted-foreground">This Month</p>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                PKR {earnings?.thisMonth || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                <DollarSign className="h-4 w-4 text-cyan-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                PKR {earnings?.total || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {!earnings?.recentPayments || earnings.recentPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">💰</div>
                <p>No payments yet</p>
                <p className="text-sm mt-2">Complete bookings to start earning</p>
              </div>
            ) : (
              <div className="space-y-3">
                {earnings.recentPayments.map((payment: any) => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {payment.patientName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {payment.serviceType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          PKR {payment.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{payment.duration} minutes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

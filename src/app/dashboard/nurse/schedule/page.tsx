"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User } from "lucide-react";

interface ScheduleItem {
  id: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  address: string;
  patient: {
    user: {
      name: string;
    };
  };
}

export default function NurseSchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.userType !== "NURSE") {
      router.push("/auth/signin");
      return;
    }

    loadSchedule();
  }, [session, status, router]);

  const loadSchedule = async () => {
    try {
      const res = await fetch("/api/bookings?scope=nurse");
      if (res.ok) {
        const data = await res.json();
        // Filter for upcoming appointments
        const upcoming = data.filter((item: ScheduleItem) => 
          new Date(item.appointmentDate) >= new Date() && 
          ["CONFIRMED", "IN_PROGRESS"].includes(item.status)
        );
        setSchedule(upcoming);
      }
    } catch (e) {
      console.error("Failed to load schedule:", e);
    } finally {
      setLoading(false);
    }
  };

  const groupByDate = (items: ScheduleItem[]) => {
    const groups: { [key: string]: ScheduleItem[] } = {};
    items.forEach(item => {
      const date = new Date(item.appointmentDate).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "bg-green-100 text-green-800";
      case "IN_PROGRESS": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading schedule...</p>
        </div>
      </div>
    );
  }

  const groupedSchedule = groupByDate(schedule);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Schedule</h1>
        <p className="text-muted-foreground">Your upcoming appointments and visits</p>
      </div>

      {Object.keys(groupedSchedule).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-xl font-semibold mb-2">No upcoming appointments</h2>
            <p className="text-muted-foreground">Your schedule is clear for the upcoming days.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSchedule).map(([date, items]) => (
            <div key={date}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              
              <div className="space-y-3">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-xl">
                              {item.serviceType === "NURSE_VISIT" ? "👩‍⚕️" : "🧪"}
                            </div>
                            <div>
                              <h3 className="font-semibold">{item.patient.user.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {item.serviceType === "NURSE_VISIT" ? "Nurse Visit" : 
                                 item.serviceType === "LAB_SERVICE" ? "Lab Service" : 
                                 item.serviceType}
                              </p>
                            </div>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{item.appointmentTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{item.address}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {item.status === "CONFIRMED" ? "Ready to start" : "In progress"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

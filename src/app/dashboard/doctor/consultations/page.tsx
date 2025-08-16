"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Phone, MessageSquare, Clock, User, FileText } from "lucide-react";

interface Consultation {
  id: string;
  type: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  followUp?: string;
  cost: number;
  createdAt: string;
  patient: {
    user: {
      name: string;
      email: string;
    };
  };
  booking?: {
    id: string;
    serviceType: string;
    status: string;
  };
}

export default function DoctorConsultationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.userType !== "DOCTOR") {
      router.push("/auth/signin");
      return;
    }

    loadConsultations();
  }, [session, status, router]);

  const loadConsultations = async () => {
    try {
      const res = await fetch("/api/doctor/consultations");
      if (res.ok) {
        const data = await res.json();
        setConsultations(data);
      }
    } catch (e) {
      console.error("Failed to load consultations:", e);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ROUTINE": return <FileText className="w-4 h-4" />;
      case "EMERGENCY": return <Phone className="w-4 h-4" />;
      case "FOLLOW_UP": return <Clock className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ROUTINE": return "bg-blue-100 text-blue-800";
      case "EMERGENCY": return "bg-red-100 text-red-800";
      case "FOLLOW_UP": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Consultations</h1>
        <p className="text-muted-foreground">Manage your patient consultations and follow-ups</p>
      </div>

      {consultations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🩺</div>
            <h2 className="text-xl font-semibold mb-2">No consultations yet</h2>
            <p className="text-muted-foreground">You don't have any patient consultations at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <Card key={consultation.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(consultation.type)}
                        <Badge className={getTypeColor(consultation.type)}>
                          {consultation.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{consultation.patient.user.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(consultation.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {consultation.diagnosis && (
                      <div className="mb-3">
                        <h4 className="font-semibold text-sm mb-1">Diagnosis:</h4>
                        <p className="text-sm text-muted-foreground">{consultation.diagnosis}</p>
                      </div>
                    )}

                    {consultation.treatment && (
                      <div className="mb-3">
                        <h4 className="font-semibold text-sm mb-1">Treatment:</h4>
                        <p className="text-sm text-muted-foreground">{consultation.treatment}</p>
                      </div>
                    )}

                    {consultation.notes && (
                      <div className="mb-3">
                        <h4 className="font-semibold text-sm mb-1">Notes:</h4>
                        <p className="text-sm text-muted-foreground">{consultation.notes}</p>
                      </div>
                    )}

                    {consultation.followUp && (
                      <div className="mb-3">
                        <h4 className="font-semibold text-sm mb-1">Follow-up:</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(consultation.followUp).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {consultation.booking && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Related Booking:</strong> {consultation.booking.serviceType} 
                          <Badge variant="outline" className="ml-2">
                            {consultation.booking.status}
                          </Badge>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold text-primary mb-2">
                      PKR {consultation.cost.toLocaleString()}
                    </div>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full">
                        <Video className="w-4 h-4 mr-1" />
                        Video Call
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

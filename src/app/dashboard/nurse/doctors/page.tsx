"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, MessageSquare } from "lucide-react";
import { createChatId } from "@/lib/chatUtils";

export default function NurseDoctorsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

    loadDoctors();
  }, [session, status, router]);

  const loadDoctors = async () => {
    try {
      const response = await fetch("/api/doctors/all");
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading doctors...</p>
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
            Doctors Directory
          </h1>
          <p className="text-muted-foreground">Contact doctors for consultations and guidance</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search doctors by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {filteredDoctors.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <div className="text-4xl mb-2">👨‍⚕️</div>
              <p>No doctors found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
                      {doctor.user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Dr. {doctor.user.name}</h3>
                      <p className="text-sm text-muted-foreground">{doctor.department}</p>
                      {doctor.specialization && (
                        <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                      )}
                    </div>
                    <Badge variant="default" className="text-xs">
                      Doctor
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    {doctor.experience && doctor.experience !== "0" && (
                      <p className="text-muted-foreground">
                        <strong>Experience:</strong> {doctor.experience}
                      </p>
                    )}

                    {doctor.consultationFee && doctor.consultationFee > 0 && (
                      <p className="text-green-600 font-medium">
                        PKR {doctor.consultationFee} consultation fee
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push(`/chat/${createChatId(session.user.id, doctor.userId)}`)}
                      className="flex-1"
                      size="sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                    {doctor.user.phone && (
                      <Button
                        onClick={() => window.location.href = `tel:${doctor.user.phone}`}
                        variant="outline"
                        size="sm"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

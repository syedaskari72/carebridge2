"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Shield, Phone, Mail, Calendar } from "lucide-react";

interface NurseProfile {
  id: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  department: string;
  isVerified: boolean;
  rating: number;
  specialties: string[];
  experience: string;
  hourlyRate: number;
  location: string;
  bio?: string;
  isAvailable: boolean;
  licenseNumber: string;
}

export default function NurseProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [nurse, setNurse] = useState<NurseProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNurse = async () => {
      try {
        const res = await fetch(`/api/nurses/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setNurse(data);
        } else {
          console.error("Failed to load nurse profile");
        }
      } catch (e) {
        console.error("Error loading nurse:", e);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadNurse();
    }
  }, [params.id]);

  const handleBookNurse = () => {
    router.push(`/book/nurse?nurse=${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading nurse profile...</p>
        </div>
      </div>
    );
  }

  if (!nurse) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Nurse Not Found</h1>
          <p className="text-muted-foreground mb-6">The nurse profile you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/nurses")}>Back to Nurses</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Back
        </Button>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-4xl">
                  👩‍⚕️
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                      {nurse.user.name}
                      {nurse.isVerified && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </h1>
                    <p className="text-xl text-muted-foreground">{nurse.department}</p>
                    <p className="text-sm text-muted-foreground">License: {nurse.licenseNumber}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="font-semibold">{nurse.rating}</span>
                      <span className="text-sm text-muted-foreground">(120+ reviews)</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">PKR {nurse.hourlyRate}/hour</p>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {nurse.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {nurse.experience} experience
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {nurse.isAvailable ? "Available Now" : "Unavailable"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {nurse.bio || `Experienced ${nurse.department.toLowerCase()} nurse with ${nurse.experience} of professional healthcare experience. Dedicated to providing compassionate, high-quality care to patients in their homes.`}
              </p>
            </CardContent>
          </Card>

          {/* Specialties */}
          <Card>
            <CardHeader>
              <CardTitle>Specialties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {nurse.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-4 h-4 text-yellow-500 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">2 days ago</span>
                    </div>
                    <p className="text-sm">
                      "Excellent care and very professional. {nurse.user.name} was punctual, knowledgeable, and made me feel comfortable throughout the treatment."
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">- Patient {i}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Book Now */}
          <Card>
            <CardContent className="p-6">
              <Button 
                onClick={handleBookNurse} 
                className="w-full mb-4"
                disabled={!nurse.isAvailable}
              >
                {nurse.isAvailable ? "Book Now" : "Currently Unavailable"}
              </Button>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{nurse.user.phone || "Phone not available"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{nurse.user.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <span className="text-sm font-medium">&lt; 2 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-medium">98%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Patients</span>
                <span className="text-sm font-medium">150+</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

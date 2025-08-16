"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Star, User, Phone, Heart, Stethoscope } from "lucide-react";

interface Nurse {
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

const serviceTypes = [
  { id: "blood-pressure", name: "Blood Pressure Monitoring", duration: "30 min" },
  { id: "medication", name: "Medication Administration", duration: "45 min" },
  { id: "wound-care", name: "Wound Care", duration: "60 min" },
  { id: "diabetes-care", name: "Diabetes Management", duration: "45 min" },
  { id: "general-checkup", name: "General Health Checkup", duration: "60 min" },
  { id: "post-surgery", name: "Post-Surgery Care", duration: "90 min" }
];

function BookNurseContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedNurse, setSelectedNurse] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(1); // 1: Service, 2: Nurse, 3: Schedule, 4: Confirm
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loadingNurses, setLoadingNurses] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.userType !== "PATIENT") {
      router.push(`/dashboard/${session.user.userType.toLowerCase()}`);
      return;
    }

    // Load nurses when component mounts
    loadNurses();

    // Check if a nurse is pre-selected from URL params
    const preSelectedNurse = searchParams.get('nurse');
    if (preSelectedNurse) {
      setSelectedNurse(preSelectedNurse);
      setStep(3); // Skip to schedule step since nurse is already selected
    }
  }, [session, status, router, searchParams]);

  const loadNurses = async () => {
    setLoadingNurses(true);
    try {
      const res = await fetch("/api/nurses");
      if (res.ok) {
        const data = await res.json();
        setNurses(data);
      } else {
        console.error("Failed to load nurses");
      }
    } catch (e) {
      console.error("Error loading nurses:", e);
    } finally {
      setLoadingNurses(false);
    }
  };

  const handleBooking = async () => {
    try {
      if (!session) {
        return router.push("/auth/signin");
      }
      if (!selectedDate || !selectedTime || !selectedService) {
        alert("Please select service, date and time");
        return;
      }
      const payload = {
        serviceType: selectedService,
        nurseId: selectedNurse || null,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        urgencyLevel: "ROUTINE",
        address: "Not provided",
        notes: notes || null
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to create booking");
      }
      alert("Booking confirmed! You will receive a confirmation email shortly.");
      router.push("/bookings");
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to book appointment. Please try again.");
    }
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.userType !== "PATIENT") {
    return null;
  }

  const filteredNurses = selectedService
    ? nurses.filter(nurse => {
        if (!nurse.isAvailable || !nurse.isVerified) return false;

        const serviceMap: { [key: string]: string[] } = {
          "blood-pressure": ["CARDIOLOGY", "GENERAL"],
          "medication": ["GENERAL", "CARDIOLOGY", "PEDIATRICS"],
          "wound-care": ["GENERAL", "ORTHOPEDICS"],
          "diabetes-care": ["GENERAL", "CARDIOLOGY"],
          "general-checkup": ["GENERAL"],
          "post-surgery": ["GENERAL", "ORTHOPEDICS"]
        };
        return serviceMap[selectedService]?.includes(nurse.department);
      })
    : nurses.filter(nurse => nurse.isAvailable && nurse.isVerified);

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Book a Nurse</h1>
          <p className="text-muted-foreground">Schedule professional home healthcare</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto">
          {[
            { num: 1, label: "Service" },
            { num: 2, label: "Nurse" },
            { num: 3, label: "Schedule" },
            { num: 4, label: "Confirm" }
          ].map((stepItem) => (
            <div key={stepItem.num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepItem.num 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {stepItem.num}
              </div>
              <span className="ml-2 text-sm font-medium whitespace-nowrap">{stepItem.label}</span>
              {stepItem.num < 4 && <div className="w-8 h-px bg-border mx-4 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Service Type</CardTitle>
              <CardDescription>Choose the type of nursing care you need</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {serviceTypes.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedService === service.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <h3 className="font-semibold mb-1">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">Duration: {service.duration}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!selectedService}
                  className="w-full sm:w-auto"
                >
                  Continue to Nurse Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Nurse */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Nurse</CardTitle>
              <CardDescription>Select from our qualified healthcare professionals</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingNurses ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏳</div>
                  <p>Loading available nurses...</p>
                </div>
              ) : filteredNurses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👩‍⚕️</div>
                  <p>No nurses available for this service at the moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNurses.map((nurse) => (
                  <div
                    key={nurse.id}
                    onClick={() => setSelectedNurse(nurse.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedNurse === nurse.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{nurse.user.name}</h3>
                          {nurse.isVerified && (
                            <Badge variant="secondary" className="text-xs">Verified</Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{nurse.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{nurse.department} • {nurse.experience}</p>
                        <p className="text-sm mb-2">{nurse.bio || `Experienced ${nurse.department.toLowerCase()} nurse with professional healthcare experience.`}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {nurse.specialties.map((specialty) => (
                            <Badge key={specialty} variant="secondary" className="text-xs">{specialty}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-primary">PKR {nurse.hourlyRate}/hour</p>
                          <p className="text-xs text-muted-foreground">{nurse.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
              <div className="flex gap-4 mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!selectedNurse}
                  className="flex-1 sm:flex-none"
                >
                  Continue to Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Schedule Appointment</CardTitle>
              <CardDescription>Choose your preferred date and time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Preferred Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Preferred Time</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00">9:00 AM</SelectItem>
                      <SelectItem value="10:00">10:00 AM</SelectItem>
                      <SelectItem value="11:00">11:00 AM</SelectItem>
                      <SelectItem value="14:00">2:00 PM</SelectItem>
                      <SelectItem value="15:00">3:00 PM</SelectItem>
                      <SelectItem value="16:00">4:00 PM</SelectItem>
                      <SelectItem value="17:00">5:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific requirements or health information..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button 
                  onClick={() => setStep(4)} 
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1 sm:flex-none"
                >
                  Review Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Booking</CardTitle>
              <CardDescription>Review your appointment details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span>{serviceTypes.find(s => s.id === selectedService)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nurse:</span>
                      <span>{nurses.find(n => n.id === selectedNurse)?.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date(selectedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{serviceTypes.find(s => s.id === selectedService)?.duration}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Estimated Cost:</span>
                      <span>PKR {(() => {
                        const nurse = nurses.find(n => n.id === selectedNurse);
                        const service = serviceTypes.find(s => s.id === selectedService);
                        if (!nurse || !service) return 0;

                        // Calculate cost based on duration
                        const durationMinutes = parseInt(service.duration.split(' ')[0]);
                        const hourlyRate = nurse.hourlyRate;
                        const cost = (hourlyRate * durationMinutes) / 60;
                        return Math.round(cost);
                      })()}</span>
                    </div>
                  </div>
                </div>
                {notes && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Additional Notes</h4>
                    <p className="text-sm">{notes}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button onClick={handleBooking} className="flex-1 sm:flex-none">
                  Confirm Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function BookNursePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <BookNurseContent />
    </Suspense>
  );
}

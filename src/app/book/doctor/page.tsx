"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Star, User, Phone, Heart, Stethoscope, Video, Home } from "lucide-react";

// Mock data for available doctors
const mockDoctors = [
  {
    id: "1",
    name: "Dr. Ahmed Khan",
    specialization: "Cardiology",
    experience: "15 years",
    rating: 4.9,
    reviews: 234,
    consultationFee: 3500,
    availability: ["morning", "afternoon"],
    consultationType: ["video", "home"],
    image: "/api/placeholder/100/100",
    bio: "Senior cardiologist with expertise in heart disease management and preventive care.",
    qualifications: ["MBBS", "MD Cardiology", "FCPS"],
    hospital: "Aga Khan University Hospital"
  },
  {
    id: "2",
    name: "Dr. Sarah Ali",
    specialization: "Endocrinology",
    experience: "12 years",
    rating: 4.8,
    reviews: 189,
    consultationFee: 3000,
    availability: ["morning", "evening"],
    consultationType: ["video", "home"],
    image: "/api/placeholder/100/100",
    bio: "Specialist in diabetes, thyroid disorders, and hormonal imbalances.",
    qualifications: ["MBBS", "FCPS Endocrinology"],
    hospital: "Shaukat Khanum Memorial Hospital"
  },
  {
    id: "3",
    name: "Dr. Hassan Malik",
    specialization: "General Medicine",
    experience: "10 years",
    rating: 4.7,
    reviews: 156,
    consultationFee: 2500,
    availability: ["afternoon", "evening"],
    consultationType: ["video", "home"],
    image: "/api/placeholder/100/100",
    bio: "General physician with focus on preventive medicine and chronic disease management.",
    qualifications: ["MBBS", "FCPS Medicine"],
    hospital: "Liaquat National Hospital"
  }
];

const consultationTypes = [
  { 
    id: "video", 
    name: "Video Consultation", 
    duration: "30 min",
    description: "Online consultation via secure video call",
    icon: Video
  },
  { 
    id: "home", 
    name: "Home Visit", 
    duration: "60 min",
    description: "Doctor visits your home for examination",
    icon: Home
  }
];

const specializations = [
  "Cardiology",
  "Endocrinology", 
  "General Medicine",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Gynecology"
];

export default function BookDoctorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedConsultationType, setSelectedConsultationType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [step, setStep] = useState(1); // 1: Type & Specialization, 2: Doctor, 3: Schedule, 4: Confirm

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
  }, [session, status, router]);

  const handleBooking = async () => {
    try {
      const bookingData = {
        consultationType: selectedConsultationType,
        specialization: selectedSpecialization,
        doctorId: selectedDoctor,
        date: selectedDate,
        time: selectedTime,
        symptoms: symptoms,
        patientId: session?.user.id
      };

      // In a real app, this would be an API call
      console.log("Doctor booking data:", bookingData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert("Consultation booked successfully! You will receive confirmation details shortly.");
      router.push("/dashboard/patient");
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to book consultation. Please try again.");
    }
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.userType !== "PATIENT") {
    return null;
  }

  const filteredDoctors = selectedSpecialization 
    ? mockDoctors.filter(doctor => 
        doctor.specialization === selectedSpecialization &&
        doctor.consultationType.includes(selectedConsultationType)
      )
    : mockDoctors.filter(doctor => 
        doctor.consultationType.includes(selectedConsultationType)
      );

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Book a Doctor</h1>
          <p className="text-muted-foreground">Schedule medical consultation with specialists</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto">
          {[
            { num: 1, label: "Type" },
            { num: 2, label: "Doctor" },
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

        {/* Step 1: Select Consultation Type & Specialization */}
        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Consultation Type</CardTitle>
                <CardDescription>Choose how you'd like to consult with the doctor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {consultationTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <div
                        key={type.id}
                        onClick={() => setSelectedConsultationType(type.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedConsultationType === type.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <IconComponent className="h-6 w-6 text-primary" />
                          <h3 className="font-semibold">{type.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{type.description}</p>
                        <p className="text-sm font-medium">Duration: {type.duration}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Specialization (Optional)</CardTitle>
                <CardDescription>Select a medical specialty or choose General Medicine</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Button 
              onClick={() => setStep(2)} 
              disabled={!selectedConsultationType}
              className="w-full sm:w-auto"
            >
              Continue to Doctor Selection
            </Button>
          </div>
        )}

        {/* Step 2: Select Doctor */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Doctor</CardTitle>
              <CardDescription>Select from our qualified medical professionals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDoctor === doctor.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <Stethoscope className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{doctor.name}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{doctor.rating}</span>
                            <span className="text-sm text-muted-foreground">({doctor.reviews})</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{doctor.specialization} • {doctor.experience}</p>
                        <p className="text-sm mb-2">{doctor.bio}</p>
                        <p className="text-sm text-muted-foreground mb-2">{doctor.hospital}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {doctor.qualifications.map((qual) => (
                            <Badge key={qual} variant="secondary" className="text-xs">{qual}</Badge>
                          ))}
                        </div>
                        <p className="text-sm font-semibold text-primary">PKR {doctor.consultationFee} consultation</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!selectedDoctor}
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
              <CardTitle>Schedule Consultation</CardTitle>
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
                      <SelectItem value="18:00">6:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="symptoms">Symptoms & Concerns</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Describe your symptoms, concerns, or reason for consultation..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={4}
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
              <CardTitle>Confirm Consultation</CardTitle>
              <CardDescription>Review your appointment details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Consultation Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span>{consultationTypes.find(t => t.id === selectedConsultationType)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Doctor:</span>
                      <span>{mockDoctors.find(d => d.id === selectedDoctor)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Specialization:</span>
                      <span>{mockDoctors.find(d => d.id === selectedDoctor)?.specialization}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{new Date(selectedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>{selectedTime}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Consultation Fee:</span>
                      <span>PKR {mockDoctors.find(d => d.id === selectedDoctor)?.consultationFee}</span>
                    </div>
                  </div>
                </div>
                {symptoms && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Symptoms & Concerns</h4>
                    <p className="text-sm">{symptoms}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button onClick={handleBooking} className="flex-1 sm:flex-none">
                  Confirm Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

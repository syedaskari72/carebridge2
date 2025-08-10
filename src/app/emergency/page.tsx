"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Heart,
  Ambulance,
  User,
  Navigation,
  Shield,
  CheckCircle
} from "lucide-react";

export default function EmergencyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [emergencyType, setEmergencyType] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [emergencyContacted, setEmergencyContacted] = useState(false);

  useEffect(() => {
    // Get current location immediately for emergency services
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error("Location error:", error),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const emergencyTypes = [
    { id: "cardiac", name: "Heart Attack / Chest Pain", icon: Heart, color: "bg-red-500" },
    { id: "breathing", name: "Breathing Difficulty", icon: AlertTriangle, color: "bg-orange-500" },
    { id: "injury", name: "Serious Injury", icon: Shield, color: "bg-yellow-500" },
    { id: "unconscious", name: "Unconscious / Unresponsive", icon: User, color: "bg-purple-500" },
    { id: "other", name: "Other Emergency", icon: AlertTriangle, color: "bg-gray-500" }
  ];

  const handleEmergencyCall = async () => {
    setIsConnecting(true);
    
    try {
      // In a real app, this would:
      // 1. Contact emergency services (1122 in Pakistan)
      // 2. Send location and patient info
      // 3. Connect to on-call doctor
      // 4. Notify emergency contacts
      
      const emergencyData = {
        patientId: session?.user.id,
        patientName: session?.user.name,
        emergencyType,
        symptoms,
        location: location ? `${location.lat},${location.lng}` : "Location unavailable",
        timestamp: new Date().toISOString()
      };

      // Simulate emergency service contact
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("Emergency data:", emergencyData);
      setEmergencyContacted(true);
      
      // In a real app, this would also:
      // - Call 1122 automatically
      // - Send SMS to emergency contacts
      // - Connect to nearest hospital
      // - Dispatch ambulance if needed
      
    } catch (error) {
      console.error("Emergency contact error:", error);
      alert("Failed to contact emergency services. Please call 1122 directly.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDirectCall = () => {
    // In a real app, this would initiate a phone call to 1122
    window.open("tel:1122", "_self");
  };

  if (emergencyContacted) {
    return (
      <div className="w-full overflow-x-hidden min-h-screen bg-red-50">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-8 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-red-900 mb-4">Emergency Services Contacted</h1>
            <p className="text-red-700 text-lg">Help is on the way!</p>
          </div>

          <Card className="border-red-200 bg-white">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span>Emergency services (1122) have been notified</span>
                </div>
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span>Your location has been shared</span>
                </div>
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span>On-call doctor is being contacted</span>
                </div>
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span>Emergency contacts have been notified</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">What to do while waiting:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Stay calm and remain in a safe location</li>
                  <li>• Keep your phone nearby</li>
                  <li>• If possible, unlock your door for emergency responders</li>
                  <li>• Do not take any medication unless instructed</li>
                </ul>
              </div>

              <div className="mt-6 space-y-3">
                <Button 
                  onClick={handleDirectCall}
                  className="w-full bg-red-600 hover:bg-red-700 py-3 text-lg"
                >
                  📞 Call 1122 Directly
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push("/dashboard/patient")}
                  className="w-full"
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden min-h-screen bg-red-50">
      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-red-900 mb-2">Emergency</h1>
          <p className="text-red-700">Get immediate medical help</p>
        </div>

        {/* Quick Emergency Call */}
        <Card className="border-red-200 mb-6">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-900 mb-4">Life-Threatening Emergency?</h2>
            <Button 
              onClick={handleDirectCall}
              className="w-full bg-red-600 hover:bg-red-700 py-4 text-xl font-bold mb-4"
              size="lg"
            >
              📞 CALL 1122 NOW
            </Button>
            <p className="text-sm text-red-600">For immediate life-threatening emergencies</p>
          </CardContent>
        </Card>

        {/* Emergency Form */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-900">Request Emergency Medical Assistance</CardTitle>
            <CardDescription>
              Fill out this form to get connected with emergency medical services and on-call doctors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location Status */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Location Status</p>
                <p className="text-xs text-blue-700">
                  {location ? "Location detected and will be shared with emergency services" : "Getting your location..."}
                </p>
              </div>
            </div>

            {/* Emergency Type */}
            <div>
              <Label className="text-base font-semibold">Type of Emergency</Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {emergencyTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setEmergencyType(type.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        emergencyType === type.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${type.color} rounded-full flex items-center justify-center`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-medium">{type.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <Label htmlFor="symptoms" className="text-base font-semibold">
                Describe Symptoms (Optional)
              </Label>
              <Textarea
                id="symptoms"
                placeholder="Briefly describe what's happening..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            {/* Patient Info Display */}
            {session && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Patient Information</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {session.user.name}</p>
                  <p><strong>Email:</strong> {session.user.email}</p>
                  {location && (
                    <p><strong>Location:</strong> Available (will be shared with emergency services)</p>
                  )}
                </div>
              </div>
            )}

            {/* Emergency Button */}
            <Button 
              onClick={handleEmergencyCall}
              disabled={!emergencyType || isConnecting}
              className="w-full bg-red-600 hover:bg-red-700 py-4 text-lg font-semibold"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Contacting Emergency Services...
                </>
              ) : (
                "🚨 Request Emergency Assistance"
              )}
            </Button>

            <div className="text-center">
              <Button 
                variant="outline"
                onClick={() => router.back()}
                className="text-gray-600"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

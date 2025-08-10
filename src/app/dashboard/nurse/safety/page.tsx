"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  MapPin, 
  Clock, 
  Phone, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Navigation,
  Users,
  Bell
} from "lucide-react";

// Mock data - replace with real API calls
const mockSafetyData = {
  currentStatus: {
    isOnDuty: true,
    lastCheckIn: "2024-08-10T08:00:00Z",
    lastCheckOut: null as string | null,
    currentLocation: {
      lat: 24.8607,
      lng: 67.0011,
      address: "123 Main Street, Karachi, Pakistan"
    },
    shiftDuration: "6 hours 30 minutes"
  },
  emergencyContacts: [
    {
      id: "1",
      name: "Ahmed Khan",
      relationship: "Spouse",
      phone: "+92 300 1234567",
      isPrimary: true
    },
    {
      id: "2",
      name: "Fatima Ali",
      relationship: "Sister",
      phone: "+92 301 7654321",
      isPrimary: false
    }
  ],
  safetySettings: {
    locationSharing: true,
    autoCheckIn: true,
    emergencyAlerts: true,
    familyNotifications: true,
    checkInInterval: 2, // hours
    sosEnabled: true
  },
  recentAlerts: [
    {
      id: "1",
      type: "CHECK_IN_MISSED",
      timestamp: "2024-08-09T14:00:00Z",
      status: "RESOLVED",
      description: "Missed scheduled check-in",
      location: "456 Oak Avenue, Lahore"
    },
    {
      id: "2",
      type: "LOCATION_ALERT",
      timestamp: "2024-08-08T16:30:00Z",
      status: "RESOLVED",
      description: "Entered high-risk area",
      location: "Industrial Area, Karachi"
    }
  ],
  checkInHistory: [
    {
      id: "1",
      type: "CHECK_IN",
      timestamp: "2024-08-10T08:00:00Z",
      location: "123 Main Street, Karachi",
      patientName: "John Doe",
      status: "ON_TIME"
    },
    {
      id: "2",
      type: "CHECK_OUT",
      timestamp: "2024-08-09T16:00:00Z",
      location: "456 Oak Avenue, Lahore",
      patientName: "Jane Smith",
      status: "ON_TIME"
    }
  ]
};

export default function NurseSafetyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [safetyData, setSafetyData] = useState(mockSafetyData);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [newContact, setNewContact] = useState({ name: "", relationship: "", phone: "" });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.userType !== "NURSE") {
      router.push(`/dashboard/${session.user.userType.toLowerCase()}`);
      return;
    }

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Location error:", error)
      );
    }
  }, [session, status, router]);

  const handleCheckIn = async () => {
    try {
      const response = await fetch("/api/nurse/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location ? JSON.stringify(location) : null,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSafetyData(prev => ({
          ...prev,
          currentStatus: {
            ...prev.currentStatus,
            isOnDuty: true,
            lastCheckIn: new Date().toISOString(),
          }
        }));
      }
    } catch (error) {
      console.error("Check-in error:", error);
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await fetch("/api/nurse/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location ? JSON.stringify(location) : null,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSafetyData(prev => ({
          ...prev,
          currentStatus: {
            ...prev.currentStatus,
            isOnDuty: false,
            lastCheckOut: new Date().toISOString(),
          }
        }));
      }
    } catch (error) {
      console.error("Check-out error:", error);
    }
  };

  const handleSOS = async () => {
    if (!confirm("This will send an emergency alert to admin and authorities. Continue?")) {
      return;
    }

    try {
      const response = await fetch("/api/nurse/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location ? JSON.stringify(location) : null,
          timestamp: new Date().toISOString(),
          description: "SOS alert triggered by nurse",
        }),
      });

      if (response.ok) {
        alert("Emergency alert sent! Help is on the way.");
      }
    } catch (error) {
      console.error("SOS error:", error);
      alert("Failed to send emergency alert. Please call 1122 directly.");
    }
  };

  const updateSafetySetting = (setting: string, value: boolean | number) => {
    setSafetyData(prev => ({
      ...prev,
      safetySettings: {
        ...prev.safetySettings,
        [setting]: value
      }
    }));
  };

  const addEmergencyContact = () => {
    if (!newContact.name || !newContact.phone) return;

    const contact = {
      id: Date.now().toString(),
      ...newContact,
      isPrimary: safetyData.emergencyContacts.length === 0
    };

    setSafetyData(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, contact]
    }));

    setNewContact({ name: "", relationship: "", phone: "" });
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.userType !== "NURSE") {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Safety & Security Center</h1>
          <p className="text-muted-foreground">Manage your safety settings and emergency protocols</p>
        </div>
        <Link
          href="/dashboard/nurse"
          className="text-primary hover:underline flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className={`${safetyData.currentStatus.isOnDuty ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-gray-200'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Duty Status</h3>
                <p className={`text-sm ${safetyData.currentStatus.isOnDuty ? 'text-green-600' : 'text-gray-600'}`}>
                  {safetyData.currentStatus.isOnDuty ? "On Duty" : "Off Duty"}
                </p>
                {safetyData.currentStatus.isOnDuty && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Duration: {safetyData.currentStatus.shiftDuration}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={safetyData.currentStatus.isOnDuty ? handleCheckOut : handleCheckIn}
                  variant={safetyData.currentStatus.isOnDuty ? "destructive" : "default"}
                  size="sm"
                >
                  {safetyData.currentStatus.isOnDuty ? "Check Out" : "Check In"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Location Status</h3>
                <p className="text-sm text-muted-foreground">
                  {location ? "Location Active" : "Location Disabled"}
                </p>
                {safetyData.currentStatus.currentLocation && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📍 {safetyData.currentStatus.currentLocation.address}
                  </p>
                )}
              </div>
              <MapPin className={`h-8 w-8 ${location ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-red-900 dark:text-red-100">Emergency SOS</h3>
                <p className="text-sm text-red-700 dark:text-red-300">Panic Button</p>
              </div>
              <Button
                onClick={handleSOS}
                variant="destructive"
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                🚨 SOS
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Safety Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Settings
            </CardTitle>
            <CardDescription>
              Configure your safety and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="location-sharing">Live Location Sharing</Label>
                <p className="text-sm text-muted-foreground">Share your location with admin while on duty</p>
              </div>
              <Switch
                id="location-sharing"
                checked={safetyData.safetySettings.locationSharing}
                onCheckedChange={(checked) => updateSafetySetting('locationSharing', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-checkin">Auto Check-in Reminders</Label>
                <p className="text-sm text-muted-foreground">Automatic reminders for check-ins</p>
              </div>
              <Switch
                id="auto-checkin"
                checked={safetyData.safetySettings.autoCheckIn}
                onCheckedChange={(checked) => updateSafetySetting('autoCheckIn', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emergency-alerts">Emergency Alerts</Label>
                <p className="text-sm text-muted-foreground">Send alerts to emergency contacts</p>
              </div>
              <Switch
                id="emergency-alerts"
                checked={safetyData.safetySettings.emergencyAlerts}
                onCheckedChange={(checked) => updateSafetySetting('emergencyAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="family-notifications">Family Notifications</Label>
                <p className="text-sm text-muted-foreground">Notify family of safety events</p>
              </div>
              <Switch
                id="family-notifications"
                checked={safetyData.safetySettings.familyNotifications}
                onCheckedChange={(checked) => updateSafetySetting('familyNotifications', checked)}
              />
            </div>

            <div>
              <Label htmlFor="checkin-interval">Check-in Interval (hours)</Label>
              <Input
                id="checkin-interval"
                type="number"
                value={safetyData.safetySettings.checkInInterval}
                onChange={(e) => updateSafetySetting('checkInInterval', parseInt(e.target.value))}
                className="mt-1"
                min="1"
                max="8"
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contacts
            </CardTitle>
            <CardDescription>
              Manage your emergency contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {safetyData.emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.isPrimary && (
                      <Badge variant="secondary">Primary</Badge>
                    )}
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Add New Contact</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Name"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Relationship"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                />
              </div>
              <Input
                placeholder="Phone Number"
                value={newContact.phone}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
              />
              <Button onClick={addEmergencyContact} className="w-full">
                Add Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

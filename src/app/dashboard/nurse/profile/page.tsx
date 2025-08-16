"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const departments = [
  "GENERAL",
  "CARDIOLOGY", 
  "PEDIATRICS",
  "ICU",
  "EMERGENCY",
  "ORTHOPEDICS",
  "NEUROLOGY",
  "GYNECOLOGY",
  "DERMATOLOGY",
  "PSYCHIATRY"
];

const commonSpecialties = [
  "General Care",
  "Elderly Care", 
  "Pediatric Care",
  "Wound Care",
  "Medication Management",
  "Post-Surgery Care",
  "Chronic Disease Management",
  "Diabetes Care",
  "Blood Pressure Monitoring",
  "IV Therapy",
  "Catheter Care",
  "Physical Therapy",
  "Mental Health Support"
];

export default function NurseProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nurse, setNurse] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    department: "",
    specialties: [] as string[],
    hourlyRate: "",
    bio: "",
    location: ""
  });
  const [newSpecialty, setNewSpecialty] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.userType !== "NURSE") {
      router.push("/auth/signin");
      return;
    }

    loadNurseProfile();
  }, [session, status, router]);

  const loadNurseProfile = async () => {
    try {
      const res = await fetch("/api/nurse/profile");
      if (res.ok) {
        const data = await res.json();
        setNurse(data);
        setFormData({
          name: data.user.name || "",
          phone: data.user.phone || "",
          department: data.department || "",
          specialties: data.specialties || [],
          hourlyRate: data.hourlyRate?.toString() || "",
          bio: data.bio || "",
          location: data.location || ""
        });
      }
    } catch (e) {
      console.error("Error loading nurse profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/nurse/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Profile updated successfully!");
        loadNurseProfile();
      } else {
        alert("Failed to update profile");
      }
    } catch (e) {
      console.error("Error saving profile:", e);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty && !formData.specialties.includes(newSpecialty)) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty]
      }));
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session || !nurse) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Nurse Profile Settings</h1>
        <p className="text-muted-foreground">Update your professional information and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Karachi, Lahore, Islamabad"
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept.charAt(0) + dept.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate (PKR)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  placeholder="e.g., 2500"
                />
              </div>
            </div>

            {/* Specialties */}
            <div>
              <Label>Specialties</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={newSpecialty} onValueChange={setNewSpecialty}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add a specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonSpecialties.filter(s => !formData.specialties.includes(s)).map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addSpecialty} disabled={!newSpecialty}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                      {specialty}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeSpecialty(specialty)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell patients about your experience and approach to care..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

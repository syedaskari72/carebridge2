"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Mock user data - replace with real user management
const mockUser = {
  id: "user-1",
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  address: "123 Main St, City, State 12345",
  emergencyContact: {
    name: "Jane Doe",
    phone: "+1 (555) 987-6543",
    relationship: "Spouse"
  },
  medicalInfo: {
    allergies: ["Penicillin", "Shellfish"],
    medications: ["Lisinopril 10mg daily", "Metformin 500mg twice daily"],
    conditions: ["Hypertension", "Type 2 Diabetes"],
    bloodType: "O+"
  },
  preferences: {
    preferredLanguage: "English",
    notifications: {
      email: true,
      sms: true,
      push: true
    }
  }
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [realUser, setRealUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    loadUserProfile();
  }, [session, status, router]);

  const loadUserProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setRealUser(data);
        // Update the user state with real data
        const userData = {
          id: data.id,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          emergencyContact: {
            name: data.patient?.emergencyContactName || "",
            phone: data.patient?.emergencyContactPhone || "",
            relationship: data.patient?.emergencyContactRelationship || ""
          },
          medicalInfo: {
            allergies: data.patient?.allergies || [],
            medications: data.patient?.medications || [],
            conditions: data.patient?.medicalConditions || [],
            bloodType: data.patient?.bloodType || ""
          },
          preferences: {
            preferredLanguage: data.patient?.preferredLanguage || "English",
            notifications: data.patient?.notifications || {
              email: true,
              sms: true,
              push: true
            }
          }
        };
        setUser(userData);
        console.log("Loaded user data:", userData); // Debug log
      } else {
        console.error("Failed to load profile:", res.status);
      }
    } catch (e) {
      console.error("Error loading profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: user.name,
        phone: user.phone,
        address: user.address,
        // Patient-specific fields
        bloodType: user.medicalInfo.bloodType,
        allergies: user.medicalInfo.allergies,
        medications: user.medicalInfo.medications,
        medicalConditions: user.medicalInfo.conditions,
        emergencyContactName: user.emergencyContact.name,
        emergencyContactPhone: user.emergencyContact.phone,
        emergencyContactRelationship: user.emergencyContact.relationship,
        preferredLanguage: user.preferences.preferredLanguage,
        notifications: user.preferences.notifications,
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Profile updated successfully!");
        setIsEditing(false);
        loadUserProfile(); // Reload data
      } else {
        alert("Failed to update profile");
      }
    } catch (e) {
      console.error("Error saving profile:", e);
      alert("Failed to update profile");
    }
  };

  const handleCancel = () => {
    // Reset to original data without reloading from API
    if (realUser) {
      const userData = {
        id: realUser.id,
        name: realUser.name || "",
        email: realUser.email || "",
        phone: realUser.phone || "",
        address: realUser.address || "",
        emergencyContact: {
          name: realUser.patient?.emergencyContactName || "",
          phone: realUser.patient?.emergencyContactPhone || "",
          relationship: realUser.patient?.emergencyContactRelationship || ""
        },
        medicalInfo: {
          allergies: realUser.patient?.allergies || [],
          medications: realUser.patient?.medications || [],
          conditions: realUser.patient?.medicalConditions || [],
          bloodType: realUser.patient?.bloodType || ""
        },
        preferences: {
          preferredLanguage: realUser.patient?.preferredLanguage || "English",
          notifications: realUser.patient?.notifications || {
            email: true,
            sms: true,
            push: true
          }
        }
      };
      setUser(userData);
    }
    setIsEditing(false);
  };

  const updateUser = (field: string, value: any) => {
    setUser((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedUser = (section: string, field: string, value: any) => {
    setUser((prev: any) => {
      const currentSection = prev[section as keyof typeof prev];
      return {
        ...prev,
        [section]: {
          ...(typeof currentSection === 'object' && currentSection !== null ? currentSection : {}),
          [field]: value
        }
      };
    });
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: "👤" },
    // Only show medical info tab for patients, not nurses
    ...(session?.user.userType === "PATIENT" ? [{ id: "medical", label: "Medical Info", icon: "🏥" }] : []),
    { id: "emergency", label: "Emergency Contact", icon: "🚨" },
    { id: "preferences", label: "Preferences", icon: "⚙️" }
  ];

  if (status === "loading" || loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="button-primary"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-slate-600 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="button-primary"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Personal Info Tab */}
      {activeTab === "personal" && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => updateUser("name", e.target.value)}
                disabled={!isEditing}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={user.email}
                onChange={(e) => updateUser("email", e.target.value)}
                disabled={!isEditing}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={user.phone}
                onChange={(e) => updateUser("phone", e.target.value)}
                disabled={!isEditing}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                value={user.address}
                onChange={(e) => updateUser("address", e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Medical Info Tab */}
      {activeTab === "medical" && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Medical Information</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Blood Type</label>
              <input
                type="text"
                value={user.medicalInfo.bloodType}
                onChange={(e) => updateNestedUser("medicalInfo", "bloodType", e.target.value)}
                disabled={!isEditing}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Allergies</label>
              <textarea
                value={user.medicalInfo.allergies.join(", ")}
                onChange={(e) => updateNestedUser("medicalInfo", "allergies", e.target.value.split(", "))}
                disabled={!isEditing}
                rows={2}
                placeholder="List allergies separated by commas"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Current Medications</label>
              <textarea
                value={user.medicalInfo.medications.join("\n")}
                onChange={(e) => updateNestedUser("medicalInfo", "medications", e.target.value.split("\n"))}
                disabled={!isEditing}
                rows={3}
                placeholder="List medications, one per line"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Medical Conditions</label>
              <textarea
                value={user.medicalInfo.conditions.join(", ")}
                onChange={(e) => updateNestedUser("medicalInfo", "conditions", e.target.value.split(", "))}
                disabled={!isEditing}
                rows={2}
                placeholder="List conditions separated by commas"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contact Tab */}
      {activeTab === "emergency" && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Contact Name</label>
              <input
                type="text"
                value={user.emergencyContact.name}
                onChange={(e) => updateNestedUser("emergencyContact", "name", e.target.value)}
                disabled={!isEditing}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={user.emergencyContact.phone}
                onChange={(e) => updateNestedUser("emergencyContact", "phone", e.target.value)}
                disabled={!isEditing}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Relationship</label>
              <input
                type="text"
                value={user.emergencyContact.relationship}
                onChange={(e) => updateNestedUser("emergencyContact", "relationship", e.target.value)}
                disabled={!isEditing}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Preferences</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Preferred Language</label>
              <select
                value={user.preferences.preferredLanguage}
                onChange={(e) => updateNestedUser("preferences", "preferredLanguage", e.target.value)}
                disabled={!isEditing}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
              <div className="space-y-3">
                {Object.entries(user.preferences.notifications).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(e) => updateNestedUser("preferences", "notifications", {
                        ...user.preferences.notifications,
                        [key]: e.target.checked
                      })}
                      disabled={!isEditing}
                      className="mr-3 h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                    />
                    <span className="capitalize">{key} notifications</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

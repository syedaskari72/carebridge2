"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmergencyAccessPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    emergencyType: "",
    description: "",
    location: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const router = useRouter();

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Location error:", error);
        }
      );
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const emergencyData = {
        ...formData,
        location: location ? JSON.stringify(location) : formData.location,
        severity: "HIGH", // Emergency cases are high severity by default
      };

      const response = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emergencyData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/emergency/${data.emergencyId}`);
      } else {
        alert("Failed to create emergency case");
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const emergencyTypes = [
    { value: "MEDICAL", label: "Medical Emergency", icon: "🏥" },
    { value: "ACCIDENT", label: "Accident", icon: "🚑" },
    { value: "CARDIAC", label: "Heart/Cardiac", icon: "❤️" },
    { value: "RESPIRATORY", label: "Breathing Issues", icon: "🫁" },
    { value: "TRAUMA", label: "Trauma/Injury", icon: "🩹" },
    { value: "OTHER", label: "Other Emergency", icon: "🚨" },
  ];

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">🚨</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-red-900">
            Emergency Access
          </h2>
          <p className="mt-2 text-center text-sm text-red-700">
            Fast medical assistance without signup required
          </p>
          <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>For life-threatening emergencies, call 1122 immediately!</strong>
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="emergencyType" className="block text-sm font-medium text-gray-700">
                Emergency Type *
              </label>
              <select
                id="emergencyType"
                name="emergencyType"
                value={formData.emergencyType}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select emergency type</option>
                {emergencyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Your Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  placeholder="+92 300 1234567"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Describe the Emergency *
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                required
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                placeholder="Briefly describe what happened and current condition..."
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location/Address
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                placeholder="Current address or landmark"
              />
              {location && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ GPS location detected automatically
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isLoading ? "Connecting..." : "🚨 Get Emergency Help Now"}
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">What happens next:</h3>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Nearest available doctor will be notified immediately</li>
              <li>• You'll receive a call within 2-5 minutes</li>
              <li>• Medical professional will be dispatched if needed</li>
              <li>• Your location is shared with emergency responders</li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Have an account?{" "}
              <a href="/auth/signin" className="font-medium text-cyan-600 hover:text-cyan-500">
                Sign in for faster service
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

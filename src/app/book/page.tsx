"use client";

import { useState } from "react";

export default function BookPage() {
  const [serviceType, setServiceType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement booking logic
    console.log("Booking:", { serviceType, urgency, date, time });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Book a Service</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Type */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Select Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              serviceType === "nurse" ? "border-cyan-500 bg-cyan-50" : "border-gray-200 hover:border-cyan-300"
            }`}>
              <input
                type="radio"
                name="serviceType"
                value="nurse"
                checked={serviceType === "nurse"}
                onChange={(e) => setServiceType(e.target.value)}
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-3xl mb-2">👩‍⚕️</div>
                <h3 className="font-semibold">Nurse Visit</h3>
                <p className="text-sm text-slate-600">Home nursing care, medication, health monitoring</p>
              </div>
            </label>
            
            <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              serviceType === "lab" ? "border-cyan-500 bg-cyan-50" : "border-gray-200 hover:border-cyan-300"
            }`}>
              <input
                type="radio"
                name="serviceType"
                value="lab"
                checked={serviceType === "lab"}
                onChange={(e) => setServiceType(e.target.value)}
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-3xl mb-2">🧪</div>
                <h3 className="font-semibold">Lab Service</h3>
                <p className="text-sm text-slate-600">Blood tests, sample collection, diagnostics</p>
              </div>
            </label>
          </div>
        </div>

        {/* Urgency Level */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Urgency Level</h2>
          <div className="space-y-3">
            {[
              { value: "routine", label: "Routine", desc: "Within 24-48 hours", color: "green" },
              { value: "urgent", label: "Urgent", desc: "Within 2-4 hours", color: "yellow" },
              { value: "emergency", label: "Emergency", desc: "ASAP (within 1 hour)", color: "red" }
            ].map((option) => (
              <label key={option.value} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                urgency === option.value ? "border-cyan-500 bg-cyan-50" : "border-gray-200 hover:border-cyan-300"
              }`}>
                <input
                  type="radio"
                  name="urgency"
                  value={option.value}
                  checked={urgency === option.value}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-slate-600">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Preferred Date & Time</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">Select time</option>
                <option value="morning">Morning (8AM - 12PM)</option>
                <option value="afternoon">Afternoon (12PM - 5PM)</option>
                <option value="evening">Evening (5PM - 8PM)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!serviceType || !urgency || !date || !time}
          className="w-full button-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Book Service
        </button>
      </form>
    </div>
  );
}

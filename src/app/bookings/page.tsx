"use client";

import { useState } from "react";

// Mock data - replace with real API calls
const mockBookings = [
  {
    id: "1",
    serviceType: "nurse",
    nurseId: "nurse-1",
    nurseName: "Sarah Johnson",
    date: "2024-08-12",
    time: "morning",
    status: "confirmed",
    address: "123 Main St, City",
    notes: "Regular health checkup"
  },
  {
    id: "2", 
    serviceType: "lab",
    nurseId: "lab-1",
    nurseName: "Mike Chen",
    date: "2024-08-10",
    time: "afternoon", 
    status: "completed",
    address: "123 Main St, City",
    notes: "Blood test for annual physical"
  },
  {
    id: "3",
    serviceType: "nurse",
    nurseId: "nurse-2", 
    nurseName: "Emily Davis",
    date: "2024-08-15",
    time: "evening",
    status: "pending",
    address: "123 Main St, City",
    notes: "Medication management"
  }
];

export default function BookingsPage() {
  const [bookings] = useState(mockBookings);
  const [filter, setFilter] = useState("all");

  const filteredBookings = bookings.filter(booking => 
    filter === "all" || booking.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    // TODO: Implement cancel booking logic
    console.log("Cancel booking:", bookingId);
  };

  const handleRescheduleBooking = (bookingId: string) => {
    // TODO: Implement reschedule booking logic
    console.log("Reschedule booking:", bookingId);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
        
        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">All Bookings</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-xl font-semibold mb-2">No bookings found</h2>
          <p className="text-slate-600 mb-6">You haven't made any bookings yet.</p>
          <a href="/book" className="button-primary">
            Book Your First Service
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {booking.serviceType === "nurse" ? "👩‍⚕️" : "🧪"}
                    </span>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {booking.serviceType === "nurse" ? "Nurse Visit" : "Lab Service"}
                      </h3>
                      <p className="text-slate-600">with {booking.nurseName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                    <div>
                      <strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Time:</strong> {booking.time}
                    </div>
                    <div>
                      <strong>Address:</strong> {booking.address}
                    </div>
                  </div>
                  
                  {booking.notes && (
                    <div className="mt-2 text-sm text-slate-600">
                      <strong>Notes:</strong> {booking.notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {booking.status === "confirmed" && (
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <button
                      onClick={() => handleRescheduleBooking(booking.id)}
                      className="px-4 py-2 text-cyan-600 border border-cyan-600 rounded-lg hover:bg-cyan-50"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Booking {
  id: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  address: string;
  notes?: string;
  actualDuration?: number;
  actualCost?: number;
  totalCost?: number;
  nurse?: {
    user: { name: string; image?: string };
    hourlyRate: number;
  };
}


export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/bookings?scope=patient", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        }
      } catch (e) {
        console.error("Failed to load bookings", e);
      }
    };
    load();
  }, []);

  const filteredBookings = bookings.filter(booking =>
    filter === "all" || booking.status === filter.toUpperCase()
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "bg-green-100 text-green-800";
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "COMPLETED": return "bg-blue-100 text-blue-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Reload bookings
        const res = await fetch("/api/bookings?scope=patient", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        }
      } else {
        alert("Failed to update booking");
      }
    } catch (e) {
      console.error("Failed to update booking:", e);
      alert("Failed to update booking");
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      handleStatusUpdate(bookingId, "CANCELLED");
    }
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
                        {booking.serviceType === "NURSE_VISIT" ? "Nurse Visit" : booking.serviceType === "LAB_SERVICE" ? "Lab Service" : booking.serviceType}
                      </h3>
                      <p className="text-slate-600">{booking.nurse?.user?.name ? `with ${booking.nurse.user.name}` : ""}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                    <div>
                      <strong>Date:</strong> {new Date(booking.appointmentDate).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Time:</strong> {booking.appointmentTime}
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

                  {/* Pricing Information */}
                  {(booking.actualCost || booking.totalCost) && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-700">
                          {booking.actualCost ? 'Final Cost' : 'Estimated Cost'}
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          PKR {booking.actualCost || booking.totalCost}
                        </span>
                      </div>
                      {booking.actualDuration && (
                        <div className="text-xs text-green-600 mt-1">
                          Service Duration: {Math.floor(booking.actualDuration / 60)}h {booking.actualDuration % 60}m
                        </div>
                      )}
                      {booking.nurse?.hourlyRate && !booking.actualCost && (
                        <div className="text-xs text-green-600 mt-1">
                          Rate: PKR {booking.nurse.hourlyRate}/hour (estimated)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 md:mt-0">
                  <button
                    onClick={() => router.push(`/bookings/${booking.id}`)}
                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    View Details
                  </button>

                  {booking.status === "confirmed" && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

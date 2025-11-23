"use client";

import { useEffect, useState } from "react";

interface Nurse {
  id: string;
  user: { name: string; gender?: string };
  department?: string;
  isVerified?: boolean;
  isAvailable?: boolean;
  hourlyRate?: number;
  location?: string;
  specialties?: string[];
}



export default function NursesPage() {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  const loadNurses = async () => {
    try {
      const res = await fetch(`/api/nurses?q=${encodeURIComponent(searchTerm)}`, {
        cache: 'no-store', // Always fetch fresh data
      });
      if (res.ok) {
        const data = await res.json();
        setNurses(data);
      }
    } catch (e) {
      console.error("Failed to load nurses", e);
    }
  };

  useEffect(() => {
    loadNurses();
  }, [searchTerm]);

  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadNurses();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Refresh data every 30 seconds to keep status current
  useEffect(() => {
    const interval = setInterval(() => {
      loadNurses();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const allSpecialties = Array.from(new Set(nurses.map(n => n.department).filter(Boolean) as string[]));

  const filteredNurses = nurses.filter(nurse => {
    const name = (nurse.user?.name || "").toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesSpecialty = !specialtyFilter || nurse.department === specialtyFilter;
    // Only show verified nurses
    return nurse.isVerified && matchesSearch && matchesSpecialty;
  });

  const handleBookNurse = (nurseId: string) => {
    window.location.href = `/book/nurse?nurse=${encodeURIComponent(nurseId)}`;
  };

  const handleViewProfile = (nurseId: string) => {
    window.location.href = `/nurses/${encodeURIComponent(nurseId)}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Find Nurses</h1>
      
      {/* Search and Filters */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Specialty</label>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Specialties</option>
              {allSpecialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Nurses Grid */}
      {filteredNurses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">No nurses found</h2>
          <p className="text-slate-600">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNurses.map((nurse) => (
            <div key={nurse.id} className="card hover:shadow-lg transition-shadow">
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">👩‍⚕️</div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {nurse.user?.name}
                  {nurse.isVerified && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">Verified</span>
                  )}
                </h3>
                <p className="text-muted-foreground">{nurse.department || "General"}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Rating:</span>
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 font-medium">{(nurse as any).rating ?? "4.8"}</span>
                    <span className="text-slate-500 text-sm ml-1">({(nurse as any).reviews ?? "120"})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Rate:</span>
                  <span className="font-medium">PKR {(nurse as any).hourlyRate ?? 2500}/hour</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Gender:</span>
                  <span className="text-sm">{nurse.user?.gender || "Not specified"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Location:</span>
                  <span className="text-sm">{(nurse as any).location ?? "City"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status:</span>
                  <span className="text-sm text-green-600 font-medium">{(nurse as any).availability ?? ((nurse as any).isAvailable ? "Available" : "Unavailable")}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Specialties:</h4>
                <div className="flex flex-wrap gap-1">
                  {((nurse as any).specialties ?? [nurse.department || "General"]).map((specialty: string) => (
                    <span
                      key={specialty}
                      className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewProfile(nurse.id)}
                  className="flex-1 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
                >
                  View Profile
                </button>
                <button
                  onClick={() => handleBookNurse(nurse.id)}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors hover:shadow-lg cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={nurse.isAvailable === false}
                >
                  {nurse.isAvailable === false ? "Unavailable" : "Book Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

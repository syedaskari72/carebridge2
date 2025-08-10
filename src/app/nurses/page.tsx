"use client";

import { useState } from "react";

// Mock data - replace with real API calls
const mockNurses = [
  {
    id: "1",
    name: "Sarah Johnson",
    rating: 4.9,
    reviews: 127,
    specialties: ["General Care", "Elderly Care", "Medication Management"],
    availability: "Available Now",
    hourlyRate: 45,
    experience: "8 years",
    location: "Downtown Area",
    profileImage: "👩‍⚕️"
  },
  {
    id: "2", 
    name: "Emily Davis",
    rating: 4.8,
    reviews: 89,
    specialties: ["Pediatric Care", "Wound Care", "Post-Surgery Care"],
    availability: "Available Today",
    hourlyRate: 50,
    experience: "6 years", 
    location: "Midtown",
    profileImage: "👩‍⚕️"
  },
  {
    id: "3",
    name: "Maria Rodriguez", 
    rating: 4.9,
    reviews: 156,
    specialties: ["Chronic Disease Management", "Diabetes Care", "Blood Pressure Monitoring"],
    availability: "Available Tomorrow",
    hourlyRate: 48,
    experience: "10 years",
    location: "Uptown",
    profileImage: "👩‍⚕️"
  }
];

export default function NursesPage() {
  const [nurses] = useState(mockNurses);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  const allSpecialties = Array.from(
    new Set(nurses.flatMap(nurse => nurse.specialties))
  );

  const filteredNurses = nurses.filter(nurse => {
    const matchesSearch = nurse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nurse.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSpecialty = !specialtyFilter || nurse.specialties.includes(specialtyFilter);
    return matchesSearch && matchesSpecialty;
  });

  const handleBookNurse = (nurseId: string) => {
    // TODO: Implement booking logic with pre-selected nurse
    console.log("Book nurse:", nurseId);
  };

  const handleViewProfile = (nurseId: string) => {
    // TODO: Navigate to nurse profile page
    console.log("View profile:", nurseId);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Find Nurses</h1>
      
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
                <div className="text-6xl mb-2">{nurse.profileImage}</div>
                <h3 className="text-xl font-semibold">{nurse.name}</h3>
                <p className="text-slate-600">{nurse.experience} experience</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Rating:</span>
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 font-medium">{nurse.rating}</span>
                    <span className="text-slate-500 text-sm ml-1">({nurse.reviews})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Rate:</span>
                  <span className="font-medium">${nurse.hourlyRate}/hour</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Location:</span>
                  <span className="text-sm">{nurse.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status:</span>
                  <span className="text-sm text-green-600 font-medium">{nurse.availability}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Specialties:</h4>
                <div className="flex flex-wrap gap-1">
                  {nurse.specialties.map((specialty) => (
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
                  className="flex-1 px-4 py-2 border border-cyan-600 text-cyan-600 rounded-lg hover:bg-cyan-50"
                >
                  View Profile
                </button>
                <button
                  onClick={() => handleBookNurse(nurse.id)}
                  className="flex-1 button-primary"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

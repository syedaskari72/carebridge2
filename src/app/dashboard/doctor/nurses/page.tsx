"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, MapPin, Star } from "lucide-react";

export default function DoctorNursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [nurses, setNurses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.userType !== "DOCTOR") {
      router.push("/");
      return;
    }

    loadNurses();
  }, [session, status, router]);

  const loadNurses = async () => {
    try {
      const response = await fetch("/api/nurses/approved");
      if (response.ok) {
        const data = await response.json();
        setNurses(data);
      } else {
        setNurses([]);
      }
    } catch (error) {
      console.error("Error loading nurses:", error);
      setNurses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNurses = nurses.filter(nurse => {
    const matchesSearch = nurse.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === "ALL" || nurse.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading nurses...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.userType !== "DOCTOR") {
    return null;
  }

  return (
    <div className="w-full overflow-x-hidden bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-0 pb-4 sm:pb-8">
        <div className="mb-6 sm:mb-8 pt-6 sm:pt-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Registered Nurses
          </h1>
          <p className="text-muted-foreground">View all approved and verified nurses</p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search nurses by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="CARDIOLOGY">Cardiology</SelectItem>
                  <SelectItem value="PEDIATRICS">Pediatrics</SelectItem>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  <SelectItem value="ORTHOPEDICS">Orthopedics</SelectItem>
                  <SelectItem value="NEUROLOGY">Neurology</SelectItem>
                  <SelectItem value="GYNECOLOGY">Gynecology</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Nurses Grid */}
        {filteredNurses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <div className="text-4xl mb-2">👩‍⚕️</div>
              <p>No nurses found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNurses.map((nurse) => (
              <Card key={nurse.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center text-cyan-600 dark:text-cyan-300 font-semibold">
                      {nurse.user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{nurse.user.name}</h3>
                      <p className="text-sm text-muted-foreground">{nurse.department}</p>
                      {nurse.user.gender && (
                        <p className="text-xs text-muted-foreground">{nurse.user.gender}</p>
                      )}
                    </div>
                    <Badge variant={nurse.isAvailable ? "default" : "secondary"} className="text-xs">
                      {nurse.isAvailable ? "Available" : "Busy"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    {nurse.experience && nurse.experience !== "0" && (
                      <p className="text-muted-foreground">
                        <strong>Experience:</strong> {nurse.experience}
                      </p>
                    )}
                    
                    {nurse.rating && nurse.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{nurse.rating}</span>
                        <span className="text-muted-foreground text-xs">rating</span>
                      </div>
                    )}

                    <p className="text-green-600 font-medium">
                      PKR {nurse.hourlyRate}/hour
                    </p>

                    {nurse.specialties && nurse.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {nurse.specialties.slice(0, 2).map((specialty: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {nurse.specialties.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{nurse.specialties.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {nurse.user.phone && (
                      <div className="flex items-center gap-1 text-muted-foreground pt-2">
                        <Phone className="h-3 w-3" />
                        <span className="text-xs">{nurse.user.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

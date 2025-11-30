"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Activity, Pill, Heart, Droplets, Weight, Thermometer } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  bookingId: string;
  treatment?: {
    name: string;
    progress: number;
    medications: Array<{ name: string; time: string; frequency: string }>;
    vitals: { bloodPressure: string; bloodSugar: string; weight: string; temperature: string };
  };
}

export default function NurseTreatmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    treatmentName: "",
    progress: 0,
    medications: "",
    bloodPressure: "",
    bloodSugar: "",
    weight: "",
    temperature: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.userType !== "NURSE") {
      router.push("/auth/signin");
      return;
    }
    fetchPatients();
  }, [session, status, router]);

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/nurse/patients");
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const handleUpdateTreatment = async () => {
    if (!selectedPatient) return;

    const medications = formData.medications.split("\n").filter(m => m.trim()).map(line => {
      const [name, time, frequency] = line.split("|").map(s => s.trim());
      return { name, time, frequency };
    });

    try {
      const res = await fetch("/api/nurse/update-treatment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          bookingId: selectedPatient.bookingId,
          treatmentName: formData.treatmentName,
          progress: formData.progress,
          medications,
          vitals: {
            bloodPressure: formData.bloodPressure,
            bloodSugar: formData.bloodSugar,
            weight: formData.weight,
            temperature: formData.temperature,
          },
        }),
      });

      if (res.ok) {
        alert("Treatment updated successfully!");
        setIsModalOpen(false);
        fetchPatients();
      }
    } catch (error) {
      console.error("Error updating treatment:", error);
      alert("Failed to update treatment");
    }
  };

  const openModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      treatmentName: patient.treatment?.name || "",
      progress: patient.treatment?.progress || 0,
      medications: patient.treatment?.medications.map(m => `${m.name}|${m.time}|${m.frequency}`).join("\n") || "",
      bloodPressure: patient.treatment?.vitals.bloodPressure || "",
      bloodSugar: patient.treatment?.vitals.bloodSugar || "",
      weight: patient.treatment?.vitals.weight || "",
      temperature: patient.treatment?.vitals.temperature || "",
    });
    setIsModalOpen(true);
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.userType !== "NURSE") {
    return null;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Patient Treatments</h1>
          <p className="text-muted-foreground">Manage treatments for your assigned patients</p>
        </div>

        <div className="grid gap-4">
          {patients.map((patient) => (
            <Card key={patient.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{patient.name}</h3>
                    {patient.treatment ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          <span className="text-sm">{patient.treatment.name}</span>
                          <Badge variant="outline">{patient.treatment.progress}% Complete</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            <span>BP: {patient.treatment.vitals.bloodPressure}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Droplets className="h-3 w-3" />
                            <span>Sugar: {patient.treatment.vitals.bloodSugar}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No treatment plan yet</p>
                    )}
                  </div>
                  <Button onClick={() => openModal(patient)} size="sm">
                    {patient.treatment ? "Update" : "Add"} Treatment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Treatment - {selectedPatient?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Treatment Name</Label>
                <Input
                  value={formData.treatmentName}
                  onChange={(e) => setFormData({ ...formData, treatmentName: e.target.value })}
                  placeholder="e.g., Hypertension Management"
                />
              </div>
              <div>
                <Label>Progress (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Medications (one per line: Name|Time|Frequency)</Label>
                <Textarea
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  placeholder="Lisinopril 10mg|08:00|Daily&#10;Metformin 500mg|08:00, 20:00|Twice daily"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Blood Pressure</Label>
                  <Input
                    value={formData.bloodPressure}
                    onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <Label>Blood Sugar (mg/dL)</Label>
                  <Input
                    value={formData.bloodSugar}
                    onChange={(e) => setFormData({ ...formData, bloodSugar: e.target.value })}
                    placeholder="110"
                  />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="70"
                  />
                </div>
                <div>
                  <Label>Temperature (°F)</Label>
                  <Input
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    placeholder="98.6"
                  />
                </div>
              </div>
              <Button onClick={handleUpdateTreatment} className="w-full">
                Save Treatment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

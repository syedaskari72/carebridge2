"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pill, CheckCircle, X, Clock, User, Calendar } from "lucide-react";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  givenAt?: string;
  givenBy?: string;
  nurseNotes?: string;
  status?: "given" | "skip" | "pending";
}

interface Prescription {
  id: string;
  diagnosis: string;
  medications: Medication[];
  notes?: string;
  createdAt: string;
  isActive: boolean;
  patientName: string;
  bookingId: string;
  doctor: {
    user: {
      name: string;
    };
  };
}

export default function PrescriptionManager() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const response = await fetch("/api/nurse/prescriptions");
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
      } else {
        console.error("Failed to load prescriptions");
      }
    } catch (error) {
      console.error("Error loading prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicationAction = async (
    prescriptionId: string,
    medicationIndex: number,
    action: "given" | "skip"
  ) => {
    const actionKey = `${prescriptionId}-${medicationIndex}`;
    setActionLoading(actionKey);

    try {
      const response = await fetch(`/api/nurse/prescriptions/${prescriptionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicationIndex,
          action,
          notes: notes[actionKey] || null,
        }),
      });

      if (response.ok) {
        // Refresh prescriptions
        await loadPrescriptions();
        // Clear notes
        setNotes(prev => ({ ...prev, [actionKey]: "" }));
      } else {
        const error = await response.json();
        alert(`Failed to ${action} medication: ${error.error}`);
      }
    } catch (error) {
      console.error(`Error ${action} medication:`, error);
      alert(`Failed to ${action} medication. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const updateNotes = (prescriptionId: string, medicationIndex: number, value: string) => {
    const key = `${prescriptionId}-${medicationIndex}`;
    setNotes(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p>Loading patient prescriptions...</p>
        </CardContent>
      </Card>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-cyan-600" />
            Patient Prescriptions
          </CardTitle>
          <CardDescription>
            Medications for your current patients
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-4xl mb-2">💊</div>
          <p className="text-muted-foreground">No active prescriptions for current patients</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Pill className="h-6 w-6 text-cyan-600" />
        <h2 className="text-2xl font-bold">Patient Prescriptions</h2>
      </div>
      
      {prescriptions.map((prescription) => (
        <Card key={prescription.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {prescription.patientName}
                </CardTitle>
                <CardDescription>
                  <div className="space-y-1 mt-2">
                    <p><strong>Diagnosis:</strong> {prescription.diagnosis}</p>
                    <p><strong>Doctor:</strong> {prescription.doctor.user.name}</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(prescription.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardDescription>
              </div>
              <Badge variant={prescription.isActive ? "default" : "secondary"}>
                {prescription.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {prescription.notes && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm"><strong>Doctor's Notes:</strong> {prescription.notes}</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {prescription.medications.map((medication, index) => {
              const actionKey = `${prescription.id}-${index}`;
              const isLoading = actionLoading === actionKey;
              
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{medication.name}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Dosage:</strong> {medication.dosage}</p>
                        <p><strong>Frequency:</strong> {medication.frequency}</p>
                        {medication.duration && (
                          <p><strong>Duration:</strong> {medication.duration}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {medication.status === "given" && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Given
                        </Badge>
                      )}
                      {medication.status === "skip" && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <X className="h-3 w-3 mr-1" />
                          Skipped
                        </Badge>
                      )}
                      {!medication.status && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  {medication.givenAt && (
                    <div className="text-xs text-muted-foreground">
                      <p>Given at: {new Date(medication.givenAt).toLocaleString()}</p>
                      {medication.nurseNotes && (
                        <p className="mt-1"><strong>Notes:</strong> {medication.nurseNotes}</p>
                      )}
                    </div>
                  )}

                  {!medication.status && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`notes-${actionKey}`}>Notes (optional)</Label>
                        <Textarea
                          id={`notes-${actionKey}`}
                          placeholder="Add notes about medication administration..."
                          value={notes[actionKey] || ""}
                          onChange={(e) => updateNotes(prescription.id, index, e.target.value)}
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleMedicationAction(prescription.id, index, "given")}
                          disabled={isLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isLoading ? "Marking..." : "Mark as Given"}
                        </Button>
                        <Button
                          onClick={() => handleMedicationAction(prescription.id, index, "skip")}
                          disabled={isLoading}
                          variant="outline"
                          className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Skip This Time
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

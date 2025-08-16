"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Pill } from "lucide-react";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface AddPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPrescriptionModal({ isOpen, onClose, onSuccess }: AddPrescriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "" }
  ]);

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "" }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = medications.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    );
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!doctorName.trim() || !diagnosis.trim()) {
        alert("Please fill in doctor name and diagnosis");
        return;
      }

      const validMedications = medications.filter(med => 
        med.name.trim() && med.dosage.trim() && med.frequency.trim()
      );

      if (validMedications.length === 0) {
        alert("Please add at least one medication with name, dosage, and frequency");
        return;
      }

      const response = await fetch("/api/patient/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorName: doctorName.trim(),
          diagnosis: diagnosis.trim(),
          medications: validMedications,
          notes: notes.trim() || null,
        }),
      });

      if (response.ok) {
        // Reset form
        setDoctorName("");
        setDiagnosis("");
        setNotes("");
        setMedications([{ name: "", dosage: "", frequency: "", duration: "" }]);
        
        alert("Prescription added successfully!");
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed to add prescription: ${error.error}`);
      }
    } catch (error) {
      console.error("Error adding prescription:", error);
      alert("Failed to add prescription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-cyan-600" />
              <CardTitle>Add New Prescription</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Add a prescription given to you by a doctor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Doctor Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Doctor Information</h3>
              <div>
                <Label htmlFor="doctorName">Doctor Name *</Label>
                <Input
                  id="doctorName"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Dr. John Smith"
                  required
                />
              </div>
              <div>
                <Label htmlFor="diagnosis">Diagnosis *</Label>
                <Input
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="High blood pressure, diabetes, etc."
                  required
                />
              </div>
            </div>

            {/* Medications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Medications</h3>
                <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Medication
                </Button>
              </div>
              
              {medications.map((medication, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Medication {index + 1}</h4>
                    {medications.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`med-name-${index}`}>Medication Name *</Label>
                      <Input
                        id={`med-name-${index}`}
                        value={medication.name}
                        onChange={(e) => updateMedication(index, "name", e.target.value)}
                        placeholder="Lisinopril, Metformin, etc."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-dosage-${index}`}>Dosage *</Label>
                      <Input
                        id={`med-dosage-${index}`}
                        value={medication.dosage}
                        onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                        placeholder="10mg, 500mg, etc."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-frequency-${index}`}>Frequency *</Label>
                      <Input
                        id={`med-frequency-${index}`}
                        value={medication.frequency}
                        onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                        placeholder="Once daily, Twice daily, etc."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-duration-${index}`}>Duration</Label>
                      <Input
                        id={`med-duration-${index}`}
                        value={medication.duration}
                        onChange={(e) => updateMedication(index, "duration", e.target.value)}
                        placeholder="30 days, 3 months, etc."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional instructions or notes from the doctor..."
                rows={3}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Adding..." : "Add Prescription"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

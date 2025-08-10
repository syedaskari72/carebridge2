"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Mock data - replace with real API calls
const mockPatientRecords = {
  personalInfo: {
    name: "John Doe",
    age: 45,
    gender: "Male",
    bloodType: "O+",
    height: "5'10\"",
    weight: "180 lbs",
    allergies: ["Penicillin", "Shellfish", "Pollen"],
    conditions: ["Hypertension", "Type 2 Diabetes"],
    emergencyContact: {
      name: "Jane Doe",
      relationship: "Spouse",
      phone: "+92 300 1234567"
    },
    insurance: {
      provider: "Health Plus",
      policyNumber: "HP-123456789",
      groupNumber: "GRP-001"
    }
  },
  prescriptions: [
    {
      id: "1",
      medication: "Lisinopril 10mg",
      frequency: "Once daily",
      dosage: "10mg",
      doctor: "Dr. Ahmed Khan",
      startDate: "2024-07-01",
      endDate: "2024-09-01",
      status: "active",
      remaining: "15 days",
      instructions: "Take with food. Monitor blood pressure daily.",
      sideEffects: ["Dizziness", "Dry cough"],
      refillsRemaining: 2
    },
    {
      id: "2",
      medication: "Metformin 500mg",
      frequency: "Twice daily",
      dosage: "500mg",
      doctor: "Dr. Sarah Ali",
      startDate: "2024-06-15",
      endDate: "2024-12-15",
      status: "active",
      remaining: "45 days",
      instructions: "Take with meals. Check blood sugar regularly.",
      sideEffects: ["Nausea", "Stomach upset"],
      refillsRemaining: 5
    },
    {
      id: "3",
      medication: "Aspirin 81mg",
      frequency: "Once daily",
      dosage: "81mg",
      doctor: "Dr. Ahmed Khan",
      startDate: "2024-05-01",
      endDate: "2025-05-01",
      status: "active",
      remaining: "90 days",
      instructions: "Take with food to prevent stomach irritation.",
      sideEffects: ["Stomach irritation"],
      refillsRemaining: 8
    }
  ],
  treatmentHistory: [
    {
      id: "1",
      date: "2024-08-10",
      type: "Blood Pressure Check",
      nurse: "Sarah Johnson",
      duration: "45 minutes",
      vitals: {
        bp: "120/80",
        pulse: "72",
        temp: "98.6°F",
        weight: "179 lbs",
        oxygen: "98%"
      },
      medications: ["Lisinopril 10mg administered"],
      procedures: ["Blood pressure monitoring", "Medication administration"],
      notes: "Blood pressure within normal range. Continue current medication. Patient reports feeling well.",
      nextVisit: "2024-08-17",
      status: "completed",
      photos: ["bp_reading.jpg"],
      nurseSignature: "Sarah Johnson, RN"
    },
    {
      id: "2",
      date: "2024-08-05",
      type: "Blood Sugar Monitoring",
      nurse: "Emily Davis",
      duration: "30 minutes",
      vitals: {
        glucose: "110 mg/dL",
        bp: "118/78",
        pulse: "68",
        temp: "98.4°F"
      },
      medications: ["Metformin 500mg administered"],
      procedures: ["Blood glucose test", "Medication administration", "Diet counseling"],
      notes: "Blood sugar levels stable. Diet and exercise plan working well. Patient adherent to medication schedule.",
      nextVisit: "2024-08-12",
      status: "completed",
      photos: ["glucose_reading.jpg"],
      nurseSignature: "Emily Davis, RN"
    },
    {
      id: "3",
      date: "2024-08-01",
      type: "Wound Care",
      nurse: "Maria Rodriguez",
      duration: "60 minutes",
      vitals: {
        bp: "125/82",
        pulse: "75",
        temp: "98.8°F"
      },
      medications: ["Antibiotic ointment applied"],
      procedures: ["Wound cleaning", "Dressing change", "Infection assessment"],
      notes: "Wound healing well. No signs of infection. Continue current care routine.",
      nextVisit: "2024-08-08",
      status: "completed",
      photos: ["wound_before.jpg", "wound_after.jpg"],
      nurseSignature: "Maria Rodriguez, RN"
    }
  ],
  consultations: [
    {
      id: "1",
      date: "2024-08-08",
      doctor: "Dr. Ahmed Khan",
      type: "Follow-up",
      diagnosis: "Hypertension - Well Controlled",
      treatment: "Continue current medication regimen",
      cost: 1500,
      followUp: "2024-09-08",
      duration: "30 minutes",
      notes: "Patient responding well to treatment. Blood pressure stable.",
      recommendations: ["Continue medication", "Regular exercise", "Low sodium diet"]
    },
    {
      id: "2",
      date: "2024-07-15",
      doctor: "Dr. Sarah Ali",
      type: "Initial Consultation",
      diagnosis: "Type 2 Diabetes - Newly Diagnosed",
      treatment: "Metformin therapy initiated",
      cost: 2000,
      followUp: "2024-08-15",
      duration: "45 minutes",
      notes: "Patient educated on diabetes management. Lifestyle modifications discussed.",
      recommendations: ["Medication compliance", "Blood sugar monitoring", "Dietary changes"]
    }
  ],
  medicalHistory: {
    familyHistory: [
      { condition: "Hypertension", relation: "Father", ageOfOnset: 55 },
      { condition: "Diabetes Type 2", relation: "Mother", ageOfOnset: 62 },
      { condition: "Heart Disease", relation: "Grandfather (Paternal)", ageOfOnset: 70 }
    ],
    pastSurgeries: [
      { procedure: "Appendectomy", date: "2010-03-15", hospital: "City General Hospital" },
      { procedure: "Gallbladder Removal", date: "2018-11-22", hospital: "Metro Medical Center" }
    ],
    hospitalizations: [
      { reason: "Pneumonia", date: "2019-12-10", duration: "5 days", hospital: "City General Hospital" }
    ],
    immunizations: [
      { vaccine: "COVID-19", date: "2024-01-15", nextDue: "2025-01-15" },
      { vaccine: "Flu Shot", date: "2023-10-01", nextDue: "2024-10-01" },
      { vaccine: "Tetanus", date: "2022-05-20", nextDue: "2032-05-20" }
    ]
  },
  trackingSystem: {
    reminders: [
      { id: "1", type: "Medication", description: "Take Lisinopril", time: "08:00", frequency: "Daily", active: true },
      { id: "2", type: "Medication", description: "Take Metformin", time: "08:00,20:00", frequency: "Twice Daily", active: true },
      { id: "3", type: "Appointment", description: "Blood Pressure Check", date: "2024-08-17", active: true },
      { id: "4", type: "Test", description: "Blood Sugar Test", frequency: "Weekly", active: true }
    ],
    nurseUpdates: [
      { date: "2024-08-10", nurse: "Sarah Johnson", update: "Blood pressure checked - normal range", type: "Vital Signs" },
      { date: "2024-08-05", nurse: "Emily Davis", update: "Blood sugar monitoring completed", type: "Lab Work" },
      { date: "2024-08-01", nurse: "Maria Rodriguez", update: "Wound care performed - healing well", type: "Treatment" }
    ],
    progressTracking: {
      bloodPressure: [
        { date: "2024-08-10", systolic: 120, diastolic: 80, notes: "Normal" },
        { date: "2024-08-05", systolic: 118, diastolic: 78, notes: "Excellent" },
        { date: "2024-08-01", systolic: 125, diastolic: 82, notes: "Slightly elevated" }
      ],
      bloodSugar: [
        { date: "2024-08-10", value: 110, unit: "mg/dL", notes: "Fasting" },
        { date: "2024-08-05", value: 140, unit: "mg/dL", notes: "Post-meal" },
        { date: "2024-08-01", value: 105, unit: "mg/dL", notes: "Fasting" }
      ],
      weight: [
        { date: "2024-08-10", value: 179, unit: "lbs", notes: "Stable" },
        { date: "2024-08-01", value: 180, unit: "lbs", notes: "Slight decrease" },
        { date: "2024-07-15", value: 182, unit: "lbs", notes: "Baseline" }
      ]
    }
  }
};

export default function PatientRecordsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [records, setRecords] = useState(mockPatientRecords);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.userType !== "PATIENT") {
      router.push(`/dashboard/${session.user.userType.toLowerCase()}`);
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.userType !== "PATIENT") {
    return null;
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "medical-history", label: "Medical History", icon: "📚" },
    { id: "prescriptions", label: "Prescriptions", icon: "💊" },
    { id: "treatments", label: "Treatment History", icon: "🏥" },
    { id: "consultations", label: "Consultations", icon: "🩺" },
    { id: "tracking", label: "Progress Tracking", icon: "📈" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Medical Records</h1>
          <p className="text-slate-600">Complete health history and treatment tracking</p>
        </div>
        <Link
          href="/dashboard/patient"
          className="text-cyan-600 hover:text-cyan-700 flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Name:</span>
                <span className="font-medium">{records.personalInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Age:</span>
                <span className="font-medium">{records.personalInfo.age} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Blood Type:</span>
                <span className="font-medium">{records.personalInfo.bloodType}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Medical Conditions</h2>
            <div className="space-y-2">
              {records.personalInfo.conditions.map((condition, index) => (
                <span
                  key={index}
                  className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm mr-2 mb-2"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Allergies</h2>
            <div className="space-y-2">
              {records.personalInfo.allergies.map((allergy, index) => (
                <span
                  key={index}
                  className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mr-2 mb-2"
                >
                  ⚠️ {allergy}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600">{records.prescriptions.length}</div>
                <p className="text-sm text-slate-600">Active Prescriptions</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{records.treatmentHistory.length}</div>
                <p className="text-sm text-slate-600">Recent Treatments</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical History Tab */}
      {activeTab === "medical-history" && (
        <div className="space-y-8">
          {/* Family History */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Family History</h2>
            <div className="space-y-3">
              {records.medicalHistory.familyHistory.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{item.condition}</span>
                    <span className="text-muted-foreground ml-2">({item.relation})</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Age {item.ageOfOnset}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Past Surgeries */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Past Surgeries</h2>
            <div className="space-y-3">
              {records.medicalHistory.pastSurgeries.map((surgery, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{surgery.procedure}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(surgery.date).toLocaleDateString()} at {surgery.hospital}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Immunizations */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Immunizations</h2>
            <div className="space-y-3">
              {records.medicalHistory.immunizations.map((vaccine, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{vaccine.vaccine}</span>
                    <p className="text-sm text-muted-foreground">
                      Last: {new Date(vaccine.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm text-orange-600">
                    Next due: {new Date(vaccine.nextDue).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === "prescriptions" && (
        <div className="space-y-6">
          {records.prescriptions.map((prescription) => (
            <div key={prescription.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{prescription.medication}</h3>
                  <p className="text-slate-600">{prescription.frequency}</p>
                  <p className="text-sm text-slate-500">Prescribed by {prescription.doctor}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  prescription.status === "active" 
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {prescription.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Start Date:</span>
                  <p className="font-medium">{new Date(prescription.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-600">End Date:</span>
                  <p className="font-medium">{new Date(prescription.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-slate-600">Remaining:</span>
                  <p className="font-medium text-orange-600">{prescription.remaining}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Treatment History Tab */}
      {activeTab === "treatments" && (
        <div className="space-y-6">
          {records.treatmentHistory.map((treatment) => (
            <div key={treatment.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{treatment.type}</h3>
                  <p className="text-slate-600">by {treatment.nurse}</p>
                  <p className="text-sm text-slate-500">{new Date(treatment.date).toLocaleDateString()}</p>
                </div>
                {treatment.nextVisit && (
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Next Visit:</p>
                    <p className="font-medium text-cyan-600">{new Date(treatment.nextVisit).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Vitals</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(treatment.vitals).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-600 capitalize">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-slate-600">{treatment.notes}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Consultations Tab */}
      {activeTab === "consultations" && (
        <div className="space-y-6">
          {records.consultations.map((consultation) => (
            <div key={consultation.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{consultation.type} Consultation</h3>
                  <p className="text-slate-600">with {consultation.doctor}</p>
                  <p className="text-sm text-slate-500">{new Date(consultation.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">₹{consultation.cost}</p>
                  <p className="text-sm text-slate-500">Consultation Fee</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Diagnosis</h4>
                  <p className="text-sm text-slate-600">{consultation.diagnosis}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Treatment Plan</h4>
                  <p className="text-sm text-slate-600">{consultation.treatment}</p>
                </div>
              </div>
              
              {consultation.followUp && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-slate-600">
                    <strong>Follow-up scheduled:</strong> {new Date(consultation.followUp).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress Tracking Tab */}
      {activeTab === "tracking" && (
        <div className="space-y-8">
          {/* Active Reminders */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Active Reminders</h2>
            <div className="space-y-3">
              {records.trackingSystem.reminders.filter(r => r.active).map((reminder) => (
                <div key={reminder.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{reminder.description}</span>
                    <p className="text-sm text-muted-foreground">
                      {reminder.type} • {reminder.frequency}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{reminder.time}</span>
                    <Badge variant="secondary" className="ml-2">Active</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Nurse Updates */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Recent Nurse Updates</h2>
            <div className="space-y-3">
              {records.trackingSystem.nurseUpdates.map((update, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{update.nurse}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(update.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{update.update}</p>
                  <Badge variant="outline" className="text-xs">{update.type}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blood Pressure Tracking */}
            <div className="card">
              <h3 className="font-semibold mb-4">Blood Pressure</h3>
              <div className="space-y-2">
                {records.trackingSystem.progressTracking.bloodPressure.slice(0, 3).map((reading, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{new Date(reading.date).toLocaleDateString()}</span>
                    <span className="font-medium">{reading.systolic}/{reading.diastolic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Blood Sugar Tracking */}
            <div className="card">
              <h3 className="font-semibold mb-4">Blood Sugar</h3>
              <div className="space-y-2">
                {records.trackingSystem.progressTracking.bloodSugar.slice(0, 3).map((reading, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{new Date(reading.date).toLocaleDateString()}</span>
                    <span className="font-medium">{reading.value} {reading.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weight Tracking */}
            <div className="card">
              <h3 className="font-semibold mb-4">Weight</h3>
              <div className="space-y-2">
                {records.trackingSystem.progressTracking.weight.slice(0, 3).map((reading, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{new Date(reading.date).toLocaleDateString()}</span>
                    <span className="font-medium">{reading.value} {reading.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

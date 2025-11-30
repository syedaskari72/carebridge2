"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Pill, 
  Activity, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Heart,
  Thermometer,
  Weight,
  Droplets
} from "lucide-react";

// Mock data for treatment tracking
const mockTrackingData = {
  ongoingTreatments: [
    {
      id: "1",
      name: "Hypertension Management",
      startDate: "2024-07-01",
      duration: "3 months",
      progress: 75,
      status: "on-track",
      nextAppointment: "2024-08-15",
      nurse: "Sarah Johnson",
      description: "Blood pressure monitoring and medication management"
    },
    {
      id: "2", 
      name: "Diabetes Care",
      startDate: "2024-06-15",
      duration: "6 months",
      progress: 60,
      status: "needs-attention",
      nextAppointment: "2024-08-20",
      nurse: "Emily Davis",
      description: "Blood sugar monitoring and dietary guidance"
    }
  ],
  medicationSchedule: [
    {
      id: "1",
      name: "Lisinopril 10mg",
      time: "08:00",
      frequency: "Daily",
      taken: true,
      nextDose: "2024-08-12T08:00:00",
      streak: 15
    },
    {
      id: "2",
      name: "Metformin 500mg", 
      time: "08:00, 20:00",
      frequency: "Twice daily",
      taken: false,
      nextDose: "2024-08-12T20:00:00",
      streak: 12
    },
    {
      id: "3",
      name: "Aspirin 81mg",
      time: "20:00", 
      frequency: "Daily",
      taken: true,
      nextDose: "2024-08-13T20:00:00",
      streak: 30
    }
  ],
  vitalsHistory: [
    {
      date: "2024-08-10",
      bloodPressure: { systolic: 120, diastolic: 80 },
      bloodSugar: 110,
      weight: 70,
      temperature: 98.6
    },
    {
      date: "2024-08-08",
      bloodPressure: { systolic: 118, diastolic: 78 },
      bloodSugar: 105,
      weight: 70.2,
      temperature: 98.4
    },
    {
      date: "2024-08-05",
      bloodPressure: { systolic: 125, diastolic: 82 },
      bloodSugar: 115,
      weight: 70.5,
      temperature: 98.8
    }
  ],
  upcomingTasks: [
    {
      id: "1",
      task: "Blood pressure check",
      dueDate: "2024-08-12",
      type: "measurement",
      priority: "high"
    },
    {
      id: "2",
      task: "Medication refill - Lisinopril",
      dueDate: "2024-08-15",
      type: "medication",
      priority: "medium"
    },
    {
      id: "3",
      task: "Follow-up with Dr. Ahmed",
      dueDate: "2024-08-18",
      type: "appointment",
      priority: "high"
    }
  ]
};

export default function TreatmentTrackingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [treatmentData, setTreatmentData] = useState<any>(null);

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

    fetchTreatmentData();
  }, [session, status, router]);

  const fetchTreatmentData = async () => {
    try {
      const res = await fetch("/api/patient/treatment-data");
      const data = await res.json();
      if (data.treatment) {
        setTreatmentData(data.treatment);
      }
    } catch (error) {
      console.error("Error fetching treatment data:", error);
    }
  };

  const markMedicationTaken = (medicationId: string) => {
    // In a real app, this would update the backend
    console.log(`Marking medication ${medicationId} as taken`);
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.userType !== "PATIENT") {
    return null;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Treatment Tracking</h1>
            <p className="text-muted-foreground">Monitor your health progress and medication schedule</p>
          </div>
          <Link
            href="/dashboard/patient"
            className="text-primary hover:underline flex items-center gap-2"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Ongoing Treatments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Ongoing Treatments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {treatmentData ? [
                    {
                      id: "1",
                      name: treatmentData.treatmentName,
                      progress: treatmentData.progress,
                      status: treatmentData.progress >= 70 ? "on-track" : "needs-attention",
                      nurse: "Your Nurse",
                      description: "Current treatment plan"
                    }
                  ].map((treatment) => (
                    <div key={treatment.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{treatment.name}</h3>
                          <p className="text-sm text-muted-foreground">{treatment.description}</p>
                        </div>
                        <Badge variant={treatment.status === 'on-track' ? 'default' : 'destructive'}>
                          {treatment.status === 'on-track' ? 'On Track' : 'Needs Attention'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{treatment.progress}%</span>
                        </div>
                        <Progress value={treatment.progress} className="h-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Nurse: {treatment.nurse}</span>
                        </div>
                      </div>
                    </div>
                  )) : mockTrackingData.ongoingTreatments.map((treatment) => (
                    <div key={treatment.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{treatment.name}</h3>
                          <p className="text-sm text-muted-foreground">{treatment.description}</p>
                        </div>
                        <Badge variant={treatment.status === 'on-track' ? 'default' : 'destructive'}>
                          {treatment.status === 'on-track' ? 'On Track' : 'Needs Attention'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{treatment.progress}%</span>
                        </div>
                        <Progress value={treatment.progress} className="h-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Nurse: {treatment.nurse}</span>
                          <span>Next: {new Date(treatment.nextAppointment).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">{treatmentData?.vitals?.bloodPressure || "120/80"}</p>
                  <p className="text-sm text-muted-foreground">Blood Pressure</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{treatmentData?.vitals?.bloodSugar || "110"}</p>
                  <p className="text-sm text-muted-foreground">Blood Sugar</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Weight className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{treatmentData?.vitals?.weight || "70"}kg</p>
                  <p className="text-sm text-muted-foreground">Weight</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Pill className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">95%</p>
                  <p className="text-sm text-muted-foreground">Medication Adherence</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Today's Medication Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {treatmentData?.medications ? treatmentData.medications.map((medication: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full bg-gray-300" />
                        <div>
                          <h3 className="font-semibold">{medication.name}</h3>
                          <p className="text-sm text-muted-foreground">{medication.time} • {medication.frequency}</p>
                        </div>
                      </div>
                    </div>
                  )) : mockTrackingData.medicationSchedule.map((medication) => (
                    <div key={medication.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full ${medication.taken ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <h3 className="font-semibold">{medication.name}</h3>
                          <p className="text-sm text-muted-foreground">{medication.time} • {medication.frequency}</p>
                          <p className="text-xs text-muted-foreground">Streak: {medication.streak} days</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {medication.taken ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Taken
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => markMedicationTaken(medication.id)}
                          >
                            Mark Taken
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vitals Tab */}
          <TabsContent value="vitals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Vitals History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTrackingData.vitalsHistory.map((record, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">{new Date(record.date).toLocaleDateString()}</h3>
                        <Badge variant="outline">Recorded</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Blood Pressure</p>
                          <p className="font-medium">{record.bloodPressure.systolic}/{record.bloodPressure.diastolic}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Blood Sugar</p>
                          <p className="font-medium">{record.bloodSugar} mg/dL</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Weight</p>
                          <p className="font-medium">{record.weight} kg</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Temperature</p>
                          <p className="font-medium">{record.temperature}°F</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTrackingData.upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          task.priority === 'high' ? 'bg-red-500' : 
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <h3 className="font-semibold">{task.task}</h3>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

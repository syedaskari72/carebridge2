"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  FileText, 
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  DollarSign,
  Activity,
  Shield,
  Clock
} from "lucide-react";

// Interfaces
interface AdminStats {
  totalUsers: number;
  totalPatients: number;
  totalNurses: number;
  totalDoctors: number;
  pendingVerifications: number;
  activeBookings: number;
  totalRevenue: number;
  emergencyAlerts: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userType: 'PATIENT' | 'NURSE' | 'DOCTOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  patient?: {
    id: string;
  };
  nurse?: {
    id: string;
    isVerified: boolean;
    department: string;
    licenseNumber: string;
    documents: NurseDocument[];
  };
  doctor?: {
    id: string;
    isVerified: boolean;
    department: string;
    specialization: string;
    licenseNumber: string;
  };
}

interface NurseDocument {
  id: string;
  type: string;
  fileName: string;
  fileUrl: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  booking: {
    id: string;
    patient: {
      name: string;
    };
    nurse?: {
      name: string;
    };
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State management
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/admin");
      return;
    }

    if (session.user.userType !== "ADMIN") {
      router.push("/auth/admin");
      return;
    }

    // Load admin data
    loadAdminData();
  }, [session, status, router]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load users
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      // Load payments
      const paymentsResponse = await fetch('/api/admin/payments');
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole }),
      });

      if (response.ok) {
        await loadAdminData(); // Reload data
      }
    } catch (error) {
      console.error('Failed to change user role:', error);
    }
  };

  const handleVerifyNurse = async (nurseId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/admin/verify-nurse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nurseId, action }),
      });

      if (response.ok) {
        await loadAdminData(); // Reload data
      }
    } catch (error) {
      console.error('Failed to verify nurse:', error);
    }
  };

  const handleVerifyDocument = async (documentId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const response = await fetch('/api/admin/verify-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, action, notes }),
      });

      if (response.ok) {
        await loadAdminData(); // Reload data
      }
    } catch (error) {
      console.error('Failed to verify document:', error);
    }
  };

  // Filter users based on search and type
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = userTypeFilter === "ALL" || user.userType === userTypeFilter;
    return matchesSearch && matchesType;
  });

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.userType !== "ADMIN") {
    return null;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, verify professionals, and monitor system activity</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Verifications</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.pendingVerifications}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">PKR {stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Emergency Alerts</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.emergencyAlerts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="users" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="verifications" className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Nurse Verification</span>
              <span className="sm:hidden">Verify</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm py-2">Payments</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">Analytics</TabsTrigger>
          </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage all users, change roles, and monitor activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Users</SelectItem>
                    <SelectItem value="PATIENT">Patients</SelectItem>
                    <SelectItem value="NURSE">Nurses</SelectItem>
                    <SelectItem value="DOCTOR">Doctors</SelectItem>
                    <SelectItem value="ADMIN">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table - Mobile Responsive */}
              <div className="space-y-3 sm:space-y-0">
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-foreground">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={user.userType === 'ADMIN' ? 'default' : 'secondary'}>
                              {user.userType}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant={user.isActive ? 'default' : 'destructive'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Select onValueChange={(value) => handleUserRoleChange(user.id, value)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Change Role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PATIENT">Patient</SelectItem>
                                  <SelectItem value="NURSE">Nurse</SelectItem>
                                  <SelectItem value="DOCTOR">Doctor</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {filteredUsers.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={user.userType === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                              {user.userType}
                            </Badge>
                            <Badge variant={user.isActive ? 'default' : 'destructive'} className="text-xs">
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select onValueChange={(value) => handleUserRoleChange(user.id, value)}>
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue placeholder="Role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PATIENT">Patient</SelectItem>
                                <SelectItem value="NURSE">Nurse</SelectItem>
                                <SelectItem value="DOCTOR">Doctor</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nurse Verification Tab - Will be added in next part */}
        <TabsContent value="verifications">
          <Card>
            <CardHeader>
              <CardTitle>Nurse Verification</CardTitle>
              <CardDescription>
                Review and verify nurse documents and credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Nurse verification content will be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs will be added in subsequent parts */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Payment management content will be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Analytics content will be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

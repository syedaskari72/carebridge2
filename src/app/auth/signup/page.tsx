"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Upload, MapPin, Eye, EyeOff } from "lucide-react";
import { validatePakistaniCNIC, validatePakistaniPhone, formatCNIC, formatPakistaniPhone } from "@/lib/validation";
import { getCurrentLocationWithAddress } from "@/lib/geocoding";
import ErrorModal from "@/components/ErrorModal";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    cnic: "",
    gender: "",
    address: "",
    userType: "PATIENT",
    // Professional fields
    department: "",
    specialization: "",
    licenseNumber: "",
    experience: "",
    hourlyRate: "",
    consultationFee: "",
    bio: "",
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type?: "error" | "success" | "warning" | "info";
    details?: string;
    actionLabel?: string;
    onAction?: () => void;
  }>({
    isOpen: false,
    message: ""
  });
  const [validationErrors, setValidationErrors] = useState<{
    cnic?: string;
    phone?: string;
  }>({});
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Clear previous validation errors
    setValidationErrors(prev => ({
      ...prev,
      [name]: undefined
    }));

    // Format and validate specific fields
    let formattedValue = value;

    if (name === 'cnic') {
      formattedValue = formatCNIC(value);
      // Validate when we have enough digits (13 digits total)
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 13) {
        const validation = validatePakistaniCNIC(formattedValue);
        if (!validation.isValid) {
          setValidationErrors(prev => ({
            ...prev,
            cnic: validation.error
          }));
        } else {
          // Show gender info for valid CNIC
          const genderDigit = parseInt(digits[12]);
          const gender = genderDigit % 2 === 0 ? "Female" : "Male";
          setValidationErrors(prev => ({
            ...prev,
            cnic: undefined
          }));
        }
      }
    } else if (name === 'phone') {
      formattedValue = formatPakistaniPhone(value);
      if (value.length >= 10) {
        const validation = validatePakistaniPhone(formattedValue);
        if (!validation.isValid) {
          setValidationErrors(prev => ({
            ...prev,
            phone: validation.error
          }));
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);

    try {
      console.log('Getting current location...');
      const { coordinates, address, accuracy } = await getCurrentLocationWithAddress();

      console.log('Location received:', { coordinates, address, accuracy });

      setFormData(prev => ({
        ...prev,
        address: address.formattedShort
      }));

      setErrorModal({
        isOpen: true,
        type: "success",
        title: "Location Found",
        message: `Your location has been set to: ${address.formattedShort}`,
        details: `Coordinates: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)} (Accuracy: ${Math.round(accuracy)}m)`
      });

    } catch (error: any) {
      console.error('Location error:', error);
      setErrorModal({
        isOpen: true,
        type: "error",
        title: "Location Error",
        message: error.message || "Unable to get your location",
        details: "Please ensure location permissions are enabled in your browser settings and try again, or enter your address manually."
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrorModal({
        isOpen: true,
        type: "error",
        title: "Password Mismatch",
        message: "The passwords you entered do not match. Please check and try again."
      });
      setIsLoading(false);
      return;
    }

    // Final validation check
    if (formData.cnic) {
      const cnicValidation = validatePakistaniCNIC(formData.cnic);
      if (!cnicValidation.isValid) {
        setErrorModal({
          isOpen: true,
          type: "error",
          title: "Invalid CNIC",
          message: cnicValidation.error || "Please enter a valid Pakistani CNIC"
        });
        setIsLoading(false);
        return;
      }
    }

    if (formData.phone) {
      const phoneValidation = validatePakistaniPhone(formData.phone);
      if (!phoneValidation.isValid) {
        setErrorModal({
          isOpen: true,
          type: "error",
          title: "Invalid Phone Number",
          message: phoneValidation.error || "Please enter a valid Pakistani phone number"
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      // Add documents for nurses/doctors
      documents.forEach((file, index) => {
        submitData.append(`document_${index}`, file);
      });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: submitData, // Use FormData instead of JSON
      });

      const responseData = await response.json();

      if (response.ok) {
        setErrorModal({
          isOpen: true,
          type: "success",
          title: "Registration Successful",
          message: isProfessional
            ? "Your account has been created successfully! Professional accounts require verification before activation. You'll receive an email once your credentials are verified."
            : "Your account has been created successfully! You can now sign in.",
          actionLabel: "Go to Sign In",
          onAction: () => router.push("/auth/signin")
        });
      } else {
        setErrorModal({
          isOpen: true,
          type: "error",
          title: "Registration Failed",
          message: responseData.error || "An error occurred during registration",
          details: response.status === 400 ? "Please check your information and try again." : "Please try again later or contact support if the problem persists."
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setErrorModal({
        isOpen: true,
        type: "error",
        title: "Network Error",
        message: "Unable to connect to the server. Please check your internet connection and try again.",
        details: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isProfessional = formData.userType === "NURSE" || formData.userType === "DOCTOR";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl border-0 md:border shadow-none md:shadow-sm">
        <CardHeader className="text-center pt-8 md:pt-6">
          <div className="mx-auto h-16 w-16 md:h-12 md:w-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl md:rounded-lg flex items-center justify-center mb-6 md:mb-4 shadow-lg">
            <img src="/applogo.png" alt="CareBridge" className="w-12 h-12 md:w-8 md:h-8 object-contain" />
          </div>
          <CardTitle className="text-3xl md:text-2xl font-bold">Join CareBridge</CardTitle>
          <CardDescription className="text-base md:text-sm mt-2">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 md:px-6">

          <form className="space-y-5 md:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userType">I am a</Label>
                <Select value={formData.userType} onValueChange={(value) => setFormData(prev => ({ ...prev, userType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PATIENT">Patient</SelectItem>
                    <SelectItem value="NURSE">Nurse</SelectItem>
                    <SelectItem value="DOCTOR">Doctor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnic">CNIC</Label>
                  <Input
                    id="cnic"
                    name="cnic"
                    type="text"
                    placeholder="12345-1234567-1"
                    value={formData.cnic}
                    onChange={handleChange}
                    className={validationErrors.cnic ? "border-red-500" : ""}
                  />
                  {validationErrors.cnic && (
                    <p className="text-sm text-red-600">{validationErrors.cnic}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+92 300 1234567"
                  className={validationErrors.phone ? "border-red-500" : ""}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-600">{validationErrors.phone}</p>
                )}
              </div>

              {/* Address for Patients */}
              {formData.userType === "PATIENT" && (
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter your address"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="shrink-0"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      {isGettingLocation ? "Getting..." : "GPS"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Professional Fields */}
              {isProfessional && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">General</SelectItem>
                        <SelectItem value="CARDIOLOGY">Cardiology</SelectItem>
                        <SelectItem value="PEDIATRICS">Pediatrics</SelectItem>
                        <SelectItem value="ICU">ICU</SelectItem>
                        <SelectItem value="EMERGENCY">Emergency</SelectItem>
                        <SelectItem value="ORTHOPEDICS">Orthopedics</SelectItem>
                        <SelectItem value="NEUROLOGY">Neurology</SelectItem>
                        <SelectItem value="GYNECOLOGY">Gynecology</SelectItem>
                        <SelectItem value="DERMATOLOGY">Dermatology</SelectItem>
                        <SelectItem value="PSYCHIATRY">Psychiatry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.userType === "DOCTOR" && (
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        name="specialization"
                        type="text"
                        value={formData.specialization}
                        onChange={handleChange}
                        placeholder="e.g., Interventional Cardiology"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        name="licenseNumber"
                        type="text"
                        required={isProfessional}
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        placeholder="Professional license number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience (years)</Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="text"
                        value={formData.experience}
                        onChange={handleChange}
                        placeholder="e.g., 5 years"
                      />
                    </div>
                  </div>

                  {/* Document Upload for Professionals */}
                  <div className="space-y-2">
                    <Label htmlFor="documents">Upload Documents</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                      <Input
                        id="documents"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleDocumentUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="documents"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground text-center">
                          Click to upload license, certificates, and other documents
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          PDF, JPG, PNG (Max 10MB each)
                        </span>
                      </label>
                      {documents.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {documents.map((file, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              📄 {file.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 md:h-10 text-base md:text-sm font-semibold"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>

            {isProfessional && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Professional accounts require verification before activation.
                  You'll receive an email once your credentials are verified.
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
        details={errorModal.details}
        actionLabel={errorModal.actionLabel}
        onAction={errorModal.onAction}
      />
    </div>
  );
}

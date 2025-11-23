"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("PATIENT");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("[SignIn] Attempting login", { email, userType });

      const result = await signIn("credentials", {
        email,
        password,
        userType,
        redirect: false,
      });

      console.log("[SignIn] SignIn result", result);

      if (result?.error) {
        console.log("[SignIn] Login failed", { error: result.error });
        setError("Invalid credentials");
      } else if (result?.ok) {
        console.log("[SignIn] Login successful, redirecting...");
        // Force a page reload to ensure session is properly established
        // This is more reliable on Vercel than trying to get session immediately
        window.location.href = "/dashboard/patient"; // Default redirect, middleware will handle proper routing
      } else {
        console.log("[SignIn] Unexpected result", result);
        setError("Login failed - please try again");
      }
    } catch (error) {
      console.error("[SignIn] Exception during login", error);
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:bg-background py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-0 md:border shadow-none md:shadow-sm">
        <CardHeader className="text-center pt-8 md:pt-6">
          <div className="mx-auto h-16 w-16 md:h-12 md:w-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl md:rounded-lg flex items-center justify-center mb-6 md:mb-4 shadow-lg">
            <img src="/applogo.png" alt="CareBridge" className="w-12 h-12 md:w-8 md:h-8 object-contain" />
          </div>
          <CardTitle className="text-3xl md:text-2xl font-bold">Sign in to CareBridge</CardTitle>
          <CardDescription className="text-base md:text-sm mt-2">
            Or{" "}
            <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
              create a new account
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
                <Select value={userType} onValueChange={setUserType}>
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
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 md:h-10 text-base md:text-sm font-semibold"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            {/* Google OAuth temporarily disabled - will be enabled when properly configured */}

            <div className="text-center">
              <Link
                href="/auth/emergency"
                className="text-destructive hover:underline font-medium text-sm"
              >
                🚨 Emergency Access (No Signup Required)
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

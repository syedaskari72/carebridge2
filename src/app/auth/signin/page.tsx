"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("PATIENT");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        userType,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials");
      } else if (result?.ok) {
        // Force a page reload to ensure session is properly established
        // This is more reliable on Vercel than trying to get session immediately
        window.location.href = "/dashboard/patient"; // Default redirect, middleware will handle proper routing
      }
    } catch (error) {
      console.error("[SignIn] error", error);
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <CardTitle className="text-2xl">Sign in to CareBridge</CardTitle>
          <CardDescription>
            Or{" "}
            <Link href="/auth/signup" className="font-medium text-primary hover:underline">
              create a new account
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>

          <form className="space-y-6" onSubmit={handleSubmit}>
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
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
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

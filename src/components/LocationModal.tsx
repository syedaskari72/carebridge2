"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, X } from "lucide-react";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSubmit: (address: string) => void;
}

export default function LocationModal({ isOpen, onClose, onAddressSubmit }: LocationModalProps) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📍 LocationModal: Submit clicked, address:", address);
    if (!address.trim()) {
      alert("Please enter your address");
      return;
    }
    
    setLoading(true);
    try {
      console.log("📍 LocationModal: Calling onAddressSubmit with:", address.trim());
      // Pass the address back to parent component
      onAddressSubmit(address.trim());
      setAddress("");
    } catch (error) {
      console.error("❌ LocationModal: Error submitting address:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAddress("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cyan-600" />
              <CardTitle>Enter Your Address</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            We couldn't get your location automatically. Please enter your address so the nurse knows where to visit you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="address">Your Full Address *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House #, Street, Area, City"
                required
                autoFocus
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include house number, street name, area, and city for accurate location
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                Cancel Booking
              </Button>
              <Button type="submit" disabled={loading || !address.trim()} className="flex-1">
                {loading ? "Saving..." : "Save Address"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

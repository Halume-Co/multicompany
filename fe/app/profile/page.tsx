"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/contexts/AuthContext";
import * as api from "@/lib/api";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!user) {
    return (
      <>
        <Header />
        <main className="bg-background min-h-screen py-3xl text-center">
          <p className="text-muted-foreground">Please sign in to view your profile.</p>
        </main>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await api.fetchAPI<{ user: any }>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: formData.name }),
      });

      if (res.success) {
        await refreshUser();
        setMessage({ type: "success", text: "Profile updated successfully!" });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to update profile" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-3xl mx-auto px-lg py-3xl">
          <div className="mb-3xl">
            <h1 className="text-4xl font-bold text-foreground mb-sm">My Profile</h1>
            <p className="text-muted-foreground">Manage your personal information and account settings</p>
          </div>

          <div className="grid gap-xl">
            <div className="border border-border rounded-lg bg-card p-lg space-y-lg">
              <h2 className="text-xl font-bold text-foreground">Personal Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-lg">
                <div>
                  <label className="block text-sm font-medium mb-sm">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-sm">Email Address</label>
                  <Input
                    value={formData.email}
                    disabled
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground mt-xs">Email cannot be changed.</p>
                </div>

                {message && (
                  <div className={`p-md rounded-md text-sm ${
                    message.type === "success" ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="border border-border rounded-lg bg-card p-lg space-y-lg">
              <h2 className="text-xl font-bold text-foreground">Account Details</h2>
              <div className="grid grid-cols-2 gap-md text-sm">
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Member Since</p>
                  <p className="font-medium">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerCompany, getMyCompany, updateMyCompany } from "@/lib/api";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSellerAccess } from "@/lib/hooks/useSellerAccess";
import { CompanyRegistrationInput } from "@/lib/types";

export default function SellerCompanyPage() {
  const { user, canRender } = useSellerAccess({ requireCompany: false });
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<CompanyRegistrationInput>({
    name: "",
    description: "",
    logoUrl: "",
    email: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isEditing = !!user?.companyId;

  useEffect(() => {
    if (isEditing) {
      getMyCompany().then(res => {
        if (res.success && res.data) {
          setFormData({
            name: res.data.name,
            description: res.data.description || "",
            logoUrl: res.data.logoUrl || "",
            email: res.data.email || "",
            phone: res.data.phone || "",
            address: res.data.address || "",
          });
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing && user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || user.email,
      }));
    }
  }, [user, isEditing]);

  if (!canRender) {
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const payload = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      logoUrl: formData.logoUrl?.trim() || undefined,
      email: formData.email.trim(),
      phone: formData.phone?.trim() || undefined,
      address: formData.address?.trim() || undefined,
    };

    const response = isEditing 
      ? await updateMyCompany(payload)
      : await registerCompany(payload);

    if (!response.success) {
      setError(response.error || `Failed to ${isEditing ? 'update' : 'create'} company profile`);
      setIsSubmitting(false);
      return;
    }

    if (!isEditing) {
      await refreshUser();
      router.replace("/seller/dashboard");
    } else {
      setSuccess("Company profile updated successfully!");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-background">
        <section className="max-w-3xl mx-auto px-lg py-3xl">
          <div className="mb-2xl">
            <h1 className="text-4xl font-bold text-foreground mb-sm">
              {isEditing ? "Edit Company Profile" : "Set Up Your Seller Company"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing 
                ? "Update your company information visible to customers."
                : "Your seller account is active. Create a company profile before listing products or managing orders."
              }
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-3xl">
              <p className="text-muted-foreground animate-pulse">Loading profile...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-xl">
              <div className="border border-border rounded-lg p-lg space-y-lg">
                <div>
                  <label className="block text-sm font-medium mb-sm">
                    Company Name
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-sm">
                    Company Email
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-sm">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    rows={4}
                    className="w-full px-md py-sm border border-border rounded-md bg-background text-foreground"
                    placeholder="What does your brand sell?"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-lg">
                  <div>
                    <label className="block text-sm font-medium mb-sm">
                      Phone
                    </label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-sm">
                      Logo URL
                    </label>
                    <Input
                      name="logoUrl"
                      type="url"
                      value={formData.logoUrl}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-sm">
                    Address
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-md rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-100 text-green-700 text-sm p-md rounded-md">
                  {success}
                </div>
              )}

              <div className="flex justify-between items-center">
                {isEditing && (
                  <Button variant="outline" onClick={() => router.back()}>
                    Back
                  </Button>
                )}
                <div className="flex-1" />
                <Button type="submit" disabled={isSubmitting} size="lg">
                  {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Company"}
                </Button>
              </div>
            </form>
          )}
        </section>
      </main>
    </>
  );
}

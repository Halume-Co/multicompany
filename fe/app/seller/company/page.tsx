"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerCompany } from "@/lib/api";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.companyId) {
      router.replace("/seller/dashboard");
    }
  }, [router, user]);

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || user.email,
      }));
    }
  }, [user]);

  if (!canRender || user?.companyId) {
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
    setIsSubmitting(true);

    const response = await registerCompany({
      ...formData,
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      logoUrl: formData.logoUrl?.trim() || undefined,
      email: formData.email.trim(),
      phone: formData.phone?.trim() || undefined,
      address: formData.address?.trim() || undefined,
    });

    if (!response.success) {
      setError(response.error || "Failed to create company profile");
      setIsSubmitting(false);
      return;
    }

    await refreshUser();
    router.replace("/seller/dashboard");
  };

  return (
    <>
      <Header />
      <main className="bg-background">
        <section className="max-w-3xl mx-auto px-lg py-3xl">
          <div className="mb-2xl">
            <h1 className="text-4xl font-bold text-foreground mb-sm">
              Set Up Your Seller Company
            </h1>
            <p className="text-muted-foreground">
              Your seller account is active. Create a company profile before
              listing products or managing orders.
            </p>
          </div>

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

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? "Saving..." : "Create Company"}
              </Button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

interface UseSellerAccessOptions {
  requireCompany?: boolean;
}

export function useSellerAccess(options: UseSellerAccessOptions = {}) {
  const { requireCompany = true } = options;
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    if (user?.role !== "seller") {
      router.replace("/");
      return;
    }

    if (requireCompany && !user.companyId) {
      router.replace("/seller/company");
    }
  }, [isAuthenticated, isLoading, requireCompany, router, user]);

  return {
    user,
    isLoading,
    canRender:
      !isLoading &&
      isAuthenticated &&
      user?.role === "seller" &&
      (!requireCompany || Boolean(user.companyId)),
  };
}

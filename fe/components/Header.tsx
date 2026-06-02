"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/contexts/CartContext";
import { useAuth } from "@/lib/contexts/AuthContext";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { getTotalItems } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/");
    }
  };
  const primaryHref =
    user?.role === "seller"
      ? user.companyId
        ? "/seller/dashboard"
        : "/seller/company"
      : "/cart";
  const primaryLabel =
    user?.role === "seller"
      ? user.companyId
        ? "Dashboard"
        : "Finish Setup"
      : "Cart";
  const secondaryHref = user?.role === "seller" ? "/seller/orders" : "/";
  const secondaryLabel = user?.role === "seller" ? "Orders" : "Shop";
  const displayName = user?.name ?? user?.email ?? "Account";

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-lg">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-sm">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-lg hidden lg:inline">
              Shoe Marketplace
            </span>
          </Link>

          <div className="flex-1 max-w-2xl mx-xl hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for premium shoes..."
                className="w-full h-10 pl-10 pr-md bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              <div className="absolute left-sm top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-md">
            {isAuthenticated ? (
              <>
                <Link
                  href="/cart"
                  className="relative p-sm hover:bg-secondary rounded-md transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10 0l2 9m-9-9h0"
                    />
                  </svg>
                  {getTotalItems() > 0 && (
                    <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="text-sm font-medium text-foreground hover:text-primary transition"
                  >
                    {displayName}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-md bg-background border border-border rounded-lg py-sm min-w-48">
                      <Link
                        href="/profile"
                        className="block px-lg py-sm text-sm text-foreground hover:bg-secondary transition"
                      >
                        My Profile
                      </Link>
                      <Link
                        href={primaryHref}
                        className="block px-lg py-sm text-sm text-foreground hover:bg-secondary transition"
                      >
                        {primaryLabel}
                      </Link>
                      <Link
                        href={secondaryHref}
                        className="block px-lg py-sm text-sm text-foreground hover:bg-secondary transition"
                      >
                        {secondaryLabel}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-lg py-sm text-sm text-destructive hover:bg-destructive/10 transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex gap-sm">
                <Button variant="outline" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

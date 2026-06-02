"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Cart, Product } from "../types";
import * as api from "../api";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cart: Cart;
  isLoading: boolean;
  addToCart: (product: Product, size: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string, size: string) => Promise<void>;
  updateQuantity: (
    productId: string,
    size: string,
    quantity: number
  ) => Promise<void>;
  clearCart: () => void;
  getTotalItems: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  const refreshCart = async () => {
    setIsLoading(true);
    const res = await api.fetchAPI<Cart>("/cart");
    if (res.success && res.data) {
      setCart(res.data);
    } else if (res.success === false && !res.error?.includes("401")) {
      console.error("Cart refresh failed:", res.error);
    }
    setIsLoading(false);
  };

  // Load cart from server on mount or when auth changes
  useEffect(() => {
    if (isAuthLoading) return;
    
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCart({
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      });
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading]);

  const addToCart = async (product: Product, size: string, quantity: number) => {
    if (!isAuthenticated) {
      // For non-authenticated users, we could use localStorage, 
      // but the requirement seems to be backend-integrated checkout.
      alert("Please login to add items to cart");
      return;
    }

    const res = await api.fetchAPI("/cart/add", {
      method: "POST",
      body: JSON.stringify({
        productId: product.id,
        size,
        quantity,
      }),
    });

    if (res.success) {
      await refreshCart();
    } else {
      alert("Failed to add to cart: " + (res.error || "Unknown error"));
    }
  };

  const removeFromCart = async (productId: string, size: string) => {
    if (!isAuthenticated) return;

    const res = await api.fetchAPI("/cart/remove", {
      method: "DELETE",
      body: JSON.stringify({
        productId,
        size,
      }),
    });

    if (res.success) {
      await refreshCart();
    }
  };

  const updateQuantity = async (
    productId: string,
    size: string,
    quantity: number
  ) => {
    if (!isAuthenticated) return;
    
    if (quantity <= 0) {
      await removeFromCart(productId, size);
      return;
    }
    
    const res = await api.fetchAPI<Cart>("/cart/update", {
      method: "PATCH",
      body: JSON.stringify({
        productId,
        size,
        quantity,
      }),
    });

    if (res.success && res.data) {
      setCart(res.data);
    } else {
      await refreshCart(); // Fallback to refresh if error
    }
  };

  const clearCart = () => {
    setCart({
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    });
  };

  const getTotalItems = () => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Cart, CartItem, Product } from "../types";

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, size: string, quantity: number) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (
    productId: string,
    size: string,
    quantity: number
  ) => void;
  clearCart: () => void;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "shoe_marketplace_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to load cart from storage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const calculateTotals = (items: CartItem[]) => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const addToCart = (product: Product, size: string, quantity: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.items.find(
        (item) => item.productId === product.id && item.size === size
      );

      let newItems: CartItem[];

      if (existingItem) {
        newItems = prevCart.items.map((item) =>
          item.productId === product.id && item.size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [
          ...prevCart.items,
          {
            productId: product.id,
            product,
            size,
            quantity,
            price: product.price,
          },
        ];
      }

      const { subtotal, tax, total } = calculateTotals(newItems);

      return { items: newItems, subtotal, tax, total };
    });
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter(
        (item) => !(item.productId === productId && item.size === size)
      );

      const { subtotal, tax, total } = calculateTotals(newItems);

      return { items: newItems, subtotal, tax, total };
    });
  };

  const updateQuantity = (
    productId: string,
    size: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }

    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, quantity }
          : item
      );

      const { subtotal, tax, total } = calculateTotals(newItems);

      return { items: newItems, subtotal, tax, total };
    });
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
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
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

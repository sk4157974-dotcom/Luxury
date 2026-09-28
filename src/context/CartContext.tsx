import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, CartItem } from '../types';
import { RESTAURANT_CONFIG } from '../config/restaurant';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (dish: MenuItem, quantity?: number) => void;
  removeFromCart: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  lastAddedDish: MenuItem | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Initial sample item for instant discovery or empty
    const trufflePasta = RESTAURANT_CONFIG.menu.find((m) => m.id === 'main-1');
    return trufflePasta ? [{ dish: trufflePasta, quantity: 1 }] : [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const [lastAddedDish, setLastAddedDish] = useState<MenuItem | null>(null);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const addToCart = (dish: MenuItem, quantity = 1) => {
    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prevItems.map((item) =>
          item.dish.id === dish.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { dish, quantity }];
    });

    setLastAddedDish(dish);
    // Auto-clear notification after 3 seconds
    setTimeout(() => {
      setLastAddedDish(null);
    }, 3000);
  };

  const removeFromCart = (dishId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.dish.id !== dishId));
  };

  const updateQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(dishId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.dish.id === dishId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.dish.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        lastAddedDish
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

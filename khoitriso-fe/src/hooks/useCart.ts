import { useState, useEffect } from 'react';
import { orderService } from '@/services/orderService';
import type { CartItem, Order } from '@/types';

/**
 * Cart Hook
 * Manage shopping cart
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getCart();
      setItems(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cart';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (itemType: 'course' | 'book', itemId: number, quantity = 1) => {
    setError(null);
    try {
      await orderService.addToCart({ itemType, itemId, quantity });
      await fetchCart();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to cart';
      setError(errorMessage);
      throw err;
    }
  };

  const removeFromCart = async (id: number) => {
    setError(null);
    try {
      await orderService.removeFromCart(id);
      await fetchCart();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from cart';
      setError(errorMessage);
      throw err;
    }
  };

  const clearCart = async () => {
    setError(null);
    try {
      await orderService.clearCart();
      setItems([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart';
      setError(errorMessage);
      throw err;
    }
  };

  const totalAmount = items.reduce((sum, item) => {
    const price = item.item ? 
      ('discountPrice' in item.item ? item.item.discountPrice || item.item.price : item.item.price) : 
      0;
    return sum + (price * item.quantity);
  }, 0);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    fetchCart();
  }, []);

  return {
    items,
    totalAmount,
    totalItems,
    loading,
    error,
    addToCart,
    removeFromCart,
    clearCart,
    refetch: fetchCart,
  };
}

/**
 * Orders Hook
 * Manage user orders
 */
export function useOrders(page = 1) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrders(page);
      setOrders(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
  };
}

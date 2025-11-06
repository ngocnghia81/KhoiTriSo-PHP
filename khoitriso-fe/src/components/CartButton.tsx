'use client';

import { useEffect, useState } from 'react';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { getCart } from '@/services/cart';

export default function CartButton({ onOpen }: { onOpen: () => void }) {
  const [count, setCount] = useState<number>(0);

  const refresh = async () => {
    const res = await getCart();
    if (res.ok) {
      const items = (res.data as any)?.items || [];
      const sum = items.reduce((t: number, i: any) => t + Number(i.quantity ?? 1), 0);
      setCount(sum);
    }
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('kts-cart-changed', handler as any);
    return () => window.removeEventListener('kts-cart-changed', handler as any);
  }, []);

  return (
    <button
      className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
      onClick={onOpen}
      aria-label="Giỏ hàng"
    >
      <ShoppingBagIcon className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}



'use client';

import { addToCart } from '@/services/cart';

export default function AddToCartButton({ courseId, isFree }: { courseId: number; isFree: boolean }) {
  const onClick = async () => {
    if (isFree) return;
    await addToCart({ itemType: 1, itemId: Number(courseId) || 0 });
    alert('Đã thêm vào giỏ hàng');
  };
  return (
    <button onClick={onClick} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
      {isFree ? 'Đăng ký học miễn phí' : 'Thêm vào giỏ hàng'}
    </button>
  );
}

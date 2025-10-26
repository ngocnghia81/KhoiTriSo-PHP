import noImage from '@/images/no_image.png';

export function getSafeImage(src?: string | null): any {
  if (!src || typeof src !== 'string') return noImage as any;
  const trimmed = src.trim();
  if (!trimmed || trimmed === '#' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
    return noImage as any;
  }
  return trimmed;
}



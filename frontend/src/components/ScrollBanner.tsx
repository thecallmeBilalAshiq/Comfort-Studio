'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { ScrollBanner as ScrollBannerType } from '@/types';

export default function ScrollBanner() {
  const [banners, setBanners] = useState<ScrollBannerType[]>([]);

  useEffect(() => {
    api.getScrollBanners().then(setBanners).catch(() => {});
  }, []);

  if (banners.length === 0) return null;

  const allText = banners.map(b => b.text).join('  •  ');
  const activeBanner = banners[0];
  const separator = '  •  ';
  const repeatedText = (allText + separator).repeat(8);

  return (
    <div
      className="w-full overflow-hidden py-2.5"
      style={{ backgroundColor: activeBanner?.bgColor || '#c8956c' }}
    >
      <div className="flex whitespace-nowrap animate-marquee" style={{ animationDuration: `${activeBanner?.speed || 20}s` }}>
        <span className="text-sm font-semibold tracking-wide mr-8" style={{ color: activeBanner?.textColor || '#fff' }}>{repeatedText}</span>
        <span className="text-sm font-semibold tracking-wide mr-8" style={{ color: activeBanner?.textColor || '#fff' }}>{repeatedText}</span>
      </div>
    </div>
  );
}

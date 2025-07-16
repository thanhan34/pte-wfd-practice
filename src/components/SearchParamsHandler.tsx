'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchParamsHandlerProps {
  onRemoved: () => void;
}

export default function SearchParamsHandler({ onRemoved }: SearchParamsHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('removed') === 'true') {
      onRemoved();
      // Clear the URL parameter
      router.replace('/');
    }
  }, [searchParams, router, onRemoved]);

  return null; // This component doesn't render anything
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function CardsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/books?tab=Claims'); }, [router]);
  return null;
}

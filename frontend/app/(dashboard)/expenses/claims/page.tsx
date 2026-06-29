'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function ClaimsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/books?tab=Claims'); }, [router]);
  return null;
}

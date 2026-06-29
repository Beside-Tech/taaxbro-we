'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function ExpensesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/books'); }, [router]);
  return null;
}

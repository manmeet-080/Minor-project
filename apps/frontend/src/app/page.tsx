'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    switch (user?.role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'WARDEN':
        router.replace('/admin/dashboard');
        break;
      case 'STAFF':
        router.replace('/staff/dashboard');
        break;
      case 'STUDENT':
        router.replace('/student/dashboard');
        break;
      default:
        router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-pulse font-display text-2xl font-bold text-primary">Campusphere</div>
    </div>
  );
}

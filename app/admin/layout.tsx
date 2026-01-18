'use client';

import { ReactNode } from 'react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}
import AdminLayout from '@/components/admin/AdminLayout';
import { Toaster } from 'react-hot-toast';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-right" />
      <AdminLayout>{children}</AdminLayout>
    </>
  );
}

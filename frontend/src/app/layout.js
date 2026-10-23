import './globals.css';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';

export const metadata = {
  title: 'StockPro - Modern Inventory Management & POS',
  description: 'Scalable Inventory Management System with Piece & Box Selling options',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ToastProvider>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

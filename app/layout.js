import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from '@/app/context/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
import "./globals.css";
import { ReactNode } from "react";
import Link from "next/link";
import { AuthProvider } from "../lib/auth";
import NavBar from "../components/NavBar";

export const metadata = {
  title: "Oren ESG Questionnaire",
  description: "ESG data capture & summary (demo)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="container">
            <NavBar />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

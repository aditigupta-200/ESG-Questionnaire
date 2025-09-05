"use client";
import Link from "next/link";
import { useAuth } from "../lib/auth";

export default function NavBar() {
  const { token, user, logout } = useAuth();
  return (
    <nav className="nav">
      <Link href="/" className="text-lg font-semibold">
        Oren ESG
      </Link>
      <div className="flex items-center gap-3">
        {token ? (
          <>
            <Link href="/questionnaire" className="btn">
              Questionnaire
            </Link>
            <Link href="/summary" className="btn">
              Summary
            </Link>
            <span className="text-sm text-slate-500">Hi, {user?.name}</span>
            <button className="btn" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="btn">
              Login
            </Link>
            <Link href="/auth/register" className="btn btn-primary">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

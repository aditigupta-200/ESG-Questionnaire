"use client";
import { useState } from "react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
};

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const res = await api<{ token: string; user: User }>(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(form),
        }
      );
      login(res.token, res.user);
      router.push("/questionnaire");
    } catch (e) {
      const error = e as Error;
      setErr(error.message);
    }
  };

  return (
    <main className="card max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">Create account</h1>
      <form className="mt-4 space-y-3" onSubmit={submit}>
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            title="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            title="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            title="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="btn btn-primary w-full">Register</button>
      </form>
    </main>
  );
}

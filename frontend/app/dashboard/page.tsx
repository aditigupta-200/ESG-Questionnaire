"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

type Response = {
  id: number;
  financialYear: string;
  carbonIntensity?: number;
  renewableElectricityRatio?: number;
  diversityRatio?: number;
  communitySpendRatio?: number;
};

export default function Dashboard() {
  const { token } = useAuth();
  const [responses, setResponses] = useState<Response[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api<Response[]>("/api/responses", {}, token)
      .then(setResponses)
      .catch((e: Error) => setErr(e.message));
  }, [token]);

  if (!token) return <main className="card">Please login.</main>;

  return (
    <main className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold">Your saved responses</h1>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Financial Year</th>
                <th className="py-2 pr-4">Carbon Intensity</th>
                <th className="py-2 pr-4">Renewables %</th>
                <th className="py-2 pr-4">Diversity %</th>
                <th className="py-2 pr-4">Community Spend %</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{r.financialYear}</td>
                  <td className="py-2 pr-4">
                    {(r.carbonIntensity ?? 0).toFixed(6)}
                  </td>
                  <td className="py-2 pr-4">
                    {(r.renewableElectricityRatio ?? 0).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4">
                    {(r.diversityRatio ?? 0).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4">
                    {(r.communitySpendRatio ?? 0).toFixed(4)}
                  </td>
                </tr>
              ))}
              {responses.length === 0 && (
                <tr>
                  <td className="py-4 text-slate-500" colSpan={5}>
                    No responses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

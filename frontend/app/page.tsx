import Link from "next/link";

export default function Home() {
  return (
    <main className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold">Welcome to Oren ESG Demo</h1>
        <p className="text-slate-600 mt-2">
          Capture ESG metrics across financial years, see live KPIs, and export
          your summary.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/auth/register" className="btn btn-primary">
            Register
          </Link>
          <Link href="/auth/login" className="btn">
            Login
          </Link>
        </div>
      </section>
      <section className="card">
        <h2 className="text-xl font-semibold">What’s inside</h2>
        <ul className="list-disc pl-6 mt-2 text-slate-700">
          <li>Questionnaire with auto-calculated metrics (live)</li>
          <li>Summary dashboard with chart</li>
          <li>PDF & Excel export</li>
        </ul>
      </section>
    </main>
  );
}

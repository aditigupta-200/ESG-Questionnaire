"use client";
import QuestionnaireForm from "../../components/QuestionnaireForm";
import { useAuth } from "../../lib/auth";

export default function QuestionnairePage() {
  const { token } = useAuth();
  if (!token) return <main className="card">Please login.</main>;
  return (
    <main className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold">ESG Questionnaire</h1>
        <p className="text-slate-600 mt-2">
          Fill inputs for a financial year. Metrics update in real-time.
        </p>
        <div className="mt-6">
          <QuestionnaireForm />
        </div>
      </section>
    </main>
  );
}

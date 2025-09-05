"use client";
import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import YearSelector from "./YearSelector";

type Inputs = {
  financialYear: string;
  totalElectricityConsumption?: number | null;
  renewableElectricityConsumption?: number | null;
  totalFuelConsumption?: number | null;
  carbonEmissions?: number | null;
  totalEmployees?: number | null;
  femaleEmployees?: number | null;
  averageTrainingHoursPerEmployee?: number | null;
  communityInvestmentSpend?: number | null;
  percentIndependentBoardMembers?: number | null;
  dataPrivacyPolicy?: boolean | null;
  totalRevenue?: number | null;
};

function n(v: unknown) {
  const num = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(num) ? num : 0;
}
function safeDiv(a: number, b: number) {
  return b === 0 ? 0 : a / b;
}

export default function QuestionnaireForm() {
  const { token } = useAuth();
  const [form, setForm] = useState<Inputs>({ financialYear: "FY2024-25" });

  const metrics = useMemo(() => {
    const carbonIntensity = safeDiv(
      n(form.carbonEmissions),
      n(form.totalRevenue)
    );
    const renewableElectricityRatio =
      100 *
      safeDiv(
        n(form.renewableElectricityConsumption),
        n(form.totalElectricityConsumption)
      );
    const diversityRatio =
      100 * safeDiv(n(form.femaleEmployees), n(form.totalEmployees));
    const communitySpendRatio =
      100 * safeDiv(n(form.communityInvestmentSpend), n(form.totalRevenue));
    return {
      carbonIntensity,
      renewableElectricityRatio,
      diversityRatio,
      communitySpendRatio,
    };
  }, [form]);

  const update = (key: keyof Inputs, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!token) {
      alert("Please login");
      return;
    }
    await api(
      "/api/responses",
      { method: "POST", body: JSON.stringify(form) },
      token
    );
    alert("Saved!");
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <YearSelector
          value={form.financialYear}
          onChange={(v) => update("financialYear", v)}
        />

        <div>
          <label className="label">Total electricity consumption (kWh)</label>
          <input
            className="input"
            title="totalElectricityConsumption"
            type="number"
            onChange={(e) =>
              update("totalElectricityConsumption", Number(e.target.value))
            }
          />
        </div>

        <div>
          <label className="label">
            Renewable electricity consumption (kWh)
          </label>
          <input
            className="input"
            title="renewableElectricityConsumption"
            type="number"
            onChange={(e) =>
              update("renewableElectricityConsumption", Number(e.target.value))
            }
          />
        </div>

        <div>
          <label className="label">Total fuel consumption (liters)</label>
          <input
            className="input"
            title="totalFuelConsumption"
            type="number"
            onChange={(e) =>
              update("totalFuelConsumption", Number(e.target.value))
            }
          />
        </div>

        <div>
          <label className="label">Carbon emissions (T CO₂e)</label>
          <input
            className="input"
            title="carbonEmissions"
            type="number"
            onChange={(e) => update("carbonEmissions", Number(e.target.value))}
          />
        </div>

        <div>
          <label className="label">Total number of employees</label>
          <input
            className="input"
            title="totalEmployees"
            type="number"
            onChange={(e) => update("totalEmployees", Number(e.target.value))}
          />
        </div>

        <div>
          <label className="label">Number of female employees</label>
          <input
            className="input"
            title="femaleEmployees"
            type="number"
            onChange={(e) => update("femaleEmployees", Number(e.target.value))}
          />
        </div>

        <div>
          <label className="label">
            Avg training hours / employee (per year)
          </label>
          <input
            className="input"
            title="averageTrainingHoursPerEmployee"
            type="number"
            onChange={(e) =>
              update("averageTrainingHoursPerEmployee", Number(e.target.value))
            }
          />
        </div>

        <div>
          <label className="label">Community investment spend (INR)</label>
          <input
            className="input"
            title="communityInvestmentSpend"
            type="number"
            onChange={(e) =>
              update("communityInvestmentSpend", Number(e.target.value))
            }
          />
        </div>

        <div>
          <label className="label">% of independent board members</label>
          <input
            className="input"
            title="percentIndependentBoardMembers"
            type="number"
            onChange={(e) =>
              update("percentIndependentBoardMembers", Number(e.target.value))
            }
          />
        </div>

        <div>
          <label className="label">Data privacy policy?</label>
          <select
            className="input"
            title="dataPrivacyPolicy"
            onChange={(e) =>
              update("dataPrivacyPolicy", e.target.value === "Yes")
            }
          >
            <option>--</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>

        <div>
          <label className="label">Total Revenue (INR)</label>
          <input
            className="input"
            title="totalRevenue"
            type="number"
            onChange={(e) => update("totalRevenue", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-slate-500">Carbon Intensity</div>
          <div className="text-xl font-semibold">
            {metrics.carbonIntensity.toFixed(6)} T CO₂e / INR
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">
            Renewable Electricity Ratio
          </div>
          <div className="text-xl font-semibold">
            {metrics.renewableElectricityRatio.toFixed(2)}%
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Diversity Ratio</div>
          <div className="text-xl font-semibold">
            {metrics.diversityRatio.toFixed(2)}%
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Community Spend Ratio</div>
          <div className="text-xl font-semibold">
            {metrics.communitySpendRatio.toFixed(4)}%
          </div>
        </div>
      </div>

      <button onClick={save} className="btn btn-primary">
        Save for {form.financialYear}
      </button>
    </div>
  );
}

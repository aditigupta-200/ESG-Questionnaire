"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import ExcelJS from "exceljs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type Response = {
  id: number;
  financialYear: string;
  carbonIntensity?: number;
  renewableElectricityRatio?: number;
  diversityRatio?: number;
  communitySpendRatio?: number;
  totalRevenue?: number;
};

export default function SummaryPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Response[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    api<Response[]>("/api/responses", {}, token)
      .then(setRows)
      .catch((e: Error) => setErr(e.message));
  }, [token]);

  const chartData = useMemo(() => {
    const labels = rows.map((r) => r.financialYear);
    return {
      labels,
      datasets: [
        {
          label: "Renewables %",
          data: rows.map((r) => r.renewableElectricityRatio ?? 0),
        },
        { label: "Diversity %", data: rows.map((r) => r.diversityRatio ?? 0) },
        {
          label: "Community Spend %",
          data: rows.map((r) => r.communitySpendRatio ?? 0),
        },
      ],
    };
  }, [rows]);

  const exportPDF = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 40;
    const ratio = imgWidth / canvas.width;
    const imgHeight = canvas.height * ratio;
    pdf.text("ESG Questionnaire Summary", 20, 30);
    pdf.addImage(imgData, "PNG", 20, 50, imgWidth, imgHeight);
    pdf.save("esg-summary.pdf");
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Responses");
    worksheet.columns = [
      { header: "FY", key: "financialYear", width: 15 },
      { header: "Carbon Intensity", key: "carbonIntensity", width: 20 },
      { header: "Renewables %", key: "renewableElectricityRatio", width: 18 },
      { header: "Diversity %", key: "diversityRatio", width: 15 },
      { header: "Community Spend %", key: "communitySpendRatio", width: 22 },
      { header: "Revenue", key: "totalRevenue", width: 15 },
    ];
    rows.forEach((row) => {
      worksheet.addRow({
        financialYear: row.financialYear,
        carbonIntensity: row.carbonIntensity ?? 0,
        renewableElectricityRatio: row.renewableElectricityRatio ?? 0,
        diversityRatio: row.diversityRatio ?? 0,
        communitySpendRatio: row.communitySpendRatio ?? 0,
        totalRevenue: row.totalRevenue ?? 0,
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "esg-responses.xlsx";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  };

  if (!token) return <main className="card">Please login.</main>;

  return (
    <main className="space-y-6">
      <section className="card" ref={ref}>
        <h1 className="text-2xl font-bold">Summary</h1>
        {err && <p className="text-red-600 text-sm">{err}</p>}

        <div className="mt-4">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: { display: true, text: "Key Ratios by Financial Year" },
              },
            }}
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">FY</th>
                <th className="py-2 pr-4">Carbon Intensity</th>
                <th className="py-2 pr-4">Renewables %</th>
                <th className="py-2 pr-4">Diversity %</th>
                <th className="py-2 pr-4">Community Spend %</th>
                <th className="py-2 pr-4">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
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
                  <td className="py-2 pr-4">
                    {(r.totalRevenue ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="py-4 text-slate-500" colSpan={6}>
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex gap-3">
        <button className="btn" onClick={exportExcel}>
          Download Excel
        </button>
        <button className="btn btn-primary" onClick={exportPDF}>
          Download PDF
        </button>
      </div>
    </main>
  );
}

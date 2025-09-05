"use client";
type Props = { value: string; onChange: (v: string) => void };

export default function YearSelector({ value, onChange }: Props) {
  const years = [
    "FY2019-20",
    "FY2020-21",
    "FY2021-22",
    "FY2022-23",
    "FY2023-24",
    "FY2024-25",
  ];
  return (
    <div>
      <label className="label">Financial Year</label>
      <select
              className="input"
              title="financialYear"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

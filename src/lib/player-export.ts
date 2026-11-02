import { formatTk } from "./format";

export type ExportPlayerRow = {
  name: string;
  rating: number;
  jerseySize: string | null;
  totalPaid: number;
  charged: number;
  credit: number;
  sessions: number;
  isActive: boolean;
};

export function playersToCsv(rows: ExportPlayerRow[]): string {
  const header = [
    "Name",
    "Rating",
    "Jersey Size",
    "Total Paid",
    "Charged",
    "Current Credit",
    "Sessions",
    "Status",
  ];
  const lines = rows.map((r) =>
    [
      csvEscape(r.name),
      r.rating.toFixed(1),
      r.jerseySize || "",
      String(r.totalPaid),
      String(r.charged),
      String(r.credit),
      String(r.sessions),
      r.isActive ? "active" : "inactive",
    ].join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPlayersPdf(rows: ExportPlayerRow[]) {
  const tableRows = rows
    .map(
      (r) => `<tr>
      <td>${escapeHtml(r.name)}</td>
      <td>${r.rating.toFixed(1)}</td>
      <td>${escapeHtml(r.jerseySize || "—")}</td>
      <td>${formatTk(r.totalPaid)}</td>
      <td>${formatTk(r.charged)}</td>
      <td>${formatTk(r.credit)}</td>
      <td>${r.sessions}</td>
      <td>${r.isActive ? "active" : "inactive"}</td>
    </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>futsalBuddies — player details</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    p { margin: 0 0 16px; color: #555; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #f3f3f3; }
  </style>
</head>
<body>
  <h1>futsalBuddies — player details</h1>
  <p>Generated ${new Date().toLocaleString()} · use Print → Save as PDF</p>
  <table>
    <thead>
      <tr>
        <th>Name</th><th>Rating</th><th>Jersey</th><th>Total paid</th>
        <th>Charged</th><th>Current credit</th><th>Sessions</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <script>window.onload = () => window.print()</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

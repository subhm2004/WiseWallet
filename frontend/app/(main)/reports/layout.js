"use client";

import ReportsPage from "./page";

export default function Layout() {
  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold tracking-tight gradient-title">
          Reports
        </h1>
      </div>
      <ReportsPage />
    </div>
  );
}

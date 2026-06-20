"use client";

import SettingsPage from "./page";

export default function Layout() {
  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold tracking-tight gradient-title">
          Settings
        </h1>
      </div>
      <SettingsPage />
    </div>
  );
}

"use client";

export default function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="store-app-shell">
      <main className="store-main">{children}</main>
    </div>
  );
}

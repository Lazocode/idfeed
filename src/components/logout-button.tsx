"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton({
  redirectTo = "/",
  children,
  className = "btn-ghost",
  style,
}: {
  redirectTo?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
} = {}) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: redirectTo })}
      className={className}
      style={style || { fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}
    >
      {children || "Sair"}
    </button>
  );
}

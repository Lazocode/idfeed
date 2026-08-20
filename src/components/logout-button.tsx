"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="btn-ghost"
      style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}
    >
      Sair
    </button>
  );
}

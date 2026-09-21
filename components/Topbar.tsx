"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Me } from "@/lib/api";
import ShieldIcon from "./ShieldIcon";

export default function Topbar({ me, children }: { me: Me | null; children?: ReactNode }) {
  const router = useRouter();
  const initial = (me?.email ?? "?").charAt(0).toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="topbar">
      <Link href="/dashboard" className="brand">
        <span className="brand-mark">
          <ShieldIcon />
        </span>
        Women Safety SOS
      </Link>
      <div className="row">
        {children}
        <span className="meta">{me?.email}</span>
        <div className="avatar">{initial}</div>
        <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}

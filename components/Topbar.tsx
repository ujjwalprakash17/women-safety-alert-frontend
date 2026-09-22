"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { NAV_ITEMS } from "@/lib/navItems";
import type { Me } from "@/lib/api";
import Avatar from "./Avatar";
import ShieldIcon from "./ShieldIcon";

export default function Topbar({ me }: { me: Me | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      <nav className="topbar-links">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`topbar-link ${pathname === item.href ? "active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="account-menu" ref={menuRef}>
        <button
          type="button"
          className="account-trigger"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Account menu"
        >
          <Avatar name={me?.display_name ?? me?.email} url={me?.avatar_url} />
        </button>

        {menuOpen && (
          <div className="account-dropdown stack stack-tight">
            <div className="account-dropdown-email">
              {me?.display_name && <strong>{me.display_name}</strong>}
              <p className="meta">{me?.email}</p>
            </div>
            <Link
              href="/settings"
              className="btn btn-ghost"
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
            <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

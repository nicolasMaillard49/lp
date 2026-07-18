"use client";

import { useState } from "react";

const BG = "#f7f9fc";
const PRIMARY = "#071a33";
const PRIMARY_LIGHT = "#eaf2ff";
const INK = "#071a33";
const MUTED = "#607089";
const DIVIDER = "#d8e3f2";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Erreur");
        return;
      }
      window.location.assign("/admin");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-[100svh] place-items-center px-5 font-helvetica [&_h1]:font-helvetica [&_h2]:font-helvetica" style={{ background: BG }}>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg border p-8"
        style={{ background: "#fff", borderColor: DIVIDER }}
      >
        <div className="mb-5 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-nmf-96.png" alt="NMF Agence" className="size-9 rounded-lg border" style={{ borderColor: DIVIDER }} />
          <div>
            <h1 className="text-lg font-black leading-none tracking-tight" style={{ color: INK, fontFamily: "inherit" }}>Diagnostic</h1>
            <p className="mt-0.5 text-xs font-semibold" style={{ color: MUTED }}>Dashboard NMF Agence</p>
          </div>
        </div>
        <p className="mb-4 text-sm font-semibold" style={{ color: MUTED }}>Accès protégé — mot de passe requis.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          className="mb-3 w-full rounded-lg border px-4 py-3 text-sm font-semibold outline-none focus:border-[#075ad8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075ad8]"
          style={{ borderColor: DIVIDER, color: INK, background: PRIMARY_LIGHT + "40" }}
        />
        {error && <p className="mb-3 text-sm font-medium" style={{ color: "#c62828" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-3 text-sm font-black text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: PRIMARY }}
        >
          {loading ? "…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Roboto } from "next/font/google";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });

// Palette Berry (cohérente avec le dashboard).
const BG = "#eef2f6";
const PRIMARY = "#5e35b1";
const PRIMARY_LIGHT = "#ede7f6";
const INK = "#121926";
const MUTED = "#697586";
const DIVIDER = "#e3e8ef";

export default function AdminLogin() {
  const router = useRouter();
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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Erreur");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`${roboto.className} grid min-h-[100svh] place-items-center px-5`} style={{ background: BG }}>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border p-8"
        style={{ background: "#fff", borderColor: DIVIDER }}
      >
        <div className="mb-5 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-nmf.png" alt="NMF Agence" className="size-9 rounded-md" />
          <div>
            <h1 className="text-lg font-bold leading-none" style={{ color: INK, fontFamily: "inherit" }}>Diagnostic</h1>
            <p className="mt-0.5 text-xs" style={{ color: MUTED }}>Dashboard NMF Agence</p>
          </div>
        </div>
        <p className="mb-4 text-sm" style={{ color: MUTED }}>Accès protégé — mot de passe requis.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          className="mb-3 w-full rounded-lg border px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(94,53,177,0.15)]"
          style={{ borderColor: DIVIDER, color: INK, background: PRIMARY_LIGHT + "40" }}
        />
        {error && <p className="mb-3 text-sm font-medium" style={{ color: "#c62828" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: PRIMARY }}
        >
          {loading ? "…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}

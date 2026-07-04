"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <main className="grid min-h-[100svh] place-items-center px-5">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8"
      >
        <h1 className="mb-1 font-display text-2xl text-ink">Dashboard</h1>
        <p className="mb-6 text-sm text-muted">Accès protégé — mot de passe requis.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          className="mb-3 w-full rounded-lg border border-border bg-bg px-4 py-3 text-ink outline-none focus:border-electric"
        />
        {error && <p className="mb-3 text-sm font-medium text-accent">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "…" : "Entrer"}
        </button>
      </form>
    </main>
  );
}

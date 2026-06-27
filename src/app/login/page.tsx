"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRole, getToken, login, saveToken } from "@/lib/auth";
import { fetchAddresses } from "@/lib/addresses";
import { validatePassword, validateUsername } from "@/lib/validation";
import CatFaceSVG from "../components/landing/CatFaceSVG";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit() {
    setError(null);

    const errors = {
      username: validateUsername(username) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    setFieldErrors(errors);
    if (errors.username || errors.password) return;

    setLoading(true);
    try {
      const { token } = await login(username, password);
      saveToken(token);
      const role = getRole();
      if (role === "ROLE_DELIVERY") {
        router.push("/driver");
      } else if (role === "ROLE_SUPER") {
        router.push("/admin");
      } else if (role === "ROLE_RESTAURANT") {
        router.push("/restaurant");
      } else {
        const addresses = await fetchAddresses(getToken()!).catch(() => []);
        router.push(addresses.length === 0 ? "/setup-address" : "/restaurants");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-suido-0)] flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-10">
        <div
          className="w-11 h-11 bg-[var(--color-suido-1)] rounded-xl
                     border border-[var(--color-suido-3)]/30
                     flex items-center justify-center overflow-hidden flex-shrink-0"
        >
          <CatFaceSVG className="w-8 h-8" />
        </div>
        <div>
          <div
            className="text-[1.35rem] font-extrabold tracking-tight text-white leading-none"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Supi<span className="text-[var(--color-suido-accent)]">|</span>do
          </div>
          <div
            className="text-[0.6rem] tracking-[0.2em] uppercase text-[var(--color-suido-4)] mt-1"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Delivery Veloz
          </div>
        </div>
      </Link>

      {/* Card */}
      <div
        className="w-full max-w-md bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                   rounded-2xl p-8"
        style={{ animation: "var(--animate-fade-slide)" }}
      >
        <h1
          className="text-2xl font-extrabold text-white mb-1"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Iniciar sesión
        </h1>
        <p
          className="text-sm text-[var(--color-suido-4)] mb-7"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          Bienvenido de vuelta
        </p>

        <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-xs font-medium tracking-wide text-[var(--color-suido-4)] uppercase"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              Usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="tu_usuario"
              className="bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/30
                         text-white placeholder-[var(--color-suido-3)] rounded-xl
                         px-4 py-3 text-sm
                         focus:outline-none focus:border-[var(--color-suido-accent)]
                         transition-colors duration-200"
              style={{ fontFamily: "var(--font-dm)" }}
            />
            {fieldErrors.username && (
              <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium tracking-wide text-[var(--color-suido-4)] uppercase"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/30
                         text-white placeholder-[var(--color-suido-3)] rounded-xl
                         px-4 py-3 text-sm
                         focus:outline-none focus:border-[var(--color-suido-accent)]
                         transition-colors duration-200"
              style={{ fontFamily: "var(--font-dm)" }}
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          {error && (
            <p
              className="text-sm text-red-400 bg-red-400/10 border border-red-400/20
                         rounded-xl px-4 py-2.5"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-xl text-sm font-semibold text-white
                       bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200 flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Ingresando…
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm text-[var(--color-suido-4)]"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          ¿No tenés cuenta?{" "}
          <Link
            href="/register"
            className="text-[var(--color-suido-accent)] hover:underline font-medium"
          >
            Registrate
          </Link>
        </p>
      </div>
    </main>
  );
}

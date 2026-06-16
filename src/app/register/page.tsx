"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth";
import { validateEmail, validatePassword, validatePhone, validateUsername } from "@/lib/validation";
import CatFaceSVG from "../components/landing/CatFaceSVG";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    phone: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<typeof form>>({});
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors: Partial<typeof form> = {
      username: validateUsername(form.username) ?? undefined,
      email: validateEmail(form.email) ?? undefined,
      phone: validatePhone(form.phone) ?? undefined,
      password: validatePassword(form.password) ?? undefined,
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setLoading(true);
    try {
      await register(form.username, form.password, form.email, form.phone);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar.");
    } finally {
      setLoading(false);
    }
  }

  const fields: {
    name: keyof typeof form;
    label: string;
    type: string;
    placeholder: string;
    autoComplete: string;
  }[] = [
    { name: "username",  label: "Usuario",            type: "text",     placeholder: "tu_usuario",       autoComplete: "username" },
    { name: "email",     label: "Correo electrónico", type: "email",    placeholder: "tu@email.com",     autoComplete: "email" },
    { name: "phone",     label: "Teléfono",           type: "tel",      placeholder: "+54 9 11 1234-5678", autoComplete: "tel" },
    { name: "password",  label: "Contraseña",         type: "password", placeholder: "••••••••",         autoComplete: "new-password" },
  ];

  return (
    <main className="min-h-screen bg-[var(--color-suido-0)] flex flex-col items-center justify-center px-4 py-12">

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
          Crear cuenta
        </h1>
        <p
          className="text-sm text-[var(--color-suido-4)] mb-7"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          Unite a Supido hoy
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {fields.map(({ name, label, type, placeholder, autoComplete }) => (
            <div key={name} className="flex flex-col gap-1.5">
              <label
                htmlFor={name}
                className="text-xs font-medium tracking-wide text-[var(--color-suido-4)] uppercase"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                {label}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                autoComplete={autoComplete}
                required
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/30
                           text-white placeholder-[var(--color-suido-3)] rounded-xl
                           px-4 py-3 text-sm
                           focus:outline-none focus:border-[var(--color-suido-accent)]
                           transition-colors duration-200"
                style={{ fontFamily: "var(--font-dm)" }}
              />
              {fieldErrors[name] && (
                <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>
                  {fieldErrors[name]}
                </p>
              )}
            </div>
          ))}

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
                Registrando…
              </>
            ) : (
              "Crear cuenta"
            )}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm text-[var(--color-suido-4)]"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="text-[var(--color-suido-accent)] hover:underline font-medium"
          >
            Ingresar
          </Link>
        </p>
      </div>
    </main>
  );
}

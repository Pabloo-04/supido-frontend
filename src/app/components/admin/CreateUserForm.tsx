"use client";

import { useState } from "react";
import { createUser, type User } from "@/lib/admin";

interface Props {
  onCreated: (user: User) => void;
  onCancel: () => void;
}

const ROLES = [
  { value: "ROLE_USER",        label: "Usuario" },
  { value: "ROLE_DELIVERY",    label: "Repartidor" },
  { value: "ROLE_RESTAURANT",  label: "Restaurante" },
  { value: "ROLE_SUPER",       label: "Admin" },
];

const INITIAL = { username: "", password: "", email: "", phone: "", role: "ROLE_USER" };

export default function CreateUserForm({ onCreated, onCancel }: Props) {
  const [form, setForm]     = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function set(field: keyof typeof INITIAL, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim() || !form.email.trim()) {
      setError("Usuario, contraseña y correo son obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await createUser({
        username: form.username.trim(),
        password: form.password.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
      });
      setForm(INITIAL);
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el usuario.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/20
                 rounded-2xl p-5 flex flex-col gap-4"
    >
      <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-syne)" }}>
        Nuevo usuario
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Usuario *"     id="username" value={form.username} onChange={(v) => set("username", v)} placeholder="john_doe" />
        <Field label="Contraseña *"  id="password" value={form.password} onChange={(v) => set("password", v)} placeholder="••••••••" type="password" />
        <Field label="Correo *"      id="email"    value={form.email}    onChange={(v) => set("email", v)}    placeholder="correo@ejemplo.com" />
        <Field label="Teléfono"      id="phone"    value={form.phone}    onChange={(v) => set("phone", v)}    placeholder="+34600000000" />
      </div>

      {/* Role selector */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="u-role"
          className="text-[0.7rem] font-medium tracking-wide uppercase text-[var(--color-suido-4)]"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          Rol *
        </label>
        <select
          id="u-role"
          value={form.role}
          onChange={(e) => set("role", e.target.value)}
          className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/30
                     text-white rounded-xl px-3 py-2.5 text-sm
                     focus:outline-none focus:border-[var(--color-suido-accent)]
                     transition-colors duration-200"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          {ROLES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="text-sm font-semibold text-white px-4 py-2 rounded-xl
                     bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200 flex items-center gap-2"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          {loading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
          {loading ? "Creando…" : "Crear usuario"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-[var(--color-suido-4)] hover:text-white
                     px-4 py-2 rounded-xl border border-[var(--color-suido-3)]/30
                     transition-colors duration-200"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Field({
  label, id, value, onChange, placeholder, type = "text",
}: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={`u-${id}`}
        className="text-[0.7rem] font-medium tracking-wide uppercase text-[var(--color-suido-4)]"
        style={{ fontFamily: "var(--font-dm)" }}
      >
        {label}
      </label>
      <input
        id={`u-${id}`}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/30
                   text-white placeholder-[var(--color-suido-3)] rounded-xl
                   px-3 py-2.5 text-sm
                   focus:outline-none focus:border-[var(--color-suido-accent)]
                   transition-colors duration-200"
        style={{ fontFamily: "var(--font-dm)" }}
      />
    </div>
  );
}

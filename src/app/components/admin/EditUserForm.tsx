"use client";

import { useState } from "react";
import { updateUser, changeUserRole, type User } from "@/lib/admin";

interface Props { user: User; onUpdated: (user: User) => void; onCancel: () => void }

const ROLES = [
  { value: "ROLE_USER",       label: "Usuario" },
  { value: "ROLE_DELIVERY",   label: "Repartidor" },
  { value: "ROLE_RESTAURANT", label: "Restaurante" },
  { value: "ROLE_SUPER",      label: "Admin" },
];

export default function EditUserForm({ user, onUpdated, onCancel }: Props) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail]       = useState(user.email);
  const [phone, setPhone]       = useState(user.phone ?? "");
  const [role, setRole]         = useState(user.role ?? "ROLE_USER");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username.trim() || !email.trim()) { setError("Usuario y correo no pueden estar vacíos."); return; }
    const patch: Record<string, string> = {};
    if (username.trim() !== user.username)      patch.username = username.trim();
    if (email.trim()    !== user.email)         patch.email    = email.trim();
    if (phone.trim()    !== (user.phone ?? "")) patch.phone    = phone.trim();
    if (role            !== user.role)          patch.role     = role;
    if (password.trim())                        patch.password = password.trim();
    if (Object.keys(patch).length === 0) { onCancel(); return; }
    setLoading(true); setError(null);
    try {
      const roleOnly = Object.keys(patch).length === 1 && patch.role !== undefined;
      const updated = roleOnly
        ? await changeUserRole(user.id, patch.role)
        : await updateUser(user.id, patch);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el usuario.");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--color-suido-2)] border border-[var(--color-suido-accent)]/30 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-syne)" }}>Editar usuario</h3>
        <span className="text-[0.62rem] text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>#{user.id} · {user.username}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Usuario"      id="eu-user" value={username} onChange={setUsername} placeholder="username" />
        <Field label="Correo"       id="eu-mail" value={email}    onChange={setEmail}    placeholder="correo@ejemplo.com" />
        <Field label="Teléfono"     id="eu-tel"  value={phone}    onChange={setPhone}    placeholder="+34600000000" />
        <Field label="Nueva contraseña (opcional)" id="eu-pass" value={password} onChange={setPassword} placeholder="Dejar vacío para no cambiar" type="password" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="eu-role" className="text-[0.7rem] font-medium tracking-wide uppercase text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>Rol</label>
        <select id="eu-role" value={role} onChange={(e) => setRole(e.target.value)}
          className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/30 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-suido-accent)] transition-colors"
          style={{ fontFamily: "var(--font-dm)" }}>
          {ROLES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      {error && <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="text-sm font-semibold text-white px-4 py-2 rounded-xl bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          style={{ fontFamily: "var(--font-dm)" }}>
          {loading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
          {loading ? "Guardando…" : "Guardar cambios"}
        </button>
        <button type="button" onClick={onCancel}
          className="text-sm font-medium text-[var(--color-suido-4)] hover:text-white px-4 py-2 rounded-xl border border-[var(--color-suido-3)]/30 transition-colors"
          style={{ fontFamily: "var(--font-dm)" }}>Cancelar</button>
      </div>
    </form>
  );
}

function Field({ label, id, value, onChange, placeholder, type = "text" }:
  { label: string; id: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[0.7rem] font-medium tracking-wide uppercase text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/30 text-white placeholder-[var(--color-suido-3)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-suido-accent)] transition-colors"
        style={{ fontFamily: "var(--font-dm)" }} />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAllUsers, type User } from "@/lib/admin";

export default function UsersSection() {
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await fetchAllUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-extrabold text-white"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Usuarios
        </h2>
        <button
          type="button"
          onClick={loadUsers}
          className="text-xs font-medium text-[var(--color-suido-4)] hover:text-white
                     px-3 py-1.5 rounded-full border border-[var(--color-suido-3)]/30
                     transition-colors duration-200"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5" style={{ fontFamily: "var(--font-dm)" }}>
          {error}
        </p>
      ) : users.length === 0 ? (
        <p className="text-center py-16 text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>
          No hay usuarios registrados.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-suido-3)]/20">
          {/* Table header */}
          <div
            className="grid grid-cols-[1fr_2fr_2fr_auto] gap-4 px-5 py-3
                       bg-[var(--color-suido-2)] border-b border-[var(--color-suido-3)]/20"
          >
            {["ID", "Usuario", "Correo", "Rol"].map((h) => (
              <span
                key={h}
                className="text-[0.65rem] font-medium tracking-widest uppercase text-[var(--color-suido-3)]"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="flex flex-col divide-y divide-[var(--color-suido-3)]/10">
            {users.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-[1fr_2fr_2fr_auto] gap-4 px-5 py-3.5
                           bg-[var(--color-suido-1)] hover:bg-[var(--color-suido-2)]/60
                           transition-colors duration-150"
              >
                <span className="text-[var(--color-suido-4)] text-sm" style={{ fontFamily: "var(--font-dm)" }}>
                  #{u.id}
                </span>
                <span className="text-white text-sm font-medium truncate" style={{ fontFamily: "var(--font-dm)" }}>
                  {u.username}
                </span>
                <span className="text-[var(--color-suido-4)] text-sm truncate" style={{ fontFamily: "var(--font-dm)" }}>
                  {u.email}
                </span>
                <span
                  className="text-[0.65rem] tracking-wide uppercase self-center
                             bg-[var(--color-suido-cat)]/15 text-[var(--color-suido-accent)]
                             border border-[var(--color-suido-cat)]/25 rounded-full px-2.5 py-0.5 whitespace-nowrap"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  {u.role ?? "USER"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

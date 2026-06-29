"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAllUsers, createDeliveryPerson, type User, type DeliveryPerson } from "@/lib/admin";

interface Props { onCreated: (driver: DeliveryPerson) => void; onCancel: () => void }

export default function CreateDriverForm({ onCreated, onCancel }: Props) {
  const [users, setUsers]       = useState<User[]>([]);
  const [query, setQuery]       = useState("");
  const [loadingU, setLoadingU] = useState(true);
  const [page, setPage]         = useState(0);
  const [totalPages, setTP]     = useState(1);
  const [selected, setSelected] = useState<User | null>(null);
  const [submitting, setSubmit] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const loadUsers = useCallback(async (p: number) => {
    setLoadingU(true); setError(null);
    try {
      const result = await fetchAllUsers(p, 5, "ROLE_USER");
      setUsers(result.users); setTP(result.totalPages);
    } catch (err) { setError(err instanceof Error ? err.message : "Error al cargar usuarios."); }
    finally { setLoadingU(false); }
  }, []);

  useEffect(() => { loadUsers(page); }, [loadUsers, page]);

  const filtered = query.trim()
    ? users.filter((u) => u.username.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
    : users;

  async function handleCreate() {
    if (!selected) return;
    setSubmit(true); setError(null);
    try { onCreated(await createDeliveryPerson(selected.id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Error al crear el perfil."); setSubmit(false); }
  }

  return (
    <div className="bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/20 rounded-2xl p-5 flex flex-col gap-4">
      <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-syne)" }}>Nuevo repartidor</h3>

      {!selected ? (
        <>
          <p className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>Paso 1 — Seleccioná un usuario existente.</p>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrar por usuario o correo…"
            className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/30 text-white placeholder-[var(--color-suido-3)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-suido-accent)] transition-colors"
            style={{ fontFamily: "var(--font-dm)" }} />
          {loadingU ? (
            <div className="flex justify-center py-6"><div className="w-6 h-6 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" /></div>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--color-suido-3)]/10 rounded-xl overflow-hidden border border-[var(--color-suido-3)]/15">
              {filtered.map((u) => (
                <button key={u.id} type="button" onClick={() => setSelected(u)}
                  className="flex items-center justify-between px-4 py-3 bg-[var(--color-suido-1)] hover:bg-[var(--color-suido-accent)]/10 transition-colors text-left">
                  <div>
                    <p className="text-white text-sm font-semibold" style={{ fontFamily: "var(--font-syne)" }}>{u.username}</p>
                    <p className="text-[0.72rem] text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                  </div>
                  <span className="text-[0.65rem] text-[var(--color-suido-accent)] font-semibold" style={{ fontFamily: "var(--font-dm)" }}>Seleccionar →</span>
                </button>
              ))}
              {filtered.length === 0 && <p className="text-center py-4 text-sm text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>Sin resultados.</p>}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors" style={{ fontFamily: "var(--font-dm)" }}>← Ant.</button>
              <span className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>{page + 1} / {totalPages}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors" style={{ fontFamily: "var(--font-dm)" }}>Sig. →</button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>Paso 2 — Confirmá la creación del perfil.</p>
          <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-accent)]/25 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold text-sm" style={{ fontFamily: "var(--font-syne)" }}>{selected.username}</p>
              <p className="text-[0.72rem] text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>{selected.email} · ID #{selected.id}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="text-xs text-[var(--color-suido-4)] hover:text-white transition-colors" style={{ fontFamily: "var(--font-dm)" }}>Cambiar</button>
          </div>
          <p className="text-xs text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>El repartidor se creará como <span className="text-white font-medium">No disponible</span>.</p>
        </>
      )}

      {error && <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={handleCreate} disabled={!selected || submitting}
          className="text-sm font-semibold text-white px-4 py-2 rounded-xl bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          style={{ fontFamily: "var(--font-dm)" }}>
          {submitting && <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />}
          {submitting ? "Creando…" : "Crear repartidor"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm font-medium text-[var(--color-suido-4)] hover:text-white px-4 py-2 rounded-xl border border-[var(--color-suido-3)]/30 transition-colors" style={{ fontFamily: "var(--font-dm)" }}>Cancelar</button>
      </div>
    </div>
  );
}

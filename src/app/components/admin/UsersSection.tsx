"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAllUsers, deleteUser, type User } from "@/lib/admin";
import CreateUserForm from "./CreateUserForm";
import EditUserForm from "./EditUserForm";

const ROLE_FILTERS: { label: string; value: string | undefined }[] = [
  { label: "Todos",         value: undefined },
  { label: "Usuarios",      value: "ROLE_USER" },
  { label: "Repartidores",  value: "ROLE_DELIVERY" },
  { label: "Restaurantes",  value: "ROLE_RESTAURANT" },
  { label: "Admins",        value: "ROLE_SUPER" },
];

const ROLE_BADGE: Record<string, string> = {
  ROLE_USER:        "bg-purple-500/15 text-purple-400 border-purple-500/25",
  ROLE_DELIVERY:    "bg-green-500/15 text-green-400 border-green-500/25",
  ROLE_RESTAURANT:  "bg-orange-500/15 text-orange-400 border-orange-500/25",
  ROLE_SUPER:       "bg-red-500/15 text-red-400 border-red-500/25",
};

const ROLE_LABEL: Record<string, string> = {
  ROLE_USER:        "Usuario",
  ROLE_DELIVERY:    "Repartidor",
  ROLE_RESTAURANT:  "Restaurante",
  ROLE_SUPER:       "Admin",
};

const PAGE_SIZE = 10;
const COLS = "3rem 1fr 1.5fr 1.2fr 1fr 1.2fr 9rem";

export default function UsersSection() {
  const [users, setUsers]             = useState<User[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [roleFilter, setRoleFilter]   = useState<string | undefined>(undefined);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalElements, setTotal]     = useState(0);
  const [showCreate, setShowCreate]     = useState(false);
  const [editingUser, setEditingUser]   = useState<User | null>(null);
  const [pendingDeleteId, setPending]   = useState<number | null>(null);
  const [deleting, setDeleting]         = useState(false);

  const load = useCallback(async (p: number, role: string | undefined) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllUsers(p, PAGE_SIZE, role);
      setUsers(result.users);
      setTotalPages(result.totalPages);
      setTotal(result.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, roleFilter); }, [load, page, roleFilter]);

  function handleFilterChange(role: string | undefined) {
    setRoleFilter(role);
    setPage(0);
  }

  function openEdit(user: User) {
    setShowCreate(false);
    setEditingUser(user);
  }

  function openCreate() {
    setEditingUser(null);
    setShowCreate((v) => !v);
  }

  function handleUpdated(updated: User) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setEditingUser(null);
  }

  async function handleDelete(id: number) {
    if (pendingDeleteId !== id) { setPending(id); return; }
    setDeleting(true);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotal((t) => t - 1);
      if (editingUser?.id === id) setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el usuario.");
    } finally {
      setPending(null);
      setDeleting(false);
    }
  }

  const activeForm = showCreate ? "create" : editingUser ? "edit" : null;

  return (
    <section className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-syne)" }}>
            Usuarios
          </h2>
          {!loading && (
            <p className="text-xs text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
              {totalElements} {totalElements === 1 ? "registro" : "registros"}
              {roleFilter ? ` · ${ROLE_LABEL[roleFilter] ?? roleFilter}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreate}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors duration-200
              ${showCreate
                ? "border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white"
                : "bg-[var(--color-suido-cat)] border-[var(--color-suido-cat)] text-white hover:bg-[var(--color-suido-accent)] hover:border-[var(--color-suido-accent)]"
              }`}
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {showCreate ? "Cancelar" : "+ Crear usuario"}
          </button>
          <button
            type="button"
            onClick={() => load(page, roleFilter)}
            className="text-xs font-medium text-[var(--color-suido-4)] hover:text-white
                       px-3 py-1.5 rounded-full border border-[var(--color-suido-3)]/30
                       transition-colors duration-200"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Inline forms */}
      {activeForm === "create" && (
        <CreateUserForm
          onCreated={() => { setShowCreate(false); setPage(0); load(0, roleFilter); }}
          onCancel={() => setShowCreate(false)}
        />
      )}
      {activeForm === "edit" && editingUser && (
        <EditUserForm
          user={editingUser}
          onUpdated={handleUpdated}
          onCancel={() => setEditingUser(null)}
        />
      )}

      {/* Role filter pills */}
      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            onClick={() => handleFilterChange(value)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-150
              ${roleFilter === value
                ? "bg-[var(--color-suido-cat)] border-[var(--color-suido-cat)] text-white"
                : "bg-transparent border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white hover:border-[var(--color-suido-3)]/60"
              }`}
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
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
          No hay usuarios con este filtro.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-suido-3)]/20">
            {/* Header */}
            <div
              className="grid gap-4 px-5 py-3 min-w-[720px]
                         bg-[var(--color-suido-2)] border-b border-[var(--color-suido-3)]/20"
              style={{ gridTemplateColumns: COLS }}
            >
              {["ID", "Usuario", "Correo", "Teléfono", "Rol", "Registrado", ""].map((h) => (
                <span
                  key={h}
                  className="text-[0.62rem] font-medium tracking-widest uppercase text-[var(--color-suido-3)]"
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
                  className={`grid gap-4 px-5 py-3.5 min-w-[720px] transition-colors duration-150
                    ${editingUser?.id === u.id
                      ? "bg-[var(--color-suido-accent)]/5"
                      : "bg-[var(--color-suido-1)] hover:bg-[var(--color-suido-2)]/60"
                    }`}
                  style={{ gridTemplateColumns: COLS }}
                >
                  <span className="text-[var(--color-suido-4)] text-sm self-center" style={{ fontFamily: "var(--font-dm)" }}>
                    #{u.id}
                  </span>
                  <span className="text-white text-sm font-medium truncate self-center" style={{ fontFamily: "var(--font-dm)" }}>
                    {u.username}
                  </span>
                  <span className="text-[var(--color-suido-4)] text-sm truncate self-center" style={{ fontFamily: "var(--font-dm)" }}>
                    {u.email}
                  </span>
                  <span className="text-[var(--color-suido-4)] text-sm truncate self-center" style={{ fontFamily: "var(--font-dm)" }}>
                    {u.phone ?? "—"}
                  </span>
                  <span className="self-center">
                    <span
                      className={`text-[0.62rem] tracking-wide uppercase font-semibold border rounded-full px-2.5 py-0.5 whitespace-nowrap
                        ${u.role && ROLE_BADGE[u.role]
                          ? ROLE_BADGE[u.role]
                          : "bg-[var(--color-suido-3)]/15 text-[var(--color-suido-4)] border-[var(--color-suido-3)]/25"
                        }`}
                      style={{ fontFamily: "var(--font-dm)" }}
                    >
                      {u.role ? (ROLE_LABEL[u.role] ?? u.role) : "—"}
                    </span>
                  </span>
                  <span className="text-[var(--color-suido-4)] text-xs self-center" style={{ fontFamily: "var(--font-dm)" }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("es-AR") : "—"}
                  </span>
                  <span className="self-center flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => editingUser?.id === u.id ? setEditingUser(null) : openEdit(u)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors duration-150
                        ${editingUser?.id === u.id
                          ? "border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white"
                          : "border-[var(--color-suido-accent)]/30 text-[var(--color-suido-accent)] hover:bg-[var(--color-suido-accent)]/10"
                        }`}
                      style={{ fontFamily: "var(--font-dm)" }}
                    >
                      {editingUser?.id === u.id ? "✕" : "Editar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => pendingDeleteId === u.id ? handleDelete(u.id) : setPending(u.id)}
                      disabled={deleting && pendingDeleteId === u.id}
                      onBlur={() => { if (pendingDeleteId === u.id) setPending(null); }}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors duration-150
                        ${pendingDeleteId === u.id
                          ? "border-red-500/50 bg-red-500/15 text-red-400 hover:bg-red-500/25"
                          : "border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:border-red-500/40 hover:text-red-400"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      style={{ fontFamily: "var(--font-dm)" }}
                    >
                      {deleting && pendingDeleteId === u.id ? "…" : pendingDeleteId === u.id ? "¿Borrar?" : "Borrar"}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30
                           text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                ← Anterior
              </button>
              <span className="text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-xl text-sm border border-[var(--color-suido-3)]/30
                           text-[var(--color-suido-4)] hover:text-white disabled:opacity-40 transition-colors"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

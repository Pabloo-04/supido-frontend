"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAllDeliveryPersons, type DeliveryPerson } from "@/lib/admin";

export default function DriversSection() {
  const [drivers, setDrivers] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDrivers(await fetchAllDeliveryPersons());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar repartidores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-extrabold text-white"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Repartidores
        </h2>
        <button
          type="button"
          onClick={loadDrivers}
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
      ) : drivers.length === 0 ? (
        <p className="text-center py-16 text-[var(--color-suido-3)]" style={{ fontFamily: "var(--font-dm)" }}>
          No hay repartidores registrados.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((d) => (
            <div
              key={d.id}
              className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                         rounded-2xl p-5 flex items-center justify-between gap-4"
            >
              <div>
                <p
                  className="text-white font-bold text-sm"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {d.username ?? `Repartidor #${d.id}`}
                </p>
                <p
                  className="text-[0.72rem] text-[var(--color-suido-3)] mt-0.5"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  ID: {d.id}{d.userId ? ` · Usuario ${d.userId}` : ""}
                </p>
              </div>

              <span
                className={`text-[0.65rem] tracking-wide uppercase rounded-full px-2.5 py-0.5 flex-shrink-0
                            ${d.available
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-[var(--color-suido-2)] text-[var(--color-suido-3)] border border-[var(--color-suido-3)]/20"
                            }`}
                style={{ fontFamily: "var(--font-dm)" }}
              >
                {d.available ? "Disponible" : "No disponible"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

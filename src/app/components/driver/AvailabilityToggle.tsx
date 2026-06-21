"use client";

import { useState } from "react";
import { updateDeliveryPersonAvailability } from "@/lib/deliveryPersons";

interface AvailabilityToggleProps {
  deliveryPersonId: number;
  available: boolean;
  onChange: (available: boolean) => void;
}

export default function AvailabilityToggle({
  deliveryPersonId,
  available,
  onChange,
}: AvailabilityToggleProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    const next = !available;
    try {
      await updateDeliveryPersonAvailability(deliveryPersonId, next);
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar disponibilidad.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full
                    border transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    ${available
                      ? "bg-[var(--color-suido-cat)] border-[var(--color-suido-cat)] text-white"
                      : "bg-transparent border-[var(--color-suido-3)]/40 text-[var(--color-suido-4)]"
                    }`}
        style={{ fontFamily: "var(--font-dm)" }}
      >
        <span
          className={`w-2.5 h-2.5 rounded-full ${available ? "bg-white" : "bg-[var(--color-suido-3)]"}`}
        />
        {loading ? "Actualizando…" : available ? "Disponible" : "No disponible"}
      </button>
      {error && (
        <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-dm)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useCartStore } from "@/store/cart";

export default function ConflictModal() {
  const pending       = useCartStore((s) => s.pending);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const confirmSwitch  = useCartStore((s) => s.confirmSwitch);
  const cancelPending  = useCartStore((s) => s.cancelPending);

  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-sm bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                   rounded-2xl p-7 flex flex-col gap-5"
        style={{ animation: "var(--animate-fade-slide)" }}
      >
        <div>
          <h2
            className="text-lg font-extrabold text-white mb-2"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            ¿Cambiar restaurante?
          </h2>
          <p
            className="text-sm text-[var(--color-suido-4)] leading-relaxed"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Tu carrito tiene ítems de{" "}
            <span className="text-white font-semibold">{restaurantName}</span>.
            Si cambiás a{" "}
            <span className="text-white font-semibold">{pending.restaurantName}</span>
            , se vaciará el carrito actual.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={confirmSwitch}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white
                       bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)]
                       transition-colors duration-200"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Cambiar restaurante
          </button>
          <button
            onClick={cancelPending}
            className="w-full py-3 rounded-xl text-sm font-semibold
                       text-[var(--color-suido-4)] hover:text-white
                       border border-[var(--color-suido-3)]/30 hover:border-[var(--color-suido-3)]/60
                       transition-colors duration-200"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

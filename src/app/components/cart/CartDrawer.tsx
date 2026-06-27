"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore, type CartItem } from "@/store/cart";

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const items          = useCartStore((s) => s.items);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const setQuantity    = useCartStore((s) => s.setQuantity);
  const setNotes       = useCartStore((s) => s.setNotes);
  const clearCart      = useCartStore((s) => s.clearCart);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0) return null;

  return (
    <>
      {/* Floating pill */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3
                   bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)]
                   text-white rounded-2xl px-5 py-3
                   shadow-xl shadow-[var(--color-suido-cat)]/40
                   transition-all duration-200 active:scale-95"
        style={{ fontFamily: "var(--font-dm)" }}
      >
        <span className="text-sm font-semibold">Ver carrito</span>
        <span
          className="bg-white/20 text-xs font-bold rounded-full
                     min-w-[1.25rem] h-5 flex items-center justify-center px-1"
        >
          {count}
        </span>
        <span className="text-sm font-bold">${total.toFixed(2)}</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-md
                    bg-[var(--color-suido-1)] border-l border-[var(--color-suido-3)]/20
                    flex flex-col transition-transform duration-300 ease-out
                    ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-suido-3)]/15 flex-shrink-0">
          <div>
            <h2
              className="text-white font-extrabold text-lg"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Tu carrito
            </h2>
            <p
              className="text-xs text-[var(--color-suido-4)] mt-0.5"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              {restaurantName}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       text-[var(--color-suido-4)] hover:text-white hover:bg-[var(--color-suido-2)]
                       transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {items.map((item) => (
            <CartItemRow
              key={item.menuItemId}
              item={item}
              onSetQuantity={(qty) => setQuantity(item.menuItemId, qty)}
              onSetNotes={(notes) => setNotes(item.menuItemId, notes)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-[var(--color-suido-3)]/15 flex flex-col gap-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span
              className="text-[var(--color-suido-4)] text-sm"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              Total
            </span>
            <span
              className="text-white font-extrabold text-xl"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              ${total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => { setOpen(false); router.push("/checkout"); }}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white
                       bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)]
                       transition-colors duration-200"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Hacer pedido
          </button>

          <button
            onClick={() => { clearCart(); setOpen(false); }}
            className="w-full py-2 text-xs text-[var(--color-suido-3)]
                       hover:text-red-400 transition-colors"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Vaciar carrito
          </button>
        </div>
      </aside>
    </>
  );
}

function CartItemRow({
  item,
  onSetQuantity,
  onSetNotes,
}: {
  item: CartItem;
  onSetQuantity: (qty: number) => void;
  onSetNotes: (notes: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="flex flex-col gap-2 bg-[var(--color-suido-2)] rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-white text-sm font-bold truncate"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {item.name}
          </p>
          <p
            className="text-[var(--color-suido-accent)] text-xs font-semibold mt-0.5"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            ${(item.price * item.quantity).toFixed(2)}
            {item.quantity > 1 && (
              <span className="text-[var(--color-suido-3)] font-normal ml-1">
                (${item.price.toFixed(2)} c/u)
              </span>
            )}
          </p>
        </div>

        {/* Qty stepper */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onSetQuantity(item.quantity - 1)}
            className="w-7 h-7 rounded-lg bg-[var(--color-suido-1)]
                       hover:bg-red-500/20 text-white text-sm font-bold
                       flex items-center justify-center transition-colors"
          >
            −
          </button>
          <span
            className="text-white text-sm font-bold w-5 text-center"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {item.quantity}
          </span>
          <button
            onClick={() => onSetQuantity(item.quantity + 1)}
            className="w-7 h-7 rounded-lg bg-[var(--color-suido-1)]
                       hover:bg-[var(--color-suido-cat)]/30 text-white text-sm font-bold
                       flex items-center justify-center transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Notes */}
      <button
        onClick={() => setShowNotes((v) => !v)}
        className="text-left text-[0.7rem] text-[var(--color-suido-3)]
                   hover:text-[var(--color-suido-4)] transition-colors"
        style={{ fontFamily: "var(--font-dm)" }}
      >
        {showNotes ? "▾" : "▸"}{" "}
        {item.notes ? "Indicaciones de preparación" : "Agregar indicaciones de preparación"}
      </button>

      {showNotes && (
        <textarea
          rows={2}
          value={item.notes}
          onChange={(e) => onSetNotes(e.target.value)}
          placeholder="Ej: sin cebolla, término medio…"
          className="w-full bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/30
                     text-white placeholder-[var(--color-suido-3)] rounded-lg
                     px-3 py-2 text-xs resize-none
                     focus:outline-none focus:border-[var(--color-suido-accent)]
                     transition-colors"
          style={{ fontFamily: "var(--font-dm)" }}
        />
      )}
    </div>
  );
}

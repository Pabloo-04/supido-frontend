"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CatFaceSVG from "../components/landing/CatFaceSVG";
import { useCartStore } from "@/store/cart";
import { fetchAddresses, type UserAddress } from "@/lib/addresses";
import { placeOrder, type PaymentMethod } from "@/lib/user-orders";
import { getToken } from "@/lib/auth";

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items        = useCartStore((s) => s.items);
  const restaurantId = useCartStore((s) => s.restaurantId);
  const restName     = useCartStore((s) => s.restaurantName);
  const clearCart    = useCartStore((s) => s.clearCart);

  const [addresses, setAddresses]           = useState<UserAddress[]>([]);
  const [addressId, setAddressId]           = useState<number | null>(null);
  const [payment, setPayment]               = useState<PaymentMethod>("CASH");
  const [tip, setTip]                       = useState("");
  const [coupon, setCoupon]                 = useState("");
  const [loading, setLoading]               = useState(false);
  const [loadingAddr, setLoadingAddr]       = useState(true);
  const [error, setError]                   = useState<string | null>(null);

  const subtotal  = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tipAmount = parseFloat(tip) || 0;
  const total     = subtotal + tipAmount;

  useEffect(() => {
    if (!mounted) return;
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    if (items.length === 0) { router.push("/restaurants"); return; }

    fetchAddresses(token)
      .then((addrs) => {
        setAddresses(addrs);
        if (addrs.length > 0) setAddressId(addrs[0].id);
      })
      .catch(() => setError("No se pudieron cargar las direcciones."))
      .finally(() => setLoadingAddr(false));
  }, [mounted, items.length, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!addressId || restaurantId === null) return;
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    setError(null);
    try {
      const order = await placeOrder({
        restaurantId,
        userAddressId: addressId,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          ...(i.notes?.trim() ? { notes: i.notes.trim() } : {}),
        })),
        paymentMethod: payment,
        ...(tipAmount > 0 ? { tip: tipAmount } : {}),
        ...(coupon.trim() ? { couponId: parseInt(coupon, 10) } : {}),
      });
      clearCart();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pedido.");
      setLoading(false);
    }
  }

  if (!mounted || loadingAddr) {
    return (
      <main className="min-h-screen bg-[var(--color-suido-0)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-suido-0)]">
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                   px-6 md:px-12 py-4
                   bg-[var(--color-suido-0)]/90 backdrop-blur-xl
                   border-b border-[var(--color-suido-3)]/15"
      >
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-suido-1)] rounded-xl border border-[var(--color-suido-3)]/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            <CatFaceSVG className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[1.2rem] font-extrabold tracking-tight text-white leading-none" style={{ fontFamily: "var(--font-syne)" }}>
              Supi<span className="text-[var(--color-suido-accent)]">|</span>do
            </div>
            <div className="text-[0.55rem] tracking-[0.2em] uppercase text-[var(--color-suido-4)] mt-1" style={{ fontFamily: "var(--font-dm)" }}>
              Delivery Veloz
            </div>
          </div>
        </Link>
        <Link href="/restaurants" className="text-sm font-medium text-[var(--color-suido-4)] hover:text-white transition-colors" style={{ fontFamily: "var(--font-dm)" }}>
          ← Restaurantes
        </Link>
      </nav>

      <form onSubmit={handleSubmit}>
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* ── Left: form sections ── */}
          <div className="flex flex-col gap-5">

            {/* Delivery address */}
            <Section title="Dirección de entrega">
              {addresses.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-[var(--color-suido-4)] mb-3" style={{ fontFamily: "var(--font-dm)" }}>
                    No tenés direcciones guardadas.
                  </p>
                  <Link
                    href="/setup-address"
                    className="text-sm font-semibold text-[var(--color-suido-accent)] hover:underline"
                    style={{ fontFamily: "var(--font-dm)" }}
                  >
                    + Agregar dirección →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setAddressId(addr.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors duration-150
                        ${addressId === addr.id
                          ? "border-[var(--color-suido-accent)] bg-[var(--color-suido-accent)]/10"
                          : "border-[var(--color-suido-3)]/30 hover:border-[var(--color-suido-3)]/60 bg-[var(--color-suido-2)]"
                        }`}
                    >
                      <p className="text-white text-sm font-semibold" style={{ fontFamily: "var(--font-syne)" }}>
                        {addr.label}
                      </p>
                      <p className="text-xs text-[var(--color-suido-4)] mt-0.5" style={{ fontFamily: "var(--font-dm)" }}>
                        {addr.street}, {addr.city}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </Section>

            {/* Payment method */}
            <Section title="Método de pago">
              <div className="flex gap-3">
                {(["CASH", "CARD"] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayment(m)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors duration-150
                      ${payment === m
                        ? "bg-[var(--color-suido-cat)] border-[var(--color-suido-cat)] text-white"
                        : "bg-[var(--color-suido-2)] border-[var(--color-suido-3)]/30 text-[var(--color-suido-4)] hover:text-white"
                      }`}
                    style={{ fontFamily: "var(--font-dm)" }}
                  >
                    {m === "CASH" ? "💵  Efectivo" : "💳  Tarjeta"}
                  </button>
                ))}
              </div>
            </Section>

            {/* Tip */}
            <Section title="Propina (opcional)">
              <div className="flex items-center bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/30 rounded-xl overflow-hidden focus-within:border-[var(--color-suido-accent)] transition-colors">
                <span className="px-4 text-[var(--color-suido-4)] text-sm select-none" style={{ fontFamily: "var(--font-dm)" }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-white text-sm px-2 py-3 focus:outline-none placeholder-[var(--color-suido-3)]"
                  style={{ fontFamily: "var(--font-dm)" }}
                />
              </div>
            </Section>

            {/* Coupon */}
            <Section title="Cupón (opcional)">
              <input
                type="number"
                min="1"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="ID del cupón"
                className="w-full bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/30
                           text-white placeholder-[var(--color-suido-3)] rounded-xl
                           px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-suido-accent)]
                           transition-colors"
                style={{ fontFamily: "var(--font-dm)" }}
              />
            </Section>
          </div>

          {/* ── Right: summary + submit ── */}
          <div className="lg:sticky lg:top-24">
            <Section title={restName}>
              <div className="flex flex-col gap-2 mb-4">
                {items.map((item) => (
                  <div key={item.menuItemId} className="flex items-start justify-between gap-3">
                    <span className="text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>
                      <span className="text-white font-semibold">{item.quantity}×</span> {item.name}
                    </span>
                    <span className="text-sm text-white whitespace-nowrap" style={{ fontFamily: "var(--font-dm)" }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5 pt-4 border-t border-[var(--color-suido-3)]/15">
                <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                {tipAmount > 0 && <Row label="Propina" value={`$${tipAmount.toFixed(2)}`} />}
                <div className="flex justify-between pt-2 border-t border-[var(--color-suido-3)]/15 mt-1">
                  <span className="text-white font-extrabold text-base" style={{ fontFamily: "var(--font-syne)" }}>Total</span>
                  <span className="text-[var(--color-suido-accent)] font-extrabold text-base" style={{ fontFamily: "var(--font-syne)" }}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {error && (
                <p
                  className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !addressId}
                className="mt-5 w-full py-3 rounded-xl text-sm font-semibold text-white
                           bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors duration-200 flex items-center justify-center gap-2"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Procesando…
                  </>
                ) : (
                  `Confirmar pedido · $${total.toFixed(2)}`
                )}
              </button>
            </Section>
          </div>

        </div>
      </form>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20 rounded-2xl p-6">
      <h2 className="text-sm font-extrabold text-white mb-4 uppercase tracking-wide" style={{ fontFamily: "var(--font-syne)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-[var(--color-suido-4)]" style={{ fontFamily: "var(--font-dm)" }}>{label}</span>
      <span className="text-sm text-white" style={{ fontFamily: "var(--font-dm)" }}>{value}</span>
    </div>
  );
}

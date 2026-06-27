"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import CatFaceSVG from "../../components/landing/CatFaceSVG";
import CartDrawer from "../../components/cart/CartDrawer";
import ConflictModal from "../../components/cart/ConflictModal";
import { useCartStore } from "@/store/cart";

interface Restaurant {
  id: number;
  name: string;
  category: string;
  photoUrl?: string;
  address?: string;
  openingTime?: string;
  closingTime?: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  photoUrl?: string;
  available: boolean;
}

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems]   = useState<MenuItem[]>([]);
  const [loading, setLoading]       = useState(true);

  const addItem    = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const cartItems  = useCartStore((s) => s.items);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;

    async function load() {
      setLoading(true);
      try {
        const [restRes, menuRes] = await Promise.all([
          fetch(`${base}/api/restaurants/${id}`),
          fetch(`${base}/api/restaurants/${id}/menu-items`),
        ]);
        const restJson = await restRes.json();
        const menuJson = await menuRes.json();
        setRestaurant(restJson?.data ?? restJson);
        const raw = menuJson?.data ?? menuJson;
        const items = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];
        setMenuItems(items);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const grouped = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  function handleAdd(item: MenuItem) {
    if (!restaurant) return;
    addItem(Number(id), restaurant.name, {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      photoUrl: item.photoUrl,
    });
  }

  return (
    <main className="min-h-screen bg-[var(--color-suido-0)]">

      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                   px-6 md:px-12 lg:px-16 py-4 md:py-5
                   bg-[var(--color-suido-0)]/90 backdrop-blur-xl
                   border-b border-[var(--color-suido-3)]/15"
      >
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-10 h-10 md:w-11 md:h-11 bg-[var(--color-suido-1)] rounded-xl
                       border border-[var(--color-suido-3)]/30
                       flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            <CatFaceSVG className="w-7 h-7 md:w-8 md:h-8" />
          </div>
          <div>
            <div
              className="text-[1.2rem] md:text-[1.4rem] font-extrabold tracking-tight text-white leading-none"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Supi<span className="text-[var(--color-suido-accent)]">|</span>do
            </div>
            <div
              className="text-[0.55rem] md:text-[0.62rem] tracking-[0.2em] uppercase text-[var(--color-suido-4)] mt-1"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              Delivery Veloz
            </div>
          </div>
        </Link>

        <Link
          href="/restaurants"
          className="text-xs md:text-sm font-medium text-[var(--color-suido-4)]
                     hover:text-white transition-colors duration-200"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          ← Restaurantes
        </Link>
      </nav>

      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* Hero image */}
          <div className="relative h-56 md:h-72 lg:h-80 overflow-hidden mt-[72px]">
            {restaurant?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.photoUrl}
                alt={restaurant?.name ?? ""}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[var(--color-suido-2)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-suido-0)] via-[var(--color-suido-0)]/40 to-transparent" />
            <div className="absolute bottom-6 left-6 md:left-12 lg:left-16">
              <h1
                className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {restaurant?.name}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span
                  className="text-[0.7rem] tracking-wide uppercase
                             bg-[var(--color-suido-cat)]/20 text-[var(--color-suido-accent)]
                             border border-[var(--color-suido-cat)]/30 rounded-full px-3 py-0.5"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  {restaurant?.category}
                </span>
                {restaurant?.openingTime && restaurant?.closingTime && (
                  <span
                    className="text-[0.75rem] text-[var(--color-suido-4)]"
                    style={{ fontFamily: "var(--font-dm)" }}
                  >
                    {restaurant.openingTime} – {restaurant.closingTime}
                  </span>
                )}
                {restaurant?.address && (
                  <span
                    className="text-[0.75rem] text-[var(--color-suido-3)]"
                    style={{ fontFamily: "var(--font-dm)" }}
                  >
                    {restaurant.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="px-6 md:px-12 lg:px-16 py-10 max-w-7xl mx-auto pb-28">
            <h2
              className="text-[1.5rem] font-extrabold text-white mb-8"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Menú
            </h2>

            {menuItems.length === 0 ? (
              <p
                className="text-[var(--color-suido-3)] py-12 text-center"
                style={{ fontFamily: "var(--font-dm)" }}
              >
                Este restaurante aún no tiene ítems en su menú.
              </p>
            ) : (
              <div className="flex flex-col gap-10">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <h3
                      className="text-[0.7rem] tracking-[0.15em] uppercase text-[var(--color-suido-4)] mb-4
                                 pb-2 border-b border-[var(--color-suido-3)]/15"
                      style={{ fontFamily: "var(--font-dm)" }}
                    >
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {items.map((item) => {
                        const cartItem = cartItems.find((c) => c.menuItemId === item.id);
                        return (
                          <div
                            key={item.id}
                            className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                                       rounded-2xl overflow-hidden flex flex-col"
                          >
                            {item.photoUrl && (
                              <div className="h-36 overflow-hidden bg-[var(--color-suido-2)] flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.photoUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="p-4 flex flex-col gap-1 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4
                                  className="text-white font-bold text-sm leading-snug"
                                  style={{ fontFamily: "var(--font-syne)" }}
                                >
                                  {item.name}
                                </h4>
                                <span
                                  className="text-[var(--color-suido-accent)] font-bold text-sm whitespace-nowrap"
                                  style={{ fontFamily: "var(--font-syne)" }}
                                >
                                  ${item.price.toFixed(2)}
                                </span>
                              </div>
                              <p
                                className="text-[0.78rem] text-[var(--color-suido-4)] leading-relaxed"
                                style={{ fontFamily: "var(--font-dm)" }}
                              >
                                {item.description}
                              </p>

                              {/* Cart controls */}
                              <div className="mt-auto pt-3">
                                {!item.available ? (
                                  <span
                                    className="text-[0.65rem] tracking-wide uppercase
                                               bg-red-500/10 text-red-400 border border-red-500/20
                                               rounded-full px-2.5 py-0.5"
                                    style={{ fontFamily: "var(--font-dm)" }}
                                  >
                                    No disponible
                                  </span>
                                ) : cartItem ? (
                                  <div className="flex items-center justify-between">
                                    <span
                                      className="text-xs text-[var(--color-suido-4)]"
                                      style={{ fontFamily: "var(--font-dm)" }}
                                    >
                                      En carrito
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setQuantity(item.id, cartItem.quantity - 1)}
                                        className="w-7 h-7 rounded-lg bg-[var(--color-suido-2)]
                                                   hover:bg-red-500/20 text-white text-sm font-bold
                                                   flex items-center justify-center transition-colors"
                                      >
                                        −
                                      </button>
                                      <span
                                        className="text-white text-sm font-bold w-5 text-center"
                                        style={{ fontFamily: "var(--font-syne)" }}
                                      >
                                        {cartItem.quantity}
                                      </span>
                                      <button
                                        onClick={() => setQuantity(item.id, cartItem.quantity + 1)}
                                        className="w-7 h-7 rounded-lg bg-[var(--color-suido-2)]
                                                   hover:bg-[var(--color-suido-cat)]/40 text-white text-sm font-bold
                                                   flex items-center justify-center transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAdd(item)}
                                    className="w-full py-2 rounded-xl text-xs font-semibold text-white
                                               bg-[var(--color-suido-cat)]/80 hover:bg-[var(--color-suido-cat)]
                                               transition-colors duration-200"
                                    style={{ fontFamily: "var(--font-dm)" }}
                                  >
                                    + Agregar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <CartDrawer />
      <ConflictModal />
    </main>
  );
}

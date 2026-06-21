"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/auth";
import CatFaceSVG from "../components/landing/CatFaceSVG";

interface Restaurant {
  id: number;
  name: string;
  category: string;
  photoUrl?: string;
}

export default function RestaurantsPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [query, setQuery]             = useState("");
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (getRole() === "DRIVER") router.push("/driver");
  }, [router]);

  const fetchRestaurants = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL;
      const url = search
        ? `${base}/api/restaurants/search?name=${encodeURIComponent(search)}`
        : `${base}/api/restaurants`;
      const res  = await fetch(url);
      const json = await res.json();
      const data = json?.data ?? json;
      setRestaurants(Array.isArray(data.content) ? data.content : []);
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchRestaurants(query), 300);
    return () => clearTimeout(t);
  }, [query, fetchRestaurants]);

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
          href="/"
          className="text-xs md:text-sm font-medium text-[var(--color-suido-4)]
                     hover:text-white transition-colors duration-200"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          ← Volver al inicio
        </Link>
      </nav>

      {/* Page content */}
      <div className="pt-28 pb-16 px-6 md:px-12 lg:px-16">

        {/* Heading */}
        <div className="text-center mb-10" style={{ animation: "var(--animate-fade-slide)" }}>
          <h1
            className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold text-white tracking-tight mb-3"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Restaurantes
          </h1>
          <p
            className="text-[var(--color-suido-4)] text-[0.95rem]"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Explora y encuentra tu próxima comida favorita
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar restaurante..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/30
                         text-white placeholder-[var(--color-suido-3)] rounded-full
                         px-6 py-3.5 pr-12 text-sm
                         focus:outline-none focus:border-[var(--color-suido-accent)]
                         transition-colors duration-200"
              style={{ fontFamily: "var(--font-dm)" }}
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-suido-3)] select-none">
              🔍
            </span>
          </div>
        </div>

        {/* Loading / empty / grid */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
          </div>
        ) : restaurants.length === 0 ? (
          <p
            className="text-center py-24 text-[var(--color-suido-3)]"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            No se encontraron restaurantes.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {restaurants.map((r) => {
              const img = r.photoUrl || null;
              return (
                <Link
                  key={r.id}
                  href={`/restaurants/${r.id}`}
                  className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                             rounded-2xl overflow-hidden
                             hover:-translate-y-1 hover:border-[var(--color-suido-3)]/50
                             transition-all duration-200 block"
                >
                  <div className="relative h-44 overflow-hidden bg-[var(--color-suido-2)]">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={r.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-[var(--color-suido-3)]">
                        🍽️
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3
                      className="text-white font-bold text-base truncate"
                      style={{ fontFamily: "var(--font-syne)" }}
                    >
                      {r.name}
                    </h3>
                    <span
                      className="inline-block mt-2 text-[0.7rem] tracking-wide uppercase
                                 bg-[var(--color-suido-cat)]/20 text-[var(--color-suido-accent)]
                                 border border-[var(--color-suido-cat)]/30 rounded-full px-3 py-0.5"
                      style={{ fontFamily: "var(--font-dm)" }}
                    >
                      {r.category}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

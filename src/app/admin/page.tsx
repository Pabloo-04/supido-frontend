"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRole, getToken, removeToken } from "@/lib/auth";
import CatFaceSVG from "../components/landing/CatFaceSVG";
import RestaurantsSection from "../components/admin/RestaurantsSection";
import UsersSection from "../components/admin/UsersSection";
import DriversSection from "../components/admin/DriversSection";
import DriversMapSection from "../components/admin/DriversMapSection";

type Tab = "restaurants" | "users" | "drivers" | "map";

const TABS: { id: Tab; label: string }[] = [
  { id: "restaurants", label: "Restaurantes" },
  { id: "users",       label: "Usuarios" },
  { id: "drivers",     label: "Repartidores" },
  { id: "map",         label: "Mapa en vivo" },
];

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab]   = useState<Tab>("restaurants");

  useEffect(() => {
    const token = getToken();
    if (!token || getRole() !== "ROLE_SUPER") {
      router.push("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  function handleLogout() {
    removeToken();
    router.push("/login");
  }

  if (!authorized) return null;

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
              Panel de administración
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="text-xs md:text-sm font-medium text-white
                     px-4 md:px-5 py-2 md:py-2.5 rounded-full
                     border border-[var(--color-suido-3)]/40 hover:border-[var(--color-suido-accent)]
                     transition-colors duration-200"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          Cerrar sesión
        </button>
      </nav>

      {/* Content */}
      <div className="pt-28 pb-16 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">

        {/* Page heading */}
        <div className="mb-8">
          <h1
            className="text-[clamp(1.6rem,4vw,2.5rem)] font-extrabold text-white tracking-tight"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Administración
          </h1>
          <p
            className="text-[var(--color-suido-4)] text-sm mt-1"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Gestión de restaurantes, usuarios y repartidores
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-8 p-1 bg-[var(--color-suido-1)] rounded-2xl w-fit border border-[var(--color-suido-3)]/15">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors duration-200
                          ${activeTab === id
                            ? "bg-[var(--color-suido-cat)] text-white"
                            : "text-[var(--color-suido-4)] hover:text-white"
                          }`}
              style={{ fontFamily: "var(--font-dm)" }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Active section */}
        {activeTab === "restaurants" && <RestaurantsSection />}
        {activeTab === "users"       && <UsersSection />}
        {activeTab === "drivers"     && <DriversSection />}
        {activeTab === "map"         && <DriversMapSection />}
      </div>
    </main>
  );
}

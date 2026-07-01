"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRole, getToken, removeToken } from "@/lib/auth";
import CatFaceSVG from "./CatFaceSVG";

const Navbar = () => {
  const router = useRouter();
  const [scrolled, setScrolled]         = useState(false);
  const [loggedIn, setLoggedIn]         = useState(false);
  const [isDriver, setIsDriver]         = useState(false);
  const [isRestaurant, setIsRestaurant] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const role = getRole();
    setLoggedIn(Boolean(getToken()));
    setIsDriver(role === "ROLE_DELIVERY");
    setIsRestaurant(role === "ROLE_RESTAURANT");
  }, []);

  function handleLogout() {
    removeToken();
    setLoggedIn(false);
    router.push("/login");
  }

  const navClass = scrolled
    ? "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 lg:px-16 py-4 md:py-5 transition-all duration-300 bg-[var(--color-suido-0)]/90 backdrop-blur-xl border-b border-[var(--color-suido-3)]/15"
    : "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 lg:px-16 py-4 md:py-5 transition-all duration-300 bg-transparent";

  return (
    <nav className={navClass} suppressHydrationWarning>
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 md:w-11 md:h-11 bg-[var(--color-suido-1)] rounded-xl border border-[var(--color-suido-3)]/30 flex items-center justify-center overflow-hidden flex-shrink-0">
          <CatFaceSVG className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <div>
          <div className="text-[1.2rem] md:text-[1.4rem] font-extrabold tracking-tight text-white leading-none" style={{ fontFamily: "var(--font-syne)" }}>
            Supi<span className="text-[var(--color-suido-accent)]">|</span>do
          </div>
          <div className="text-[0.55rem] md:text-[0.62rem] tracking-[0.2em] uppercase text-[var(--color-suido-4)] mt-1" style={{ fontFamily: "var(--font-dm)" }}>
            Delivery Veloz
          </div>
        </div>
      </div>

      {/* Links */}
      <ul className="hidden lg:flex items-center gap-10 list-none">
        {[
          { href: "#como-funciona", label: "Cómo funciona" },
          { href: "#servicios",     label: "Servicios" },
          { href: "#opiniones",     label: "Opiniones" },
        ].map(({ href, label }) => (
          <li key={label}>
            <a href={href} className="text-sm text-[var(--color-suido-4)] hover:text-white transition-colors duration-200 tracking-wide">
              {label}
            </a>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="flex items-center gap-2 md:gap-3" suppressHydrationWarning>
        {loggedIn ? (
          <>
            {!isDriver && !isRestaurant && (
              <Link href="/orders" className="text-xs md:text-sm font-medium text-[var(--color-suido-4)] hover:text-white px-3 md:px-4 py-2 rounded-full transition-colors duration-200">
                Mis pedidos
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs md:text-sm font-medium text-white px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-[var(--color-suido-3)]/40 hover:border-[var(--color-suido-accent)] transition-colors duration-200"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-xs md:text-sm font-medium text-[var(--color-suido-4)] hover:text-white px-3 md:px-4 py-2 rounded-full transition-colors duration-200">
              Ingresar
            </Link>
            <Link href="/register" className="text-xs md:text-sm font-medium text-white px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-[var(--color-suido-3)]/40 hover:border-[var(--color-suido-accent)] transition-colors duration-200">
              Registrarse
            </Link>
          </>
        )}
        <Link
          href={isDriver ? "/driver" : isRestaurant ? "/restaurant" : "/restaurants"}
          className="text-xs md:text-sm font-medium text-white px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)] transition-colors duration-200"
        >
          {isDriver ? "Ver pedidos" : isRestaurant ? "Mi restaurante" : "Ordenar ahora"}
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;

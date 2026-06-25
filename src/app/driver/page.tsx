"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRole, getToken, getUserId } from "@/lib/auth";
import { fetchDeliveryPersonByUserId } from "@/lib/deliveryPersons";
import CatFaceSVG from "../components/landing/CatFaceSVG";
import AvailableOrders from "../components/driver/AvailableOrders";
import AvailabilityToggle from "../components/driver/AvailabilityToggle";
import { useDriverLocationPublisher } from "../components/driver/useDriverLocationPublisher";

export default function DriverPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [deliveryPersonId, setDeliveryPersonId] = useState<number | null>(null);
  const [available, setAvailable] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setProfileError("No se pudo identificar al usuario.");
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const profile = await fetchDeliveryPersonByUserId(userId);
      setDeliveryPersonId(profile.id);
      setAvailable(profile.available);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Error al cargar el perfil.");
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token || getRole() !== "ROLE_DELIVERY") {
      router.push("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (authorized) loadProfile();
  }, [authorized, loadProfile]);

  useDriverLocationPublisher(deliveryPersonId, authorized);

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
              Panel de repartidor
            </div>
          </div>
        </Link>

        {deliveryPersonId && (
          <AvailabilityToggle
            deliveryPersonId={deliveryPersonId}
            available={available}
            onChange={setAvailable}
          />
        )}
      </nav>

      {/* Page content */}
      <div className="pt-28 pb-16 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        {profileError && (
          <p
            className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 mb-6"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {profileError}
          </p>
        )}
        {loadingProfile ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-suido-accent)] border-t-transparent animate-spin" />
          </div>
        ) : (
          <AvailableOrders />
        )}
      </div>
    </main>
  );
}

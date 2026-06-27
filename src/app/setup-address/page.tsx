"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { getToken } from "@/lib/auth";
import { createAddress } from "@/lib/addresses";
import CatFaceSVG from "../components/landing/CatFaceSVG";
 

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";
const DEFAULT_CENTER = { lat: 13.690026, lng: -89.234408};

export default function SetupAddressPage() {
  const router = useRouter();
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [label, setLabel] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleMapClick(e: MapMouseEvent) {
    const latLng = e.detail.latLng;
    if (!latLng) return;
    setPicked({ lat: latLng.lat, lng: latLng.lng });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) {
      setError("Seleccioná un punto en el mapa.");
      return;
    }
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    setError(null);
    try {
      await createAddress(token, {
        label: label.trim(),
        street: street.trim(),
        city: city.trim(),
        latitude: picked.lat,
        longitude: picked.lng,
      });
      router.push("/restaurants");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la dirección.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-suido-0)] flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="flex items-center gap-3 mb-8">
        <div
          className="w-11 h-11 bg-[var(--color-suido-1)] rounded-xl
                     border border-[var(--color-suido-3)]/30
                     flex items-center justify-center overflow-hidden flex-shrink-0"
        >
          <CatFaceSVG className="w-8 h-8" />
        </div>
        <div>
          <div
            className="text-[1.35rem] font-extrabold tracking-tight text-white leading-none"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Supi<span className="text-[var(--color-suido-accent)]">|</span>do
          </div>
          <div
            className="text-[0.6rem] tracking-[0.2em] uppercase text-[var(--color-suido-4)] mt-1"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            Delivery Veloz
          </div>
        </div>
      </Link>

      <div
        className="w-full max-w-xl bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                   rounded-2xl p-8"
        style={{ animation: "var(--animate-fade-slide)" }}
      >
        <h1
          className="text-2xl font-extrabold text-white mb-1"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Tu dirección de entrega
        </h1>
        <p
          className="text-sm text-[var(--color-suido-4)] mb-6"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          Hacé clic en el mapa para elegir tu ubicación y completá los datos.
        </p>

        <div
          className="rounded-2xl overflow-hidden border border-[var(--color-suido-3)]/20 mb-2"
          style={{ height: "280px" }}
        >
          <APIProvider apiKey={MAPS_KEY}>
            <Map
              defaultCenter={DEFAULT_CENTER}
              defaultZoom={12}
              mapId="supido-address-picker"
              gestureHandling="greedy"
              style={{ width: "100%", height: "100%" }}
              onClick={handleMapClick}
            >
              {picked && (
                <AdvancedMarker position={picked}>
                  <Pin
                    background="#f97316"
                    borderColor="#ea580c"
                    glyphColor="#fff"
                  />
                </AdvancedMarker>
              )}
            </Map>
          </APIProvider>
        </div>

        <p
          className="text-xs text-[var(--color-suido-3)] mb-5"
          style={{ fontFamily: "var(--font-dm)" }}
        >
          {picked
            ? `Punto seleccionado: ${picked.lat.toFixed(6)}, ${picked.lng.toFixed(6)}`
            : "Tocá el mapa para marcar tu domicilio."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AddressField
            label="Número de casa / Apartamento"
            id="label"
            value={label}
            onChange={setLabel}
            placeholder="Ej: Apto 3B, Casa 12"
          />
          <AddressField
            label="Calle"
            id="street"
            value={street}
            onChange={setStreet}
            placeholder="Ej: Av. Corrientes 1234"
          />
          <AddressField
            label="Ciudad"
            id="city"
            value={city}
            onChange={setCity}
            placeholder="Ej: Buenos Aires"
          />

          {error && (
            <p
              className="text-sm text-red-400 bg-red-400/10 border border-red-400/20
                         rounded-xl px-4 py-2.5"
              style={{ fontFamily: "var(--font-dm)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !picked}
            className="mt-2 w-full py-3 rounded-xl text-sm font-semibold text-white
                       bg-[var(--color-suido-cat)] hover:bg-[var(--color-suido-accent)]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200 flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar dirección"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

function AddressField({
  label,
  id,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium tracking-wide text-[var(--color-suido-4)] uppercase"
        style={{ fontFamily: "var(--font-dm)" }}
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[var(--color-suido-2)] border border-[var(--color-suido-3)]/30
                   text-white placeholder-[var(--color-suido-3)] rounded-xl
                   px-4 py-3 text-sm
                   focus:outline-none focus:border-[var(--color-suido-accent)]
                   transition-colors duration-200"
        style={{ fontFamily: "var(--font-dm)" }}
      />
    </div>
  );
}

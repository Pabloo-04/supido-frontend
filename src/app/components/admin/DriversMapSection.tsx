"use client";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import { useDriversMap } from "./useDriversMap";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

// Buenos Aires as default centre — map re-centres automatically once pins arrive
const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

export default function DriversMapSection() {
  const pins = useDriversMap();
  const pinList = Array.from(pins.values());

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-extrabold text-white"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Mapa de repartidores
          </h2>
          <p
            className="text-xs text-[var(--color-suido-4)] mt-0.5"
            style={{ fontFamily: "var(--font-dm)" }}
          >
            {pinList.length === 0
              ? "Esperando actualizaciones en tiempo real…"
              : `${pinList.length} repartidor${pinList.length !== 1 ? "es" : ""} en línea`}
          </p>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4" style={{ fontFamily: "var(--font-dm)" }}>
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-suido-4)]">
            <span className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-suido-4)]">
            <span className="w-3 h-3 rounded-full bg-orange-400 flex-shrink-0" />
            Ocupado
          </span>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden border border-[var(--color-suido-3)]/20"
        style={{ height: "520px" }}
      >
        <APIProvider apiKey={MAPS_KEY}>
          <Map
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={12}
            mapId="supido-drivers-map"
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: "100%", height: "100%" }}
          >
            {pinList.map((pin) => (
              <AdvancedMarker
                key={pin.deliveryPersonId}
                position={{ lat: pin.latitude, lng: pin.longitude }}
                title={`Repartidor #${pin.deliveryPersonId}${pin.available ? " · Disponible" : " · Ocupado"}`}
              >
                <Pin
                  background={pin.available ? "#34d399" : "#fb923c"}
                  borderColor={pin.available ? "#059669" : "#ea580c"}
                  glyphColor="#fff"
                />
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>
      </div>

      {/* Driver list below map */}
      {pinList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {pinList.map((pin) => (
            <div
              key={pin.deliveryPersonId}
              className="bg-[var(--color-suido-1)] border border-[var(--color-suido-3)]/20
                         rounded-xl px-4 py-3 flex items-center justify-between gap-2"
            >
              <div>
                <p
                  className="text-white text-xs font-bold"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  #{pin.deliveryPersonId}
                </p>
                <p
                  className="text-[0.65rem] text-[var(--color-suido-3)] mt-0.5"
                  style={{ fontFamily: "var(--font-dm)" }}
                >
                  {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
                </p>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  pin.available ? "bg-emerald-400" : "bg-orange-400"
                }`}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

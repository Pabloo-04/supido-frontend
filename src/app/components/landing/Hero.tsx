"use client";

import { BtnPrimary, BtnSecondary } from "./Buttons";
import ArrowRight from "./ArrowRight";
import Image from "next/image";

const Hero = () => (
  <section
    id="inicio"
    className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-0
               px-6 md:px-12 lg:px-16 pt-32 lg:pt-24 pb-16 overflow-hidden bg-[var(--color-suido-0)]"
  >
    <div className="absolute -top-24 right-0 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] rounded-full
                    bg-[var(--color-suido-cat)]/18 blur-3xl pointer-events-none" />
    <div className="absolute bottom-0 left-1/4 w-[300px] lg:w-[400px] h-[300px] lg:h-[400px] rounded-full
                    bg-[var(--color-suido-4)]/10 blur-3xl pointer-events-none" />

    <div className="relative z-10 text-center lg:text-left flex flex-col items-center lg:items-start" style={{ animation: "var(--animate-fade-slide)" }}>
      <div className="inline-flex items-center gap-2 bg-[var(--color-suido-3)]/15
                      border border-[var(--color-suido-3)]/30 px-3 md:px-4 py-1.5 rounded-full
                      text-[0.7rem] md:text-[0.78rem] tracking-[0.12em] uppercase text-[var(--color-suido-4)] mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-suido-accent)]"
              style={{ animation: "var(--animate-pulse2)" }} />
        Atencion 24/7
      </div>

      <h1
        className="text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[1.05]
                   tracking-tight text-white mb-6"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        Tus antojos,
        <br className="hidden md:block" />
        <span className="text-[var(--color-suido-accent)] relative inline-block mx-2 md:mx-0">
          rápidos y
          <span className="absolute left-0 -bottom-1 right-0 h-[3px] rounded-sm
                           bg-[var(--color-suido-cat)]" />
        </span>
        
        <br className="hidden md:block" />
        a buen precio
      </h1>

      <p className="text-[0.95rem] md:text-[1.05rem] leading-[1.7] text-[var(--color-suido-4)]
                    max-w-[480px] mb-8 lg:mb-10"
         style={{ fontFamily: "var(--font-dm)" }}>
        Explora los mejores restaurantes y las mejores comidas en tu zona.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <BtnPrimary href="/restaurants" className="w-full sm:w-auto">Pedir comida <ArrowRight /></BtnPrimary>
        <BtnSecondary href="#como-funciona" className="w-full sm:w-auto">¿Cómo funciona?</BtnSecondary>
      </div>

      <div className="flex justify-center lg:justify-start gap-6 sm:gap-10 mt-12 lg:mt-14 pt-8 border-t border-[var(--color-suido-3)]/15 w-full">
        {[
          { num: "+50", label: "Restaurantes" },
          { num: "28 min", label: "Tiempo promedio"  },
          { num: "4.9★",  label: "Calificación app"      },
        ].map(({ num, label }) => (
          <div key={label} className="text-center lg:text-left">
            <div className="text-[1.4rem] md:text-[1.8rem] font-bold text-white leading-none"
                 style={{ fontFamily: "var(--font-syne)" }}>
              {num}
            </div>
            <div className="text-[0.65rem] md:text-[0.78rem] text-[var(--color-suido-3)] tracking-wide mt-1.5"
                 style={{ fontFamily: "var(--font-dm)" }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="relative z-10 flex items-center justify-center mt-10 lg:mt-0 transform scale-[0.85] sm:scale-100"
         style={{ animation: "var(--animate-fade-slide-d)" }}>
      <div className="relative w-[360px] h-[460px]">
        <div className="absolute w-[300px] h-[380px] bg-[var(--color-suido-1)]
                        border border-[var(--color-suido-3)]/20 rounded-3xl
                        top-10 right-0 rotate-6" />

        <div className="absolute w-[300px] h-[380px] bg-[var(--color-suido-1)]
                        border border-[var(--color-suido-3)]/35 rounded-3xl
                        top-5 left-0 flex flex-col items-center justify-center p-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-suido-cat)]/8
                          to-transparent rounded-3xl" />
          <Image
            src="/supido.png"
            alt="Supido Delivery"
            width={200}
            height={200}
            className="relative z-10 w-[180px] h-[180px] object-contain rounded-xl "
            style={{ animation: "var(--animate-float-cat)", filter: "drop-shadow(0 0 30px rgba(107,47,204,0.5))" }}
          />
          <p className="text-[1.3rem] font-bold text-white mt-4 tracking-tight text-center"
             style={{ fontFamily: "var(--font-syne)" }}>
            Supido Delivery
          </p>
          <p className="text-[0.78rem] text-[var(--color-suido-3)] tracking-[0.15em] uppercase mt-1 text-center">
            Hamburguesa en camino
          </p>
        </div>

        {[
          { color: "bg-green-400",                       label: "Repartidor cerca", anim: "var(--animate-float-tag-1)", pos: "top-0 -right-5 md:-right-8"  },
          { color: "bg-[var(--color-suido-accent)]",     label: "Rastreo en vivo",   anim: "var(--animate-float-tag-2)", pos: "bottom-16 -left-6 md:-left-10" },
          { color: "bg-pink-300",                        label: "Llega en 10 min",  anim: "var(--animate-float-tag-3)", pos: "bottom-2 -right-3"  },
        ].map(({ color, label, anim, pos }) => (
          <div
            key={label}
            className={`absolute ${pos} flex items-center gap-1.5 bg-[var(--color-suido-2)]
                        border border-[var(--color-suido-3)]/30 rounded-full px-4 py-2
                        text-[0.7rem] md:text-[0.78rem] text-[var(--color-suido-5)] whitespace-nowrap shadow-xl`}
            style={{ animation: anim }}
          >
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Hero;
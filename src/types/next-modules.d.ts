// Covers the handful of next/* modules that ship without .d.ts in this build.
// next/link, next/navigation, next/image, next/server, next/headers all have
// native .d.ts files and must NOT be re-declared here.

declare module "next" {
  export type NextConfig        = Record<string, unknown>;
  export type Metadata          = Record<string, unknown>;
  export type Viewport          = Record<string, unknown>;
  export type ResolvingMetadata = Promise<Metadata>;
  export type ResolvingViewport = Promise<Viewport>;
  const _default: unknown;
  export default _default;
}

declare module "next/font/google" {
  interface FontOptions {
    subsets?: string[];
    weight?: string | string[];
    style?: string | string[];
    variable?: string;
    display?: "auto" | "block" | "swap" | "fallback" | "optional";
  }
  type FontResult = { className: string; variable: string; style: { fontFamily: string } };
  export function Syne(options: FontOptions): FontResult;
  export function DM_Sans(options: FontOptions): FontResult;
  export function Inter(options: FontOptions): FontResult;
  export function Roboto(options: FontOptions): FontResult;
  export function Open_Sans(options: FontOptions): FontResult;
  export function Lato(options: FontOptions): FontResult;
  export function Montserrat(options: FontOptions): FontResult;
  export function Poppins(options: FontOptions): FontResult;
  export function Geist(options: FontOptions): FontResult;
  export function Geist_Mono(options: FontOptions): FontResult;
}

declare module "next/types.js" {
  export type PageProps        = { params: Record<string, string>; searchParams: Record<string, string> };
  export type ResolvingMetadata = Promise<Record<string, unknown>>;
  export type ResolvingViewport = Promise<Record<string, unknown>>;
}

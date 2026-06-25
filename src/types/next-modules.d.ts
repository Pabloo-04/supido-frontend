declare module "next" {
  import type { NextConfig } from "next/dist/server/config-shared";
  export function defineConfig(config: object): object;
  export type { NextConfig };
  export type Metadata = Record<string, unknown>;
  export type Viewport = Record<string, unknown>;
  export type ResolvingMetadata = Promise<Metadata>;
  export type ResolvingViewport = Promise<Viewport>;
  const _default: unknown;
  export default _default;
}
declare module "next/link" {
  import type { AnchorHTMLAttributes, ReactNode } from "react";
  interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string | { pathname?: string; query?: Record<string, string> };
    replace?: boolean;
    prefetch?: boolean;
    children?: ReactNode;
  }
  export default function Link(props: LinkProps): JSX.Element;
}
declare module "next/navigation" {
  export function useRouter(): {
    push: (href: string) => void;
    replace: (href: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (href: string) => void;
  };
  export function useParams<T extends Record<string, string | string[]> = Record<string, string>>(): T;
  export function useSearchParams(): URLSearchParams;
  export function usePathname(): string;
  export function redirect(url: string): never;
  export function notFound(): never;
}
declare module "next/image" {
  import type { ImgHTMLAttributes } from "react";
  interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    priority?: boolean;
    quality?: number;
    placeholder?: "blur" | "empty";
    blurDataURL?: string;
  }
  export default function Image(props: ImageProps): JSX.Element;
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
declare module "next/server" {
  export class NextResponse {
    static json(body: unknown, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
    static next(init?: ResponseInit): NextResponse;
  }
  export class NextRequest extends Request {
    cookies: Map<string, { value: string }>;
    nextUrl: URL;
  }
}
declare module "next/headers" {
  export function cookies(): { get(name: string): { value: string } | undefined };
  export function headers(): Headers;
}
declare module "next/types.js" {
  export type PageProps = { params: Record<string, string>; searchParams: Record<string, string> };
  export type ResolvingMetadata = Promise<Record<string, unknown>>;
  export type ResolvingViewport = Promise<Record<string, unknown>>;
}

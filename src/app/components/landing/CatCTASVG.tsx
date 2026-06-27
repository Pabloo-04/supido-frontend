import type { CSSProperties } from "react";

const CatCtaSVG = ({ className = "", style }: { className?: string; style?: CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <title>Logo de Supido Delivery — cara de gato</title>
    <ellipse cx="105" cy="105" rx="50" ry="38" fill="#6B2FCC" />
    <circle cx="72"  cy="78"  r="40" fill="#7B3FDC" />
    <polygon points="52,40 62,64 42,64"  fill="#6B2FCC" />
    <polygon points="94,36 104,62 84,62" fill="#6B2FCC" />
    <polygon points="53,43 61,62 45,62"  fill="#C891F0" opacity="0.5" />
    <polygon points="94,39 102,61 86,61" fill="#C891F0" opacity="0.5" />
    <ellipse cx="62" cy="77" rx="9" ry="11" fill="white" />
    <ellipse cx="84" cy="74" rx="9" ry="11" fill="white" />
    <circle cx="64" cy="78" r="5.5" fill="#6B2FCC" />
    <circle cx="86" cy="75" r="5.5" fill="#6B2FCC" />
    <circle cx="65" cy="76" r="2" fill="white" />
    <circle cx="87" cy="73" r="2" fill="white" />
    <ellipse cx="73" cy="90" rx="4" ry="2.5" fill="#C891F0" />
    <path d="M62 98 Q73 108 86 98" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
    <line x1="35"  y1="85" x2="56"  y2="87" stroke="white" strokeWidth="1.2" opacity="0.7" />
    <line x1="35"  y1="90" x2="56"  y2="89" stroke="white" strokeWidth="1.2" opacity="0.7" />
    <line x1="92"  y1="85" x2="112" y2="83" stroke="white" strokeWidth="1.2" opacity="0.7" />
    <line x1="92"  y1="90" x2="112" y2="89" stroke="white" strokeWidth="1.2" opacity="0.7" />
    <path d="M148 85 Q180 60 168 110 Q160 138 150 128" stroke="#5A1FB8" strokeWidth="14" fill="none" strokeLinecap="round" />
    <polygon points="128,72 120,90 128,90 118,110 138,88 128,88 140,72" fill="#A86FFF" opacity="0.8" />
  </svg>
);

export default CatCtaSVG
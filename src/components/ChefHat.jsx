/** Gorro de chef (toque). Arte provisional dibujado en código: el Chef Maestro y la insignia de "ayudante". */
export default function ChefHat({ className = "", title }) {
  return (
    <svg className={className} viewBox="0 0 120 100" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <g stroke="#796058" strokeWidth="5" strokeLinejoin="round" fill="#fff8f0">
        <path d="M22 62C6 60 4 32 26 28C28 10 52 4 62 16C72 4 96 10 96 28C118 32 114 60 98 62V84H22Z" />
        <rect x="22" y="74" width="76" height="16" rx="4" fill="#ffe1d7" />
      </g>
      <path d="M44 34V66M60 30V66M76 34V66" stroke="#e7d5cf" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

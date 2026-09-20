/** Insignia provisional de "de vacaciones": un sol con lentes. Arte dibujado en código hasta tener el definitivo. */
export default function VacationIcon({ className = "", title }) {
  return (
    <svg className={className} viewBox="0 0 100 100" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <g stroke="#f5451c" strokeWidth="7" strokeLinecap="round">
        <path d="M50 6v12M50 82v12M6 50h12M82 50h12M19 19l8 8M73 73l8 8M81 19l-8 8M27 73l-8 8" />
      </g>
      <circle cx="50" cy="50" r="24" fill="#fdb833" stroke="#241b16" strokeWidth="5" />
      <path d="M32 46h36v8a6 6 0 0 1-6 6h-6a5 5 0 0 1-5-4h-2a5 5 0 0 1-5 4h-6a6 6 0 0 1-6-6z" fill="#241b16" />
    </svg>
  );
}

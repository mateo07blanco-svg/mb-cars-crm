// Logo MB Cars: escudo rojo con las iniciales en blanco y una línea de ruta.
export function Escudo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="mb-rojo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f43545" />
          <stop offset="1" stopColor="#b5121f" />
        </linearGradient>
      </defs>
      <path d="M24 2 L44 9 V24 C44 35 35 42.5 24 46 C13 42.5 4 35 4 24 V9 Z" fill="url(#mb-rojo)" />
      <path d="M24 5.5 L41 11.5 V24 C41 33.2 33.6 39.6 24 42.8 C14.4 39.6 7 33.2 7 24 V11.5 Z" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
      <text x="24" y="28" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="17" fill="#fff" letterSpacing="-0.5">MB</text>
      <path d="M12 33.5 C18 31 30 31 36 33.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Escudo />
      {!compacto && (
        <span className="leading-none">
          <span className="block text-lg font-black tracking-tight text-white">
            MB <span className="text-marca">CARS</span>
          </span>
          <span className="block text-[10px] font-medium tracking-[0.25em] text-apagado uppercase">Concesionaria</span>
        </span>
      )}
    </span>
  );
}

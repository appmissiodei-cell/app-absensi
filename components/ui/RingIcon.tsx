// Ikon cincin (tidak ada di paket lucide-react), gaya sama dengan ikon lucide lain.
export function RingIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="15" r="6" />
      <path d="M9.5 3.5L8 6.2l4 1.8 4-1.8-1.5-2.7z" />
      <path d="M8 6.2L12 9l4-2.8" />
    </svg>
  );
}

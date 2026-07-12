// A quiet decorative strip: little home on the left, a dashed flight path
// with a paper plane, a new skyline on the right. Flat, muted, and small —
// an illustrated detail, not a cartoon.
export function JourneyScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* ground */}
      <path d="M0 62 Q 60 54 120 60 T 340 58 L340 72 L0 72 Z" fill="#E3E9D6" />
      {/* left: the old home */}
      <rect x="26" y="44" width="22" height="16" rx="1.5" fill="#F8E3D4" stroke="#C97853" strokeWidth="1.5" />
      <path d="M23 45 L37 33 L51 45" fill="none" stroke="#C97853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="34" y="51" width="6" height="9" rx="1" fill="#C97853" opacity="0.55" />
      {/* small tree */}
      <circle cx="64" cy="50" r="7" fill="#B7C9A0" />
      <rect x="63" y="55" width="2" height="6" fill="#94886F" />
      {/* dashed flight path */}
      <path
        d="M78 40 C 120 12, 200 12, 250 30"
        stroke="#5E93B8"
        strokeWidth="1.75"
        strokeDasharray="5 6"
        strokeLinecap="round"
        fill="none"
      />
      {/* paper plane */}
      <path d="M158 15 L172 21 L160 24 L158 30 Z" fill="#FAF6EE" stroke="#5E93B8" strokeWidth="1.5" strokeLinejoin="round" />
      {/* clouds */}
      <path d="M104 24 q4 -7 11 -4 q3 -5 9 -2 q6 -2 7 4 l-27 2 Z" fill="#DCEAF4" />
      <path d="M212 12 q4 -6 10 -3 q4 -4 8 0 q5 0 5 4 l-23 1 Z" fill="#DCEAF4" />
      {/* right: the new skyline */}
      <rect x="258" y="40" width="14" height="20" rx="1.5" fill="#DCEAF4" stroke="#5E93B8" strokeWidth="1.5" />
      <rect x="276" y="32" width="16" height="28" rx="1.5" fill="#FAF6EE" stroke="#5E93B8" strokeWidth="1.5" />
      <path d="M276 32 L284 24 L292 32" fill="none" stroke="#5E93B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="296" y="44" width="13" height="16" rx="1.5" fill="#E8E3F2" stroke="#8078AC" strokeWidth="1.5" />
      <rect x="281" y="40" width="5" height="6" rx="0.8" fill="#5E93B8" opacity="0.5" />
      <rect x="262" y="45" width="4" height="5" rx="0.8" fill="#5E93B8" opacity="0.5" />
    </svg>
  );
}

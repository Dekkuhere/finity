import { useId } from 'react';

// Two stacked upward chevrons (growth + stability) with a pivot dot. Silver back chevron, emerald-to-teal front.
export default function Logo({ className = 'w-8 h-8' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}e`} x1="6" y1="35" x2="34" y2="5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" /><stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="6" y1="26" x2="34" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: 'rgb(var(--slate-500))' }} /><stop offset="1" style={{ stopColor: 'rgb(var(--slate-400))' }} />
        </linearGradient>
      </defs>
      <path d="M6 26 20 12 34 26" stroke={`url(#${id}s)`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 35 20 21 34 35" stroke={`url(#${id}e)`} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="4.5" r="2.4" fill={`url(#${id}e)`} />
    </svg>
  );
}

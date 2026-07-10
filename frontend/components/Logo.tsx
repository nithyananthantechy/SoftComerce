import React from "react";

export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sc-logo-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="sc-logo-gradient-2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="sc-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Dashed outer orbit */}
      <circle
        cx="16"
        cy="16"
        r="14"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />

      {/* C Shape (representing commerce/container) */}
      <path
        d="M24 9C21.5 6.5 17.5 5.5 14 7C9.5 9 7 14 8 19C9 24 14 26.5 19 25.5C22.5 24.5 24.5 22 25 19.5"
        stroke="url(#sc-logo-gradient-1)"
        strokeWidth="3.5"
        strokeLinecap="round"
        filter="url(#sc-glow)"
      />

      {/* S Shape (representing software/spark) */}
      <path
        d="M13.5 11.5C14.5 10.2 16.2 9.8 17.8 10.5C19.5 11.2 20 12.8 19.2 14.5C18.2 16.5 13.8 16.5 12.8 18.5C12 20.2 12.5 21.8 14.2 22.5C15.8 23.2 17.5 22.8 18.5 21.5"
        stroke="url(#sc-logo-gradient-2)"
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#sc-glow)"
      />
      
      {/* Central Spark */}
      <circle cx="16" cy="16" r="2" fill="#ffffff" />
    </svg>
  );
}

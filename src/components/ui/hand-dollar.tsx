import React from 'react';

export const HandDollar = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => {
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Hand paths */}
      <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
      <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
      <path d="m2 16 6 6" />

      {/* Dollar sign 1 (larger, right) */}
      <g transform="translate(11.5, 1) scale(0.45)">
        <line x1="12" x2="12" y1="2" y2="22" vectorEffect="non-scaling-stroke" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" vectorEffect="non-scaling-stroke" />
      </g>

      {/* Dollar sign 2 (smaller, left) */}
      <g transform="translate(3, 1) scale(0.35)">
        <line x1="12" x2="12" y1="2" y2="22" vectorEffect="non-scaling-stroke" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
});

HandDollar.displayName = 'HandDollar';

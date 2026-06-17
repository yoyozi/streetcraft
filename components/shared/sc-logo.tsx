import { cn } from '@/lib/utils';

interface ScLogoProps {
  size?: 'sm' | 'lg';
  className?: string;
}

export default function ScLogo({ size = 'sm', className }: ScLogoProps) {
  return (
    <div className={cn('text-chart-2 transition-all hover:scale-105 shrink-0', className)}>
      <svg
        viewBox="0 0 48 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={size === 'lg' ? 'h-16 w-16' : 'h-10 w-10'}
        aria-label="StreetCraft"
      >
        {/* Roof */}
        <polygon points="24,2 47,23 1,23" fill="currentColor" />
        {/* House body */}
        <rect x="4" y="23" width="40" height="27" rx="2" fill="currentColor" />
        {/* SC inside house */}
        <text
          x="24"
          y="43"
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize="17"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          fill="white"
        >
          SC
        </text>
      </svg>
    </div>
  );
}

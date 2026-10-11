/*
 * Logo Vyen — nguồn duy nhất cho dấu hiệu thương hiệu Vyen.
 */
import React, { useId } from 'react';

const MARK_D =
  'M 16 6.4 C 18.2 5 20 4.4 22.2 4.4 C 25.6 4.4 28.5 7.4 28.5 11.8 C 28.5 14.5 27.2 16.5 26.2 17.5 C 25.2 18.2 25.2 18.8 26.2 19.5 C 27.2 20.5 28 22.2 27 24.2 C 25.8 26.5 23.5 27.5 20.5 27.5 C 18.5 27.5 17.2 26.8 16 25.6 C 14.8 26.8 13.5 27.5 11.5 27.5 C 8.5 27.5 6.2 26.5 5 24.2 C 4 22.2 4.8 20.5 5.8 19.5 C 6.8 18.8 6.8 18.2 5.8 17.5 C 4.8 16.5 3.5 14.5 3.5 11.8 C 3.5 7.4 6.4 4.4 9.8 4.4 C 12 4.4 13.8 5 16 6.4 Z';

const INNER_D =
  'M 16 9.5 C 17.8 8.4 19.2 8 20.8 8 C 23.2 8 25.2 10 25.2 13 C 25.2 14.8 24.2 16.2 23.5 17 C 23 17.5 23 18 23.5 18.5 C 24.2 19.2 24.8 20.5 24 22 C 23.2 23.5 21.5 24.2 19.5 24.2 C 18 24.2 17 23.8 16 22.8 C 15 23.8 14 24.2 12.5 24.2 C 10.5 24.2 8.8 23.5 8 22 C 7.2 20.5 7.8 19.2 8.5 18.5 C 9 18 9 17.5 8.5 17 C 7.8 16.2 6.8 14.8 6.8 13 C 6.8 10 8.8 8 11.2 8 C 12.8 8 14.2 8.4 16 9.5 Z';

export interface VyenMarkProps {
  size?: number;
  className?: string;
  variant?: 'mark' | 'full' | 'mono';
}

/** Dấu hiệu thương hiệu Vyen (cánh bướm vi mạch). */
export function VyenMark({ size = 16, className, variant }: VyenMarkProps) {
  const id = useId();
  const resolvedVariant = variant ?? (size >= 48 ? 'full' : 'mark');

  if (resolvedVariant === 'mono') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className={className}
      >
        <path
          d={MARK_D}
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="11.5" y1="13.5" x2="14.6" y2="13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="11.5" cy="13.5" r="1.6" fill="currentColor" />
        <line x1="17.4" y1="13.5" x2="20.5" y2="13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="20.5" cy="13.5" r="1.6" fill="currentColor" />
        <line x1="12.5" y1="19.5" x2="19.5" y2="19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12.5" cy="19.5" r="1.6" fill="currentColor" />
        <circle cx="19.5" cy="19.5" r="1.6" fill="currentColor" />
      </svg>
    );
  }

  if (resolvedVariant === 'full') {
    const outerGrad = `vyen-mark-full-outer-${id}`;
    const innerGrad = `vyen-mark-full-inner-${id}`;
    const leftEyeGrad = `vyen-mark-eye-left-${id}`;
    const rightEyeGrad = `vyen-mark-eye-right-${id}`;

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className={className}
      >
        <defs>
          <linearGradient id={outerGrad} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgb(107, 210, 101)" />
            <stop offset="100%" stopColor="rgb(17, 131, 95)" />
          </linearGradient>
          <linearGradient id={innerGrad} x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgb(140, 229, 135)" />
            <stop offset="100%" stopColor="rgb(19, 135, 98)" />
          </linearGradient>
          <linearGradient id={leftEyeGrad} x1="11.5" y1="13.5" x2="14.6" y2="13.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgb(17, 131, 95)" />
            <stop offset="100%" stopColor="rgb(107, 210, 101)" />
          </linearGradient>
          <linearGradient id={rightEyeGrad} x1="17.4" y1="13.5" x2="20.5" y2="13.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgb(107, 210, 101)" />
            <stop offset="100%" stopColor="rgb(17, 131, 95)" />
          </linearGradient>
        </defs>
        <path
          d={MARK_D}
          stroke={`url(#${outerGrad})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={INNER_D}
          stroke={`url(#${innerGrad})`}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <line x1="11.5" y1="13.5" x2="14.6" y2="13.5" stroke={`url(#${leftEyeGrad})`} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="11.5" cy="13.5" r="1.6" fill="rgb(17, 131, 95)" />
        <line x1="17.4" y1="13.5" x2="20.5" y2="13.5" stroke={`url(#${rightEyeGrad})`} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="20.5" cy="13.5" r="1.6" fill="rgb(17, 131, 95)" />
        <line x1="12.5" y1="19.5" x2="19.5" y2="19.5" stroke="rgb(17, 131, 95)" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12.5" cy="19.5" r="1.6" fill="rgb(17, 131, 95)" />
        <circle cx="19.5" cy="19.5" r="1.6" fill="rgb(17, 131, 95)" />
      </svg>
    );
  }

  const gradId = `vyen-mark-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgb(107, 210, 101)" />
          <stop offset="100%" stopColor="rgb(17, 131, 95)" />
        </linearGradient>
      </defs>
      <path
        d={MARK_D}
        stroke={`url(#${gradId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="11.5" y1="13.5" x2="14.6" y2="13.5" stroke="rgb(17, 131, 95)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="11.5" cy="13.5" r="1.6" fill="rgb(17, 131, 95)" />
      <line x1="17.4" y1="13.5" x2="20.5" y2="13.5" stroke="rgb(17, 131, 95)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="20.5" cy="13.5" r="1.6" fill="rgb(17, 131, 95)" />
      <line x1="12.5" y1="19.5" x2="19.5" y2="19.5" stroke="rgb(17, 131, 95)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12.5" cy="19.5" r="1.6" fill="rgb(17, 131, 95)" />
      <circle cx="19.5" cy="19.5" r="1.6" fill="rgb(17, 131, 95)" />
    </svg>
  );
}

// Alias for backwards compatibility across existing components
export const PiMark = VyenMark;

export interface VyenLogoProps {
  /** `sm` cho sidebar, `lg` cho empty state. */
  size?: 'sm' | 'lg';
  /** Hiển thị chữ "Vyen" bên cạnh (sm) hoặc bên dưới (lg). */
  withWordmark?: boolean;
  className?: string;
}

/** Dấu hiệu + wordmark, dùng ở sidebar và trạng thái rỗng. */
export function VyenLogo({ size = 'sm', withWordmark = true, className }: VyenLogoProps) {
  const isLarge = size === 'lg';

  const tile = (
    <div
      className={
        isLarge
          ? 'relative flex h-16 w-16 items-center justify-center rounded-lg bg-raised border border-subtle'
          : 'relative flex h-8 w-8 items-center justify-center rounded-lg bg-raised border border-subtle'
      }
    >
      <VyenMark size={isLarge ? 34 : 16} />
    </div>
  );

  if (!withWordmark) return <div className={className}>{tile}</div>;

  if (isLarge) {
    return (
      <div className={`flex flex-col items-center ${className ?? ''}`}>
        {tile}
        <div className="mt-4 flex items-center gap-2">
          <span className="uic text-[32px] font-bold tracking-[0.05em] text-text-primary">Vyen</span>
          <span className="rounded-full border border-subtle bg-raised px-2 py-0.5 uic text-meta uppercase tracking-[0.08em] text-accent">
            agent
          </span>
        </div>
        <div className="mt-1 uic text-meta uppercase tracking-[0.08em] text-text-muted">
          AI Innovations
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      {tile}
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="uic text-[16px] font-bold tracking-[0.05em] text-text-primary">Vyen</span>
          <span className="rounded-full border border-subtle bg-raised px-2 py-0.5 uic text-micro uppercase tracking-[0.08em] text-accent">
            v0.1
          </span>
        </div>
        <div className="uic text-[9.5px] uppercase tracking-[0.08em] text-text-muted">
          AI Innovations
        </div>
      </div>
    </div>
  );
}

export const PiLogo = VyenLogo;

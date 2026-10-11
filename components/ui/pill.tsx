import type { ReactNode } from 'react';

type PillTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
type PillSize = 'sm' | 'md';

interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  size?: PillSize;
  /** Chấm trạng thái đi trước chữ — cùng ngữ nghĩa với `status` của disclosure-row. */
  dot?: boolean;
  /** Bật thì vẽ nút X ở mép phải. `removeLabel` là tên nút X cho trình đọc màn hình. */
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}

/**
 * Nền/chữ theo tông. Nền là bản nhạt của chính màu chữ (`/15`), nên chip đọc
 * được là "thuộc hệ màu nào" chứ không phải một ô màu trôi lơ lửng.
 */
const TONE: Record<PillTone, string> = {
  neutral: 'bg-raised text-secondary',
  accent: 'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
};

const DOT_TONE: Record<PillTone, string> = {
  neutral: 'bg-disabled',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

/** sm 18px · md 22px — chip là THẺ NHỎ, bo tròn 9999px đọc ra viên thuốc. */
const SIZE: Record<PillSize, string> = {
  sm: 'h-[18px] gap-1 px-1.5 text-micro',
  md: 'h-[22px] gap-1.5 px-2 text-meta',
};

/**
 * Chip trạng thái nhỏ. Component SERVER — không `"use client"`.
 *
 * Không viền: chip có màu nền riêng đã đủ tách khỏi nền; thêm viền là dựng
 * thành ô trống và làm hàng chip nặng đi (xem `.evidence-badge.tsx`).
 */
export function Pill({
  children,
  tone = 'neutral',
  size = 'md',
  dot = false,
  onRemove,
  removeLabel = 'Xoá',
  className = '',
}: PillProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full font-sans ${TONE[tone]} ${SIZE[size]} ${className}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${DOT_TONE[tone]}`} />
      )}
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="ml-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-current transition-colors duration-150 hover:bg-danger/10 hover:text-danger"
        >
          {/* X vẽ tay thay vì import icon: chip chỉ cần một nét, thêm icon vào
              primitive là kéo lucide-react vào mọi cây dùng chip. */}
          <svg
            width="9"
            height="9"
            viewBox="0 0 9 9"
            aria-hidden="true"
            focusable="false"
            className="shrink-0"
          >
            <path
              d="M1 1 L8 8 M8 1 L1 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
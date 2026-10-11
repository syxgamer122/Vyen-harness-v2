import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * BẮT BUỘC. Nút chỉ có icon thì trình đọc màn hình đọc ra "nút" — mà không
   * có tên nghĩa được gì. Đây là prop BẮT BUỘC (không `?`) để TypeScript chặn
   * call site quên, thay vì chỉ ghi `aria-label` ở chỗ dùng.
   */
  label: string;
  icon: ReactNode;
  size?: IconButtonSize;
  /** Bật thì nền hover chuyển sang `danger/10` + chữ `danger` (`.icon-btn-danger`). */
  danger?: boolean;
  /** Khai lại vì `ButtonHTMLAttributes` không mang `ref` — xem `button.tsx`. */
  ref?: Ref<HTMLButtonElement>;
}

/** sm 28px · md 32px · lg 36px — khớp `.icon-btn-sm` / `.icon-btn-md`. */
const SIZE: Record<IconButtonSize, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-9 w-9',
};

/**
 * Nút CHỈ CÓ ICON. Component SERVER — không `"use client"`.
 *
 * Bo góc `rounded-md` ghi tường minh, không thừa kế từ recipe: primitive phải
 * đứng vững một mình, không phụ thuộc globals có còn class `.icon-btn` hay không.
 */
export function IconButton({
  label,
  icon,
  size = 'md',
  danger = false,
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-md transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 ${
        danger ? 'text-tertiary hover:bg-danger/10 hover:text-danger' : 'text-tertiary hover:bg-raised hover:text-primary'
      } ${SIZE[size]} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
}
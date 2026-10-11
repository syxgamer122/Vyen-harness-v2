import type { ButtonHTMLAttributes, Ref } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Khai LẠI `ref` có chủ đích. `ButtonHTMLAttributes` không mang `ref` (React
   * để nó ở `ClassAttributes`), nên không khai thì call site truyền `ref` bị
   * TypeScript chặn — và chặn đúng, vì primitive còn phải gắn nó vào thẻ
   * `<button>` thật bên dưới.
   */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Bốn biến thể, bám đúng `.btn-primary` / `.btn-secondary` trong globals.css.
 *
 * `primary` tô đặc, chữ lấy `on-fill` — KHÔNG dùng trắng tinh: token chữ tối
 * nhất của hệ cũng chỉ tới `#e8eaed`, còn trắng tinh đặt lên nền tô là lỗi
 * tương phản kinh điển. `ghost` không có viền: nút phụ không được vẽ thành
 * khối control.
 *
 * Mọi biến thể có viền đều mang class MÀU viền cùng bề rộng — viền trần kế
 * thừa `#e5e7eb` từ preflight Tailwind (xem `tests/design-system.test.ts`).
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary: 'border border-transparent bg-primary text-on-fill hover:bg-strong',
  secondary: 'border border-default bg-surface text-primary hover:bg-raised',
  ghost: 'text-secondary hover:bg-raised hover:text-primary',
  danger: 'border border-transparent bg-danger text-on-fill hover:bg-strong',
};

/** sm 32px · md 36px · lg 40px — khớp `.icon-btn-sm/md` ở đường kích thước. */
const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-ui',
  md: 'h-9 gap-2 px-3.5 text-ui',
  lg: 'h-10 gap-2 px-4 text-ui',
};

/**
 * Nút chính của hệ. Component SERVER — không `"use client"`.
 *
 * React 19 cho `ref` đi qua prop như mọi prop khác (không còn `forwardRef`);
 * khai `ref` trong `ButtonProps` là để TypeScript cho phép, `...rest` loại
 * nó ra khỏi object rồi gắn vào thẻ `<button>` thật.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg font-sans font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    />
  );
}
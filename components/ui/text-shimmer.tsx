import type { ReactNode } from 'react';

interface TextShimmerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Vệt sáng chạy qua nhãn "đang làm", KHÔNG thay chữ thật.
 *
 * Thật ra chữ luôn nằm trong DOM và luôn chọn được; lớp vệt là một BẢN SAO
 * `aria-hidden` nằm chồng lên, chỉ hiện phần nằm trong cửa sổ mask và quét ngang
 * bằng `steps(48, end)`. Nếu thay chữ thật bằng gradient thì người dùng bấm
 * chuột chọn sẽ không copy được gì — mà nhãn trạng thái lại đúng là thứ hay
 * được copy để dán vào ticket.
 *
 * `@keyframes` + `mask-*` đặt ở thẻ `<style>` do chính component render với
 * `href` + `precedence` (React 19): dù đây là primitive server, React tự gộp
 * về một thẻ duy nhất trong `<head>` dù bao nhiêu instance. globals.css không
 * sửa được trong đợt này, nên đây là đường điện duy nhất mà không cần dep mới.
 *
 * CỬA SỔ mask 300% rộng, quét từ 150% xuống -50% → vệt đi hết chữ rồi quay lại.
 */
const SHIMMER_CSS = `
@keyframes vyen-shimmer-sweep {
  from { -webkit-mask-position: 150% 0; mask-position: 150% 0; }
  to { -webkit-mask-position: -50% 0; mask-position: -50% 0; }
}
.vyen-shimmer-sweep {
  -webkit-mask-image: linear-gradient(90deg, transparent 35%, rgb(0 0 0) 50%, transparent 65%);
  mask-image: linear-gradient(90deg, transparent 35%, rgb(0 0 0) 50%, transparent 65%);
  -webkit-mask-size: 300% 100%;
  mask-size: 300% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  background-image: linear-gradient(90deg, rgb(var(--text-secondary)), rgb(var(--accent)));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: vyen-shimmer-sweep 1.5s steps(48, end) infinite;
}
@media (prefers-reduced-motion: reduce) {
  .vyen-shimmer-sweep { animation: none; display: none; }
}
`;

/**
 * Nhãn đang xử lý — cỡ chữ và màu đặt trên CHỖ CHỨA để bản sao vệt kế thừa
 * đúng cùng bộ chữ; đặt riêng ở từng nhánh là bản sao lệch cỡ với chữ thật.
 */
export function TextShimmer({ children, className = '' }: TextShimmerProps) {
  return (
    <span className={`relative inline-flex text-meta text-tertiary ${className}`}>
      <style href="vyen-text-shimmer" precedence="vyen-text-shimmer">
        {SHIMMER_CSS}
      </style>
      <span>{children}</span>
      <span
        aria-hidden="true"
        className="vyen-shimmer-sweep pointer-events-none absolute inset-0 whitespace-nowrap select-none"
      >
        {children}
      </span>
    </span>
  );
}
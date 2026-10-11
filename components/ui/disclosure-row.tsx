import type { ReactNode } from 'react';

export type DisclosureStatus = 'idle' | 'running' | 'success' | 'warning' | 'error';

interface DisclosureRowProps {
  /** Icon 14px trong ô 16px — truyền vào, primitive KHÔNG tự import icon. */
  icon?: ReactNode;
  title: string;
  summary?: ReactNode;
  status?: DisclosureStatus;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Màu chấm trạng thái. `running` không dùng chấm — nó đổi sang vòng quay ở
 * nhánh render bên dưới, để một trạng thái chỉ mang MỘT tín hiệu.
 */
const DOT_TONE: Record<DisclosureStatus, string> = {
  idle: 'bg-disabled',
  running: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-danger',
};

/**
 * Hàng 24px — MỘT đường thông tin, không phải một thẻ.
 *
 * Nên hàng KHÔNG có nền và KHÔNG có viền: giữa những hàng lặp lại, đường ngăn
 * ở đâu đó phải là chữ chứ không phải ô trống. Hover chỉ đổi MÀU CHỮ một bậc
 * (tertiary → secondary) chứ không thêm lớp trộn — thêm nền ở hàng 24px là
 * dựng thành từng dải sáng, đọc như bảng kẻ sọc chứ không như phản hồi.
 */
export function DisclosureRow({
  icon,
  title,
  summary,
  status = 'idle',
  trailing,
  onClick,
  className = '',
}: DisclosureRowProps) {
  const rowClass = `group flex h-6 w-full items-center gap-1.5 text-body ${className}`;

  const body = (
    <>
      {icon && (
        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-tertiary">
          {icon}
        </span>
      )}
      {/* Ô chấm 10px, chấm 6px — chấm có `rounded-full` tường minh vì globals
          ghim `[class*="rounded-full"]` cho bo tròn tròn. */}
      <span
        className="flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center"
        aria-hidden="true"
      >
        {status === 'running' ? (
          <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        ) : (
          <span className={`h-1.5 w-1.5 rounded-full ${DOT_TONE[status]}`} />
        )}
      </span>
      {status === 'running' && <span className="sr-only">Đang chạy</span>}
      <span className="truncate font-normal text-tertiary transition-colors duration-150 group-hover:text-secondary">
        {title}
      </span>
      {summary && <span className="truncate text-meta text-tertiary">{summary}</span>}
      {trailing && (
        <span className="ml-auto flex flex-shrink-0 items-center gap-1.5">{trailing}</span>
      )}
    </>
  );

  /* Có onClick thì là nút THẬT: bàn phím bấm được, Enter/Space bấm được,
     `:focus-visible` của globals vẽ đúng vòng quanh hàng. */
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`text-left ${rowClass}`}>
        {body}
      </button>
    );
  }

  return <div className={rowClass}>{body}</div>;
}
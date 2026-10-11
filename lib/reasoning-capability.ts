/**
 * Reasoning capability — đọc metadata suy luận của model từ /v1/models.
 *
 * Hai dạng đều được chấp nhận:
 *  - OpenRouter: `supported_parameters` chứa "reasoning" + object `reasoning`
 *    (`mandatory` + `supported_efforts`) → biết chính xác model nào nhận mức nào.
 *  - Gateway tổng hợp (9router & tương tự): `capabilities.reasoning` +
 *    `capabilities.thinkingCanDisable` + `capabilities.thinkingRange` →
 *    xem `parseCapabilitiesShape`.
 *
 * File này THUẦN, không import runtime gì ngoài type — dùng được cả client
 * lẫn edge route.
 */

import type { ThinkingLevel } from '@/lib/provider-url';

export interface ReasoningCapability {
  /**
   * Các mức của Vyen (low/medium/high/max) mà model khai báo hỗ trợ.
   * Mảng rỗng = model chỉ bật/tắt suy luận (không chọn được mức) — gửi mức
   * nào cũng được, gateway tự dịch.
   */
  efforts: ThinkingLevel[];
  /** Model BẮT BUỘC suy luận — không có chế độ tắt. */
  mandatory: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const VYEN_LEVELS: readonly ThinkingLevel[] = ['low', 'medium', 'high', 'max'];

/**
 * Phân tích một entry model từ response /v1/models.
 * Trả null khi không khai báo hỗ trợ reasoning (hoặc dữ liệu không đọc được)
 * — caller giữ hành vi cũ cho model đó.
 */
export function parseModelReasoning(item: unknown): ReasoningCapability | null {
  if (!isRecord(item)) return null;

  const capabilities = parseCapabilitiesShape(item);
  if (capabilities) return capabilities;

  const supportedParameters = Array.isArray(item.supported_parameters)
    ? item.supported_parameters
    : [];
  if (!supportedParameters.includes('reasoning')) return null;
  if (!isRecord(item.reasoning)) return null;

  const mandatory = item.reasoning.mandatory === true;
  const rawEfforts = item.reasoning.supported_efforts;

  // supported_efforts === null: hỗ trợ MỌI mức chuẩn → map đủ 4 mức Vyen.
  if (rawEfforts === null) {
    return { efforts: [...VYEN_LEVELS], mandatory };
  }

  if (Array.isArray(rawEfforts)) {
    const lowered = new Set(
      rawEfforts.filter((e): e is string => typeof e === 'string').map((e) => e.toLowerCase()),
    );
    const efforts = VYEN_LEVELS.filter((level) => lowered.has(level));
    // Khai báo có reasoning nhưng không khớp mức nào của Vyen (vd chỉ
    // "minimal"/"xhigh") → coi như toggle-only: gửi mức nào cũng dịch được.
    return { efforts, mandatory };
  }

  // Có object reasoning nhưng KHÔNG khai báo efforts (undefined/kiểu lạ):
  // semantics prime-agent — chỉ bật/tắt, không chọn được mức.
  return { efforts: [], mandatory };
}

/**
 * Dạng metadata của các gateway tổng hợp (9router và tương tự): capability
 * nằm trong `capabilities` thay vì `supported_parameters` + `reasoning`.
 *
 * Vì sao phải nhận: `/v1/models` của 9router trả
 * `capabilities: { reasoning: true, thinkingCanDisable, thinkingRange, ... }`
 * và KHÔNG có `supported_parameters` — parser cũ lọt qua cổng
 * `supported_parameters.includes('reasoning')` rồi trả `null`, khiến
 * `modelReasoningCap` là null và `shouldShowThinkingControl` giấu hẳn nút
 * chỉnh mức suy luận trên mọi model của gateway đó.
 *
 * Nguyên tắc: chỉ tin cờ `reasoning` và `thinkingCanDisable` mà gateway gửi;
 * KHÔNG suy đoán từ tên model (model tên ngẫu nhiên không đáng tin).
 *
 * `thinkingRange` thiếu (gateway không khai danh sách mức) KHÔNG phải là "model
 * không có mức nào" — nó là CHƯA KHAI, khác hẳn `reasoning: false` là model
 * không suy luận. Coi thiếu là không có mức sẽ rơi về toggle-only, mà
 * `shouldShowThinkingControl` cố ý ẨN (xem quy tắc ở chính hàm đó) — nghĩa
 * là gateway khai "model này suy luận được" lại vẫn không cho chỉnh mức. Vì vậy
 * thiếu `thinkingRange` ở đây map đủ 4 mức: đây là cờ gateway nói model chịu
 * tham số effort, và `resolveNearestEffort` vẫn giữ mức người dùng chọn.
 *
 * Hệ quả đã chấp nhận: nếu một gateway khai `reasoning: true` nhưng thực tế
 * không nhận `reasoning_effort`, model có thể báo lỗi tham số. Đổi lại người
 * dùng luôn có nút chỉnh. Chọn hướng này vì im lặng (ẩn nút) tệ hơn lỗi thấy
 * được — và chỉ áp cho dạng `capabilities` có cờ tường minh, không suy đoán.
 */
function parseCapabilitiesShape(item: Record<string, unknown>): ReasoningCapability | null {
  if (!isRecord(item.capabilities)) return null;
  if (item.capabilities.reasoning !== true) return null;

  /* `thinkingCanDisable: false` = model luôn suy luận, không có chế độ tắt
     → `mandatory` đúng nghĩa, nút phải hiện để nói rõ điều đó. Trường thiếu
     thì coi như KHÔNG bắt buộc: im lặng về chế độ tắt hơn là bịa ra ràng buộc. */
  const mandatory = item.capabilities.thinkingCanDisable === false;

  /* `thinkingRange` khai đúng danh sách mức thì tôn trọng nó. */
  const range = item.capabilities.thinkingRange;
  if (Array.isArray(range)) {
    const lowered = new Set(
      range.filter((e): e is string => typeof e === 'string').map((e) => e.toLowerCase()),
    );
    return { efforts: VYEN_LEVELS.filter((level) => lowered.has(level)), mandatory };
  }

  return { efforts: [...VYEN_LEVELS], mandatory };
}

/** true nếu `candidate` là mức gần `requested` nhất trong danh sách hỗ trợ. */
function distance(a: ThinkingLevel, b: ThinkingLevel): number {
  return Math.abs(VYEN_LEVELS.indexOf(a) - VYEN_LEVELS.indexOf(b));
}

/**
 * Có nên HIỆN điều khiển mức suy luận cho model này không?
 *
 * Đây là chỗ sửa lỗi "thinking slider giả với mọi model". Nhiều gateway trả
 * metadata kiểu OpenRouter với `reasoning: {}` cho MỌI model; `parseModelReasoning`
 * biến nó thành `{ efforts: [], mandatory: false }` — khác `null`, nên trước đây
 * `modelReasoningCap` truthy và menu vẫn hiện. Rồi tầng UI coi `efforts.length === 0`
 * là "hỗ trợ cả 4 mức" (`thinking-menu.tsx` — `isLevelSupported`) nên hiện đủ
 * Thấp/Trung bình/Cao/Tối đa cho một model thực chất chỉ bật/tắt suy luận.
 *
 * Quy tắc:
 *  - Không có metadata (`null`) → ẩn: không biết gì thì không giả vờ biết.
 *  - `efforts.length > 0` → hiện: model chọn được mức thật.
 *  - `mandatory === true` → hiện: cần nói rõ model luôn suy luận, không tắt được.
 *  - `{ efforts: [], mandatory: false }` (toggle-only) → **ẩn**: không có mức nào
 *    để chọn, slider 4 mức chỉ là trang trí.
 */
export function shouldShowThinkingControl(
  cap: ReasoningCapability | null | undefined,
): boolean {
  if (!cap) return false;
  return cap.efforts.length > 0 || cap.mandatory;
}


/**
 * Chọn mức sẽ gửi upstream: đúng mức yêu cầu nếu được hỗ trợ, ngược lại mức
 * GẦN NHẤT theo thang low→max. Toggle-only (efforts rỗng) hoặc danh sách trống
 * → gửi nguyên mức yêu cầu.
 */
export function resolveNearestEffort(
  requested: ThinkingLevel,
  cap: ReasoningCapability | null | undefined,
): ThinkingLevel {
  if (!cap || cap.efforts.length === 0) return requested;
  if (cap.efforts.includes(requested)) return requested;
  // Mức gần requested hơn thì thắng; hòa nhau giữ mức đứng TRƯỚC trong danh sách.
  return cap.efforts.reduce((best, level) =>
    distance(level, requested) < distance(best, requested) ? level : best,
  );
}

/**
 * Mixture-of-models routing theo hạng mục công việc.
 *
 * Mỗi hạng mục (Category) ánh xạ sang một chuỗi dự phòng (Chain) các entry { model, effort }.
 * Người dùng có thể cấu hình chuỗi này trong Settings -> Routing hoặc override qua file JSON.
 * HUD hiển thị: category:name(model:effort).
 */

import { enforceContractEffort, resolveContract, EFFORT_LEVELS, type Effort } from '@/lib/model-contracts';

export type { Effort };

export type CategoryId =
  | 'ultrabrain'
  | 'deep'
  | 'architect'
  | 'capable'
  | 'quick'
  | 'writing'
  | 'visual-engineering'
  | 'simple-work';

export interface ChainEntry {
  model: string;
  effort: Effort;
}

export interface RouteReceipt {
  category: CategoryId;
  selected: ChainEntry;
  chainPosition: number;
  signals: string[];
  effortChange?: { kind: 'floor_raised' | 'unsupported_dropped'; from: Effort; to: Effort };
}

/**
 * Chuỗi dự phòng theo hạng mục — KHÔNG có giá trị mặc định.
 *
 * BYOK 100%: app không ship model nào, nên không có "chuỗi mặc định" hợp lệ
 * để điền vào. Người dùng tự khai chuỗi cho từng hạng mục ở Cài đặt → Định
 * tuyến (hoặc nạp từ file JSON). Hạng mục chưa khai báo → route trả lỗi
 * `MODEL_REQUIRED`, không âm thầm dùng model bất kỳ.
 */
export const DEFAULT_CHAINS: Record<CategoryId, ChainEntry[]> = {
  ultrabrain: [],
  architect: [],
  deep: [],
  capable: [],
  quick: [],
  writing: [],
  'visual-engineering': [],
  'simple-work': [],
};

/**
 * Hạng mục có chuỗi model thật để dùng không: lấy chuỗi đã cấu hình của
 * người dùng, không thì rỗng. Dùng để quyết định có route theo hạng mục hay
 * không — chuỗi rỗng thì resolveRoute không có gì để chọn.
 */
export function categoryChainHasModel(
  category: CategoryId,
  customChains?: Partial<Record<CategoryId, ChainEntry[]>>,
): boolean {
  const chain = customChains?.[category];
  return Boolean(chain && chain.length > 0);
}

/**
 * Nhãn hiển thị mô tả cho từng hạng mục trong UI.
 *
 * CHỈ `label`/`description` là copy và được dịch. Key hạng mục là hợp đồng đã
 * lưu: `validateModelChains` và settings store tra theo đúng key này, nên
 * đổi key là âm thầm xoá cấu hình của người dùng.
 */
export const CATEGORY_DESCRIPTIONS: Record<CategoryId, { label: string; description: string }> = {
  ultrabrain: {
    label: 'Ultrabrain',
    description: 'Bài toán hóc búa, suy luận tối đa, giải thuật phức tạp',
  },
  architect: {
    label: 'Kiến trúc',
    description: 'Thiết kế hệ thống, sửa nhiều file, chế độ lập kế hoạch',
  },
  deep: {
    label: 'Suy luận sâu',
    description: 'Tìm nguyên nhân gốc rễ, logic và toán học, phân tích lỗi',
  },
  capable: {
    label: 'Năng lực chuẩn',
    description: 'Lập trình thông thường, giải quyết tính năng cân bằng',
  },
  quick: {
    label: 'Nhanh',
    description: 'Sửa lỗi nhỏ, đổi tên 1 file, phản hồi tức thì',
  },
  writing: {
    label: 'Viết tài liệu',
    description: 'Viết README, tài liệu, dịch thuật, giải thích văn xuôi',
  },
  'visual-engineering': {
    label: 'Giao diện & Mỹ thuật',
    description: 'CSS, Tailwind, bố cục, component giao diện, soi bằng mắt',
  },
  'simple-work': {
    label: 'Tác vụ đơn giản',
    description: 'Kiểm tra cú pháp, format văn bản, tác vụ phụ trợ nhẹ nhất',
  },
};

export const ALL_CATEGORIES: readonly CategoryId[] = [
  'ultrabrain',
  'deep',
  'architect',
  'capable',
  'quick',
  'writing',
  'visual-engineering',
  'simple-work',
] as const;

/**
 * Phân giải RouteReceipt cho một hạng mục cụ thể:
 * - Chọn entry ở thứ tự chainPosition (mặc định 0)
 * - Nếu entry đầu bị lỗi (404/not found), caller tăng chainPosition để fallback
 * - Áp dụng sàn effort từ ModelContract nếu có
 *
 * Chuỗi rỗng (hạng mục chưa khai) → null. Caller phải xử lý trước khi gọi,
 * đây không phải đường lỗi bình thường.
 */
export function resolveRoute(
  category: CategoryId,
  options?: {
    customChains?: Partial<Record<CategoryId, ChainEntry[]>>;
    position?: number;
    signals?: string[];
  },
): RouteReceipt | null {
  const chains = options?.customChains?.[category];
  if (!chains || chains.length === 0) return null;

  const requestedPos = Math.max(0, Math.floor(options?.position ?? 0));
  const safePos = Math.min(requestedPos, chains.length - 1);
  const entry = chains[safePos]!;

  const contract = resolveContract(entry.model);
  const { effectiveEffort, changed } = enforceContractEffort(contract, entry.effort);

  return {
    category,
    selected: {
      model: entry.model,
      effort: effectiveEffort,
    },
    chainPosition: safePos,
    signals: options?.signals ?? [],
    ...(changed ? { effortChange: changed } : {}),
  };
}

/**
 * Xác thực và chuẩn hóa cấu hình chuỗi modelChains nhập từ JSON.
 * Ném lỗi rõ ràng nếu payload bị hỏng hoặc sai cấu trúc để bảo vệ settings store.
 */
export function validateModelChains(input: unknown): Record<CategoryId, ChainEntry[]> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('Dữ liệu cấu hình phải là một JSON Object.');
  }

  const validCategories = new Set(ALL_CATEGORIES);
  const validEfforts = new Set(EFFORT_LEVELS);
  const result: Record<CategoryId, ChainEntry[]> = { ...DEFAULT_CHAINS };
  let importedCount = 0;

  for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
    if (!validCategories.has(key as CategoryId)) continue;
    if (!Array.isArray(val) || val.length === 0) {
      throw new Error(`Hạng mục "${key}" phải là mảng chứa ít nhất 1 chuỗi model:effort.`);
    }

    const validatedEntries: ChainEntry[] = [];
    for (const item of val) {
      if (typeof item !== 'object' || item === null) {
        throw new Error(`Entry trong hạng mục "${key}" không đúng định dạng.`);
      }
      const model = String((item as any).model ?? '').trim();
      const effort = String((item as any).effort ?? '').toLowerCase() as Effort;
      if (!model) {
        throw new Error(`Hạng mục "${key}" có entry thiếu tên model.`);
      }
      if (!validEfforts.has(effort)) {
        throw new Error(`Mức effort "${effort}" trong "${key}" không hợp lệ (chỉ chấp nhận low/medium/high/max).`);
      }
      validatedEntries.push({ model, effort });
    }

    result[key as CategoryId] = validatedEntries;
    importedCount++;
  }

  if (importedCount === 0) {
    throw new Error('Không tìm thấy cấu hình hạng mục hợp lệ nào trong file JSON.');
  }

  return result;
}

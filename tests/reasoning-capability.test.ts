import { describe, expect, it } from 'vitest';
import { parseModelReasoning, resolveNearestEffort, shouldShowThinkingControl } from '@/lib/reasoning-capability';
import { normalizeProviderModels, type ThinkingLevel } from '@/lib/provider-url';

describe('parseModelReasoning — metadata kiểu OpenRouter', () => {
  it('không khai báo reasoning -> null', () => {
    expect(parseModelReasoning({ id: 'a', supported_parameters: ['tools'] })).toBeNull();
    expect(parseModelReasoning({ id: 'a' })).toBeNull();
    expect(parseModelReasoning('string')).toBeNull();
    expect(parseModelReasoning(null)).toBeNull();
  });

  it('reasoning object + supported_efforts mảng -> lọc về 4 mức Vyen', () => {
    const cap = parseModelReasoning({
      id: 'a',
      supported_parameters: ['tools', 'reasoning'],
      reasoning: { mandatory: false, supported_efforts: ['minimal', 'medium', 'xhigh'] },
    });
    expect(cap).toEqual({ efforts: ['medium'], mandatory: false });
  });

  it('supported_efforts null -> đủ 4 mức Vyen', () => {
    const cap = parseModelReasoning({
      supported_parameters: ['reasoning'],
      reasoning: { mandatory: true, supported_efforts: null },
    });
    expect(cap).toEqual({ efforts: ['low', 'medium', 'high', 'max'], mandatory: true });
  });

  it('có reasoning nhưng thiếu supported_efforts -> toggle-only (efforts rỗng)', () => {
    // Semantics prime-agent: undefined ≠ null — chỉ bật/tắt, không chọn mức.
    const cap = parseModelReasoning({
      supported_parameters: ['reasoning'],
      reasoning: { mandatory: true },
    });
    expect(cap).toEqual({ efforts: [], mandatory: true });
  });
});

describe('parseModelReasoning — dạng capabilities của gateway tổng hợp', () => {
  /* Payload thật lấy từ GET http://localhost:20128/v1/models (9router) —
     giữ nguyên để test không trôi khỏi dữ liệu thật. */
  const step5 = {
    id: 'Fledge Step 5',
    object: 'model',
    owned_by: 'combo',
    context_length: 128000,
    max_completion_tokens: 64000,
    capabilities: {
      vision: true, pdf: false, audioInput: false, videoInput: true,
      imageOutput: false, audioOutput: false, search: false, tools: true,
      reasoning: true, thinkingFormat: 'step', thinkingCanDisable: true,
      thinkingRange: null, contextWindow: 128000, maxOutput: 64000,
    },
  };

  it('capabilities.reasoning=true + supported_parameters thiếu -> VẪN nhận (nút phải hiện)', () => {
    // Trước đây: parser lọt qua cổng `supported_parameters.includes('reasoning')`
    // → null → shouldShowThinkingControl false → KHÔNG có nút chỉnh mức.
    const cap = parseModelReasoning(step5);
    expect(cap).toEqual({ efforts: ['low', 'medium', 'high', 'max'], mandatory: false });
    expect(shouldShowThinkingControl(cap)).toBe(true);
  });

  it('gateway không khai thinkingRange -> đủ 4 mức, mức người dùng chọn được giữ', () => {
    // 9router để thinkingRange=null cho MỌI model: coi là CHƯA KHAI, không
    // phải "không có mức nào" — nếu map thành efforts rỗng thì shouldShow-
    // ThinkingControl ẩn nút và người dùng mất hẳn điều khiển.
    const cap = parseModelReasoning(step5);
    expect(resolveNearestEffort('max', cap)).toBe('max');
    expect(resolveNearestEffort('low', cap)).toBe('low');
    expect(resolveNearestEffort('high', cap)).toBe('high');
  });

  it('capabilities.reasoning=false -> null (model không suy luận: ẩn nút)', () => {
    expect(parseModelReasoning({
      id: 'oc/space-bunny-free',
      capabilities: { reasoning: false, thinkingFormat: null, thinkingCanDisable: true, thinkingRange: null },
    })).toBeNull();
  });

  it('thinkingCanDisable=false -> mandatory (luôn suy luận, nút phải hiện)', () => {
    const cap = parseModelReasoning({
      id: 'x',
      capabilities: { reasoning: true, thinkingCanDisable: false, thinkingRange: null },
    });
    expect(cap).toEqual({ efforts: ['low', 'medium', 'high', 'max'], mandatory: true });
    expect(shouldShowThinkingControl(cap)).toBe(true);
  });

  it('thinkingCanDisable thiếu -> coi như KHÔNG bắt buộc (không bịa ràng buộc)', () => {
    expect(parseModelReasoning({
      id: 'x',
      capabilities: { reasoning: true },
    })).toEqual({ efforts: ['low', 'medium', 'high', 'max'], mandatory: false });
  });

  it('thinkingRange là mảng -> tôn trọng danh sách gateway khai', () => {
    const cap = parseModelReasoning({
      id: 'x',
      capabilities: { reasoning: true, thinkingCanDisable: true, thinkingRange: ['LOW', 'HIGH'] },
    });
    expect(cap).toEqual({ efforts: ['low', 'high'], mandatory: false });
    expect(resolveNearestEffort('max', cap)).toBe('high');
    expect(resolveNearestEffort('medium', cap)).toBe('low');
  });

  it('không có capabilities (entry rác) -> null, không ném lỗi', () => {
    expect(parseModelReasoning({ id: 'a' })).toBeNull();
    expect(parseModelReasoning({ id: 'a', capabilities: null })).toBeNull();
    expect(parseModelReasoning({ id: 'a', capabilities: 'nope' })).toBeNull();
    expect(parseModelReasoning({ id: 'a', capabilities: {} })).toBeNull();
  });

  it('dạng OpenRouter cũ KHÔNG bị đổi hành vi', () => {
    expect(parseModelReasoning({
      supported_parameters: ['reasoning'],
      reasoning: { mandatory: true, supported_efforts: null },
    })).toEqual({ efforts: ['low', 'medium', 'high', 'max'], mandatory: true });
  });
});

describe('resolveNearestEffort — chọn mức gần nhất trên thang low→max', () => {
  const cap = { efforts: ['low', 'high'] as ThinkingLevel[], mandatory: false };

  it('đúng mức hỗ trợ -> giữ nguyên', () => {
    expect(resolveNearestEffort('low', cap)).toBe('low');
  });

  it('mức không hỗ trợ -> gần nhất (medium nghiêng về low, max nghiêng về high)', () => {
    expect(resolveNearestEffort('medium', cap)).toBe('low');
    expect(resolveNearestEffort('max', cap)).toBe('high');
  });

  it('toggle-only hoặc null -> gửi nguyên mức yêu cầu', () => {
    expect(resolveNearestEffort('max', { efforts: [], mandatory: true })).toBe('max');
    expect(resolveNearestEffort('max', null)).toBe('max');
    expect(resolveNearestEffort('max', undefined)).toBe('max');
  });
});

describe('shouldShowThinkingControl — chống hiện slider giả', () => {
  /*
   * Bối cảnh: nhiều gateway trả `reasoning: {}` cho MỌI model. `parseModelReasoning`
   * biến nó thành `{ efforts: [], mandatory: false }` — khác `null` — nên trước đây
   * slider vẫn hiện đủ 4 mức dù chọn mức nào cũng không có tác dụng. Đây là lỗi
   * "fake với mọi model".
   */
  it('không có metadata (null/undefined) -> ẩn', () => {
    expect(shouldShowThinkingControl(null)).toBe(false);
    expect(shouldShowThinkingControl(undefined)).toBe(false);
  });

  it('gateway khai reasoning rỗng cho mọi model -> ẨN (đây là ca lỗi chính)', () => {
    // Mô phỏng đúng thứ `parseModelReasoning` trả về cho `reasoning: {}`.
    const cap = parseModelReasoning({
      supported_parameters: ['reasoning'],
      reasoning: {},
    });
    expect(cap).toEqual({ efforts: [], mandatory: false });
    expect(shouldShowThinkingControl(cap)).toBe(false);
  });

  it('model chọn được mức -> hiện', () => {
    expect(shouldShowThinkingControl({ efforts: ['low', 'high'], mandatory: false })).toBe(true);
    expect(
      shouldShowThinkingControl({ efforts: ['low', 'medium', 'high', 'max'], mandatory: false }),
    ).toBe(true);
  });

  it('model bắt buộc suy luận -> hiện (để giải thích không tắt được)', () => {
    expect(shouldShowThinkingControl({ efforts: [], mandatory: true })).toBe(true);
    expect(shouldShowThinkingControl({ efforts: ['high'], mandatory: true })).toBe(true);
  });

  it('toggle-only không bắt buộc -> ẩn (không có mức nào để chọn)', () => {
    expect(shouldShowThinkingControl({ efforts: [], mandatory: false })).toBe(false);
  });
});

describe('normalizeProviderModels tích hợp — bóc kèm reasoning', () => {
  it('response /v1/models chuẩn OpenRouter', () => {
    const models = normalizeProviderModels({
      data: [
        {
          id: 'vendor/model-a',
          name: 'Model A',
          context_length: 128000,
          supported_parameters: ['reasoning', 'tools'],
          reasoning: { mandatory: false, supported_efforts: ['low', 'high'] },
        },
        {
          id: 'vendor/model-b',
          name: 'Model B',
        },
      ],
    });
    expect(models).toHaveLength(2);
    expect(models[0].reasoning).toEqual({ efforts: ['low', 'high'], mandatory: false });
    expect(models[0].contextLength).toBe(128000);
    expect(models[1].reasoning).toBeUndefined();
  });
});

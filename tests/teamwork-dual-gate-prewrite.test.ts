/**
 * Gate 2 (post-flight) của Dual-Gate phải chạy TRƯỚC khi ghi đĩa.
 *
 * Trước đây `fsWrite` gọi `fsp.writeFile` ở bước 3 rồi mới chạy
 * `evaluatePostFlight` ở bước 5. Khi gate fail, hàm trả
 * `{ written: false }` — nhưng file ĐÃ nằm trên đĩa. Người gọi tưởng ghi
 * hỏng nên thử lại, thực tế là ghi đè.
 *
 * Test này khoá hành vi đúng: bị chặn thì đĩa phải còn nguyên.
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HeadlessToolRunner } from '@/lib/teamwork/tools';

/** Khớp ADVERSARIAL_FACADE_PATTERNS trong contracts/dual-gate.ts.
 *  Regex bắt 3 dạng: async-thân-rỗng, hàm chỉ `return null/undefined/true/false`,
 *  và `throw new Error("not implemented")`. Hàm sync thân rỗng KHÔNG khớp. */
const STUB_CONTENT = 'export async function doThing() {}\n';
const CLEAN_CONTENT = 'export function doThing() {\n  return 42;\n}\n';

describe('fsWrite — Gate 2 chạy trước khi ghi đĩa', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'vyen-dualgate-'));
  });

  afterEach(async () => {
    await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  });

  it('file BỊ CHẶN thì đĩa phải không có file (gate chạy trước write)', async () => {
    const runner = new HeadlessToolRunner({ workspaceRoot: tempDir, enableDualGate: true });

    const res = await runner.fsWrite('stub.ts', STUB_CONTENT);

    expect(res.written).toBe(false);
    expect(res.error).toMatch(/Post-flight review failed/i);
    // Đây là phần cốt lõi: trước đây dòng này SAI vì file đã được ghi.
    await expect(fsp.access(path.join(tempDir, 'stub.ts'))).rejects.toThrow();
  });

  it('file ghi ĐƯỢC thì nội dung phải thật sự nằm trên đĩa', async () => {
    const runner = new HeadlessToolRunner({ workspaceRoot: tempDir, enableDualGate: true });

    const res = await runner.fsWrite('clean.ts', CLEAN_CONTENT);

    expect(res.written).toBe(true);
    expect(await fsp.readFile(path.join(tempDir, 'clean.ts'), 'utf8')).toBe(CLEAN_CONTENT);
  });

  it('file ĐÃ TỒN TẠI bị chặn thì nội dung cũ phải được giữ nguyên', async () => {
    const target = path.join(tempDir, 'existing.ts');
    await fsp.writeFile(target, CLEAN_CONTENT, 'utf8');
    const runner = new HeadlessToolRunner({ workspaceRoot: tempDir, enableDualGate: true });

    const res = await runner.fsWrite('existing.ts', STUB_CONTENT);

    expect(res.written).toBe(false);
    // Ghi đè bằng stub rồi báo thất bại là mất dữ liệu — đây là hậu quả nặng hơn.
    expect(await fsp.readFile(target, 'utf8')).toBe(CLEAN_CONTENT);
  });

  it('tắt cờ thì không gate (hành vi cũ, gate là opt-in ở tầng runner)', async () => {
    const runner = new HeadlessToolRunner({ workspaceRoot: tempDir });

    const res = await runner.fsWrite('stub.ts', STUB_CONTENT);

    expect(res.written).toBe(true);
  });

  it('bypassDualGate bỏ qua gate dù cờ đang bật', async () => {
    const runner = new HeadlessToolRunner({ workspaceRoot: tempDir, enableDualGate: true });

    const res = await runner.fsWrite('stub.ts', STUB_CONTENT, 'worker-1', { bypassDualGate: true });

    expect(res.written).toBe(true);
    expect(await fsp.readFile(path.join(tempDir, 'stub.ts'), 'utf8')).toBe(STUB_CONTENT);
  });
});
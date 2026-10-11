/**
 * Kiểm chứng đoạn nối `detectDanger` trong engine.ts — phần này TRƯỚC đây
 * không tồn tại: cờ `detectDanger` có trong DiffViewer nhưng không ai bật,
 * nên `dangerFlags` luôn rỗng và 343 dòng của diff-viewer.ts là code chết.
 */

import { describe, expect, it } from 'vitest';

import { DiffViewer } from '@/lib/teamwork/visual/diff-viewer';

describe('DiffViewer.detectDanger — quét dòng bị xoá trong diff', () => {
  it('bắt được xoá secret', () => {
    const diff = [
      '-const apiKey = "sk-ant-1234567890";',
      '-const password = "hunter2";',
    ].join('\n');
    const res = DiffViewer.renderUnifiedDiff('secrets.ts', null, diff, { detectDanger: true });
    expect(res.dangerFlags.length).toBeGreaterThan(0);
    expect(res.dangerFlags.join(' ')).toMatch(/secret|password/i);
  });

  it('bắt được lệnh phá hủy', () => {
    const diff = ['-await db.run("rm -rf /tmp/build");'].join('\n');
    const res = DiffViewer.renderUnifiedDiff('cleanup.ts', null, diff, { detectDanger: true });
    expect(res.dangerFlags.length).toBeGreaterThan(0);
  });

  it('tắt cờ thì không quét', () => {
    const diff = ['-const apiKey = "sk-ant-1234567890";'].join('\n');
    const res = DiffViewer.renderUnifiedDiff('secrets.ts', null, diff, { detectDanger: false });
    expect(res.dangerFlags).toEqual([]);
  });

  it('diff sạch thì không có cờ', () => {
    const diff = ['-const total = items.length;', '+const count = items.length;'].join('\n');
    const res = DiffViewer.renderUnifiedDiff('util.ts', null, diff, { detectDanger: true });
    expect(res.dangerFlags).toEqual([]);
  });
});
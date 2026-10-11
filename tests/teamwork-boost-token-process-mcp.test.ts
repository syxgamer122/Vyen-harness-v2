/**
 * Comprehensive Verification Test Suite for:
 * 1. /boost & --boost command with isolated Git Worktree and merge gate
 * 2. Background Process Management (process_start, process_status, process_output, process_stop)
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { parseCliArgs, runCli } from '../lib/teamwork/cli';
import { TeamworkEngine } from '../lib/teamwork/engine';
import {
  HeadlessToolRunner,
  process_output,
  process_start,
  process_status,
  process_stop,
} from '../lib/teamwork/tools';
import { GitWorktreeManager } from '../lib/teamwork/worktree';

describe('Feature 1: /boost & --boost in CLI & Isolated Worktree', () => {
  const workspaceRoot = path.resolve(process.cwd());

  it('parses --boost flag correctly', () => {
    const parsed = parseCliArgs(['--boost', '--goal', 'Optimize database indexes']);
    expect(parsed.boost).toBe(true);
    expect(parsed.goal).toBe('Optimize database indexes');
  });

  it('parses inline --boost= syntax', () => {
    const parsed = parseCliArgs(['--boost=Refactor auth middleware']);
    expect(parsed.boost).toBe(true);
    expect(parsed.goal).toBe('Refactor auth middleware');
  });

  it('parses /boost prefix command syntax', () => {
    const parsed = parseCliArgs(['/boost Migrate cache to Redis']);
    expect(parsed.boost).toBe(true);
    expect(parsed.goal).toBe('Migrate cache to Redis');
  });

  it('parses standalone /boost with subsequent goal', () => {
    const parsed = parseCliArgs(['/boost', 'Fix race condition']);
    expect(parsed.boost).toBe(true);
    expect(parsed.goal).toBe('Fix race condition');
  });

  it('generates diff stat using GitWorktreeManager.getDiffStat()', async () => {
    const mgr = new GitWorktreeManager({
      workspaceRoot,
      baseWorktreeDir: path.join(os.tmpdir(), 'teamwork-boost-diffstat-test'),
      branchPrefix: 'teamwork/diff-test',
    });

    if (!mgr.isGitRepo()) return;

    const workerId = `diff-worker-${Date.now()}`;
    const ctx = await mgr.createWorktree(workerId);

    try {
      // Modify a file in the worktree
      const testFile = path.join(ctx.worktreePath, 'boost-diff-test.txt');
      fs.writeFileSync(testFile, 'Hello Boost Worktree\nLine 2\n', 'utf8');

      const statRes = mgr.getDiffStat(workerId);
      expect(statRes.success).toBe(true);
      expect(statRes.stat).toContain('boost-diff-test.txt');
    } finally {
      await mgr.removeWorktree(workerId, { force: true, deleteBranch: true });
    }
  }, 30000);

  it('executes runCli with --boost and dry-run cleanly in worktree', async () => {
    const res = await runCli([
      '--boost',
      '--goal',
      'Boost dry run test',
      '--dry-run',
      '--auto-approve',
    ]);

    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain('[Boost Mode]');
    expect(res.stdout).toContain('[Dry Run]');
  }, 30000);

  it('executes runCli with /boost, showing diff stat and prompt merge', async () => {
    const runnerWorkspace = path.resolve(process.cwd());

    const res = await runCli(
      ['/boost Implement feature in worktree', '--auto-approve'],
      {
        workspaceRoot: runnerWorkspace,
        userConfirm: true,
        engineFactory: (wsRoot) => {
          const engine = new TeamworkEngine({
            workspaceRoot: wsRoot,
            confirmPrompt: async () => true,
            workerExecutor: async (milestone, attempt, tools) => {
              return { filesTouched: [] };
            },
          });

          (engine as any).critic.verifyMilestone = async () => ({
            verdict: 'PASS',
            command: 'npm test',
            exitCode: 0,
            outputPreview: 'Clean pass',
            issues: [],
            passCriteriaMet: true,
          });

          return engine;
        },
      }
    );

    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain('[Boost Mode]');
    expect(res.stdout).toContain('[Boost Diff Stat]');
    expect(res.stdout).toContain('[Boost Merge Gate]');
  }, 30000);
});
describe('Feature 3: Background Process Management Tools', () => {
  let runner: HeadlessToolRunner;
  const workspaceRoot = path.resolve(process.cwd());

  beforeAll(() => {
    runner = new HeadlessToolRunner({ workspaceRoot });
  });

  afterAll(async () => {
    await runner.cleanupAllProcesses();
  });

  it('starts a background process and queries its status', async () => {
    const isWin = process.platform === 'win32';
    // Use long-running command (ping localhost or node sleep)
    const cmd = isWin ? 'ping 127.0.0.1 -n 5' : 'sleep 5';

    const startRes = await runner.process_start(cmd);
    expect(startRes.processId).toBeDefined();
    expect(startRes.status).toBe('running');
    expect(typeof startRes.pid).toBe('number');

    const status = runner.process_status(startRes.processId);
    expect(status.status).toBe('running');
    expect(status.pid).toBe(startRes.pid);
    expect(status.uptimeMs).toBeGreaterThanOrEqual(0);

    // Stop process
    const stopRes = await runner.process_stop(startRes.processId);
    expect(stopRes.stopped).toBe(true);

    const postStatus = runner.process_status(startRes.processId);
    expect(postStatus.status).toBe('stopped');
  });

  it('captures background process output with tail and clear options', async () => {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'echo line1 & echo line2 & echo line3' : 'echo line1; echo line2; echo line3';

    const startRes = await runner.process_start(cmd);

    /* Chờ stdout CÓ dữ liệu thay vì ngủ cứng 600ms. `process_start` spawn thẳng
     * `cmd.exe /d /s /c` (lib/teamwork/tools.ts) nên `&` ở đây KHÔNG bị
     * shell-policy chặn; lý do đỏ thật sự là spawn đầu tiên trên Windows đôi khi
     * rò output chậm hơn 600ms → assert chạy trước lúc pipe đủ dòng. Vì vậy chờ
     * TỚI DÒNG CUỐI (line3), không chỉ dòng đầu — nếu chỉ chờ line1 thì assert
     * 'line2' lại đỏ khi output tới dần. */
    const deadline = Date.now() + 5_000;
    let out = runner.process_output(startRes.processId);
    while (!out.stdout.includes('line3') && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      out = runner.process_output(startRes.processId);
    }

    expect(out.stdout).toContain('line1');
    expect(out.stdout).toContain('line2');

    // Test tail
    const tailed = runner.process_output(startRes.processId, { tail: 1 });
    const lines = tailed.stdout.trim().split(/\r?\n/).filter(Boolean);
    expect(lines.length).toBe(1);

    // Test clear
    runner.process_output(startRes.processId, { clear: true });
    const cleared = runner.process_output(startRes.processId);
    expect(cleared.stdout).toBe('');
  });

  it('standalone functions process_start, process_status, process_stop work', async () => {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'ping 127.0.0.1 -n 4' : 'sleep 4';

    const res = await process_start(cmd, { workspaceRoot });
    expect(res.processId).toBeDefined();

    const st = process_status(res.processId);
    expect(st.status).toBe('running');

    const stop = await process_stop(res.processId);
    expect(stop.stopped).toBe(true);
  });

  it('blocks dangerous commands in process_start', async () => {
    await expect(runner.process_start('rm -rf /')).rejects.toThrow(/auto-pilot safety policy/);
  });
});

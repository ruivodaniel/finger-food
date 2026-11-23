// Measuring a child process: user+sys CPU time and peak resident memory, read
// from the kernel's accounting. Node only: for workers that run a binary (they
// declare runtimes ["server"]). The usage shape it feeds lives in
// @libs/orchestrator-lib-schema.
import { existsSync } from "node:fs";
import { execa, type Options } from "execa";

export interface ChildResources {
  cpuMs?: number;
  maxRssBytes?: number;
}

// Run a binary and read the kernel's accounting for it: user+sys CPU time and
// peak resident memory. Uses /usr/bin/time when present (-l on macOS, -v on
// Linux); without it the caller still gets wall-clock from the runner.
export async function meteredExec(bin: string, args: string[], opts: Options = {}): Promise<{ stdout: string; stderr: string; resources: ChildResources }> {
  const timeBin = "/usr/bin/time";
  if (!existsSync(timeBin)) {
    const r = await execa(bin, args, opts);
    return { stdout: String(r.stdout ?? ""), stderr: String(r.stderr ?? ""), resources: {} };
  }
  const flag = process.platform === "darwin" ? "-l" : "-v";
  const r = await execa(timeBin, [flag, bin, ...args], opts);
  const stderr = String(r.stderr ?? "");
  const resources: ChildResources = {};
  if (process.platform === "darwin") {
    // "        1.23 real         0.98 user         0.11 sys" + "   123456  maximum resident set size" (bytes)
    const m = /([\d.]+) real\s+([\d.]+) user\s+([\d.]+) sys/.exec(stderr);
    if (m) resources.cpuMs = Math.round((Number(m[2]) + Number(m[3])) * 1000);
    const rss = /(\d+)\s+maximum resident set size/.exec(stderr);
    if (rss) resources.maxRssBytes = Number(rss[1]);
  } else {
    const u = /User time \(seconds\): ([\d.]+)/.exec(stderr);
    const s = /System time \(seconds\): ([\d.]+)/.exec(stderr);
    if (u && s) resources.cpuMs = Math.round((Number(u[1]) + Number(s[1])) * 1000);
    const rss = /Maximum resident set size \(kbytes\): (\d+)/.exec(stderr);
    if (rss) resources.maxRssBytes = Number(rss[1]) * 1024;
  }
  return { stdout: String(r.stdout ?? ""), stderr, resources };
}

import fs from "node:fs/promises";
import process from "node:process";

const requireEnv = (name) => {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const baseUrl = requireEnv("LOAD_TEST_BASE_URL").replace(/\/+$/, "");
const confirmation = process.env.LOAD_TEST_CONFIRM;
const parsedUrl = new URL(baseUrl);

if (confirmation !== "I_UNDERSTAND_NON_PRODUCTION") {
  throw new Error("Set LOAD_TEST_CONFIRM=I_UNDERSTAND_NON_PRODUCTION to run load tests.");
}
if (process.env.NODE_ENV === "production") {
  throw new Error("Load tests cannot run with NODE_ENV=production.");
}
if (!parsedUrl.hostname.includes("localhost") && !parsedUrl.hostname.includes("127.0.0.1") && !process.env.LOAD_TEST_ALLOW_REMOTE) {
  throw new Error("Remote load targets require LOAD_TEST_ALLOW_REMOTE=1 and must be non-production.");
}

const tokenFile = requireEnv("LOAD_TEST_TOKENS_FILE");
const tokenData = JSON.parse(await fs.readFile(tokenFile, "utf8"));
const tenants = Array.isArray(tokenData) ? tokenData : tokenData.tenants;
if (!Array.isArray(tenants) || tenants.length < 2) {
  throw new Error("LOAD_TEST_TOKENS_FILE must contain at least two { schoolId, token } tenants.");
}
if (tenants.some((tenant) => !tenant?.schoolId || !tenant?.token)) {
  throw new Error("Each load-test tenant requires schoolId and token.");
}

const paths = String(process.env.LOAD_TEST_PATHS || "/api/students?limit=20,/api/finance/invoices,/api/academic/classes")
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean);
const requestsPerTenant = Math.min(1000, Math.max(1, Number(process.env.LOAD_TEST_REQUESTS || 20)));
const concurrency = Math.min(100, Math.max(1, Number(process.env.LOAD_TEST_CONCURRENCY || 10)));
const timeoutMs = Math.min(30_000, Math.max(500, Number(process.env.LOAD_TEST_TIMEOUT_MS || 10_000)));
const originSecret = process.env.LOAD_TEST_ORIGIN_SECRET || "";
const samples = [];
const failures = [];
let leakCount = 0;
let nextWork = 0;
const work = tenants.flatMap((tenant) => Array.from({ length: requestsPerTenant }, (_, index) => ({ tenant, path: paths[index % paths.length] })));

const containsForeignSchool = (value, expectedSchoolId) => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsForeignSchool(item, expectedSchoolId));
  if (Object.prototype.hasOwnProperty.call(value, "schoolId") && value.schoolId !== null && Number(value.schoolId) !== Number(expectedSchoolId)) return true;
  return Object.values(value).some((item) => containsForeignSchool(item, expectedSchoolId));
};

const execute = async ({ tenant, path }) => {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
        authorization: `Bearer ${tenant.token}`,
        ...(originSecret ? { "x-origin-secret": originSecret } : {}),
      },
    });
    const body = await response.json().catch(() => null);
    const latency = performance.now() - started;
    samples.push(latency);
    if (containsForeignSchool(body, tenant.schoolId)) leakCount += 1;
    if (!response.ok) failures.push({ status: response.status, path });
  } catch (error) {
    samples.push(performance.now() - started);
    failures.push({ status: 0, path, error: error.name === "AbortError" ? "timeout" : error.message });
  } finally {
    clearTimeout(timeout);
  }
};

const warmup = async () => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/healthz`, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {
      // The server may still be starting; retry until the bounded deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Load-test target did not become healthy within 30 seconds.");
};

await warmup();
const started = performance.now();
const workers = Array.from({ length: Math.min(concurrency, work.length) }, async () => {
  while (nextWork < work.length) {
    const index = nextWork;
    nextWork += 1;
    await execute(work[index]);
  }
});
await Promise.all(workers);

samples.sort((a, b) => a - b);
const percentile = (ratio) => samples[Math.min(samples.length - 1, Math.floor(samples.length * ratio))] || 0;
const elapsedSeconds = Math.max(0.001, (performance.now() - started) / 1000);
const result = {
  target: baseUrl,
  tenants: tenants.length,
  requests: samples.length,
  concurrency,
  errors: failures.length,
  errorRate: samples.length ? Number((failures.length / samples.length).toFixed(4)) : 1,
  tenantLeaks: leakCount,
  throughputRequestsPerSecond: Number((samples.length / elapsedSeconds).toFixed(2)),
  latencyMs: {
    p50: Number(percentile(0.5).toFixed(2)),
    p95: Number(percentile(0.95).toFixed(2)),
    p99: Number(percentile(0.99).toFixed(2)),
  },
};

console.log(JSON.stringify(result, null, 2));
if (leakCount > 0) process.exitCode = 2;
if (failures.length > 0 && process.env.LOAD_TEST_FAIL_ON_ERROR === "1") process.exitCode = 1;

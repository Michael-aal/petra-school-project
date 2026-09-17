import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const ORIGIN_SECRET = __ENV.ORIGIN_SECRET || '';
const EMAIL = __ENV.PETRA_TEST_EMAIL || '';
const PASSWORD = __ENV.PETRA_TEST_PASSWORD || '';

export const errors = new Rate('petra_errors');
export const apiLatency = new Trend('petra_api_latency', true);

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 5),
      duration: __ENV.DURATION || '30s',
      exec: 'authenticatedFlow',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    checks: ['rate>0.95'],
    petra_errors: ['rate<0.02'],
  },
};

function params(extra = {}) {
  const headers = {
    Accept: 'application/json',
    ...extra.headers,
  };

  if (ORIGIN_SECRET) headers['x-origin-secret'] = ORIGIN_SECRET;
  return { ...extra, headers, tags: extra.tags || {} };
}

function record(res, name, expected = [200]) {
  apiLatency.add(res.timings.duration, { endpoint: name });
  const ok = expected.includes(res.status);
  errors.add(!ok, { endpoint: name });
  check(res, {
    [`${name}: expected status`]: (r) => expected.includes(r.status),
  });
  return ok;
}

export function health() {
  const res = http.get(`${BASE_URL}/health`, params({ tags: { endpoint: 'health' } }));
  record(res, 'health');
}

export function authenticatedFlow() {
  if (!EMAIL || !PASSWORD) {
    throw new Error('Set PETRA_TEST_EMAIL and PETRA_TEST_PASSWORD for authenticated load tests.');
  }

  // Each VU logs in once, then reuses its cookie jar for the rest of its iterations.
  if (__ITER === 0) {
    const login = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: EMAIL, password: PASSWORD }),
      params({ headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'auth-login' } }),
    );
    record(login, 'auth-login');

    if (login.status < 200 || login.status >= 300) {
      sleep(1);
      return;
    }
  }

  const me = http.get(`${BASE_URL}/api/auth/me`, params({ tags: { endpoint: 'auth-me' } }));
  record(me, 'auth-me');

  // High-frequency school read path.
  const students = http.get(
    `${BASE_URL}/api/students/`,
    params({ tags: { endpoint: 'students-list' } }),
  );
  record(students, 'students-list');

  // Finance read path. This exercises tenant-scoped DB queries without mutating data.
  const fees = http.get(
    `${BASE_URL}/api/finance/fees`,
    params({ tags: { endpoint: 'finance-fees' } }),
  );
  record(fees, 'finance-fees');

  // Payment listing is deliberately read-only; do not generate real transactions in load tests.
  const payments = http.get(
    `${BASE_URL}/api/finance/payments`,
    params({ tags: { endpoint: 'finance-payments' } }),
  );
  record(payments, 'finance-payments');

  // Public health is included as a lightweight control measurement.
  health();

  sleep(Number(__ENV.THINK_TIME || 1));
}

export default authenticatedFlow;

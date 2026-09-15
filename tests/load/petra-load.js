import http from 'k6/http';
import { check, sleep } from 'k6';

// Petra authenticated role load test.
// Credentials are supplied at runtime and are NEVER stored in this file.
// Example:
// k6 run -e BASE_URL=http://localhost:5000 \
//   -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD='...' \
//   -e PARENT_EMAIL=parent@example.com -e PARENT_PASSWORD='...' \
//   -e STAFF_EMAIL=teacher@example.com -e STAFF_PASSWORD='...' \
//   tests/load/petra-load.js
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

const ROLE_CONFIG = {
  admin: {
    email: __ENV.ADMIN_EMAIL || '',
    password: __ENV.ADMIN_PASSWORD || '',
    routes: ['/api/auth/me', '/api/students', '/api/finance/fees'],
  },
  parent: {
    email: __ENV.PARENT_EMAIL || '',
    password: __ENV.PARENT_PASSWORD || '',
    routes: ['/api/auth/me', '/api/parent/children'],
  },
  staff: {
    email: __ENV.STAFF_EMAIL || '',
    password: __ENV.STAFF_PASSWORD || '',
    routes: ['/api/auth/me', '/api/teacher/dashboard', '/api/teacher/classes', '/api/teacher/students'],
  },
};

// Progressive authenticated stress test: 25% admin, 50% parent, 25% staff.
// 3,000 total VUs is intentional for the first authenticated run because
// the previous 10,000-VU health-only test began refusing connections locally.
export const options = {
  scenarios: {
    admin_users: {
      executor: 'ramping-vus',
      exec: 'adminWorkflow',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 75 },
        { duration: '1m', target: 250 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 750 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    parent_users: {
      executor: 'ramping-vus',
      exec: 'parentWorkflow',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 150 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '1m', target: 1500 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    staff_users: {
      executor: 'ramping-vus',
      exec: 'staffWorkflow',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 75 },
        { duration: '1m', target: 250 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 750 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: false }],
    http_req_duration: [{ threshold: 'p(95)<1000', abortOnFail: false }],
    checks: [{ threshold: 'rate>0.99', abortOnFail: false }],
  },
};

function request(path, role, operation, params = {}) {
  const response = http.get(`${BASE_URL}${path}`, {
    ...params,
    tags: { role, operation },
  });

  check(response, {
    [`${role} ${operation}: no 5xx`]: (r) => r.status < 500,
    [`${role} ${operation}: response received`]: (r) => r.status > 0,
  });

  return response;
}

function login(role) {
  const config = ROLE_CONFIG[role];
  if (!config.email || !config.password) {
    throw new Error(
      `Missing ${role} credentials. Set ${role.toUpperCase()}_EMAIL and ${role.toUpperCase()}_PASSWORD.`,
    );
  }

  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: config.email, password: config.password }),
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      tags: { role, operation: 'login' },
    },
  );

  const ok = check(response, {
    [`${role} login: HTTP 200`]: (r) => r.status === 200,
    [`${role} login: success payload`]: (r) => {
      try {
        return r.json('success') === true;
      } catch {
        return false;
      }
    },
  });

  if (!ok) {
    throw new Error(`${role} login failed with HTTP ${response.status}: ${response.body}`);
  }
}

// k6 gives each VU its own JS runtime, so this flag is per simulated user.
// The VU logs in once and then keeps its session cookie across iterations.
let loggedIn = false;

function authenticatedWorkflow(role) {
  if (!loggedIn) {
    login(role);
    loggedIn = true;
  }

  const config = ROLE_CONFIG[role];
  for (const path of config.routes) {
    request(path, role, path.replaceAll('/', '_').replace(/^_/, '') || 'request');
  }

  // Think-time: model an active user instead of a tight request loop.
  sleep(1);
}

export function adminWorkflow() {
  authenticatedWorkflow('admin');
}

export function parentWorkflow() {
  authenticatedWorkflow('parent');
}

export function staffWorkflow() {
  authenticatedWorkflow('staff');
}

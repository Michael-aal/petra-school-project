import http from 'k6/http';
import { check, sleep } from 'k6';

// Petra multi-role load test.
// Set BASE_URL when needed: k6 run -e BASE_URL=http://localhost:5000 tests/load/petra-load.js
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  scenarios: {
    admin_users: {
      executor: 'ramping-vus',
      exec: 'adminWorkflow',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    parent_users: {
      executor: 'ramping-vus',
      exec: 'parentWorkflow',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 40 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    staff_users: {
      executor: 'ramping-vus',
      exec: 'staffWorkflow',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: false }],
    http_req_duration: [{ threshold: 'p(95)<1000', abortOnFail: false }],
  },
};

function get(path, role, operation) {
  const response = http.get(`${BASE_URL}${path}`, {
    tags: { role, operation },
  });

  check(response, {
    'request did not return 5xx': (r) => r.status < 500,
  });

  return response;
}

// These workflows intentionally start with the known safe health endpoint.
// Replace/add real authenticated Petra routes after verifying their exact paths.
export function adminWorkflow() {
  get('/healthz', 'admin', 'health');
  sleep(1);
}

export function parentWorkflow() {
  get('/healthz', 'parent', 'health');
  sleep(1);
}

export function staffWorkflow() {
  get('/healthz', 'staff', 'health');
  sleep(1);
}

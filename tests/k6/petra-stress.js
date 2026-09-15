import { authenticatedFlow } from './petra-api.js';

export const options = {
  scenarios: {
    petra_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '60s', target: 10 },
        { duration: '30s', target: 50 },
        { duration: '60s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '60s', target: 100 },
        { duration: '30s', target: 250 },
        { duration: '60s', target: 250 },
        { duration: '30s', target: 500 },
        { duration: '60s', target: 500 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
      exec: 'authenticatedFlow',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    checks: ['rate>0.95'],
    petra_errors: ['rate<0.02'],
  },
};

export { authenticatedFlow };

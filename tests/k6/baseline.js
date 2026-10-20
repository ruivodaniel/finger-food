/* global __ENV */

import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "2m", target: 10 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500", "p(99)<1500"],
    checks: ["rate>0.99"],
  },
};

const baseUrl = __ENV.BASE_URL?.trim();
const apiUrl = __ENV.API_URL?.trim();

if (!baseUrl) {
  throw new Error("BASE_URL is required");
}

if (!apiUrl) {
  throw new Error("API_URL is required");
}

export default function () {
  const healthRes = http.get(`${apiUrl.replace(/\/$/, "")}/health`);
  check(healthRes, {
    "health status 200": (r) => r.status === 200,
    "health response < 200ms": (r) => r.timings.duration < 200,
  });

  const webRes = http.get(baseUrl);
  check(webRes, {
    "web is reachable": (r) => [200, 301, 302].includes(r.status),
  });

  sleep(1);
}

/* global __ENV */

import { check, sleep } from "k6";
import http from "k6/http";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 20 },
    { duration: "1m", target: 40 },
    { duration: "30s", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
    checks: ["rate>0.95"],
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
  });

  const webRes = http.get(baseUrl);
  check(webRes, {
    "web is reachable": (r) => [200, 301, 302].includes(r.status),
  });

  sleep(0.5);
}

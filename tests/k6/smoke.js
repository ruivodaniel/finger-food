/* global __ENV */

import { check } from "k6";
import http from "k6/http";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500"],
  },
};

const baseUrl = __ENV.BASE_URL?.trim();
const apiUrl = __ENV.API_URL?.trim();

if (!baseUrl) {
  throw new Error("BASE_URL is required");
}

export default function () {
  const web = http.get(baseUrl);
  check(web, {
    "web is reachable": (response) => [200, 301, 302].includes(response.status),
  });

  if (apiUrl) {
    const api = http.get(`${apiUrl.replace(/\/$/, "")}/health`);
    check(api, {
      "api health is ok": (response) => response.status === 200,
    });
  }
}

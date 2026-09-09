import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api/urban-mayhem`,
  withCredentials: true,
});

export function joinTeam(code) {
  return api.post("/join", { code }).then((r) => r.data);
}

export function fetchState() {
  return api.get("/state").then((r) => r.data);
}

export function placeBuilding(row, col, buildingId) {
  return api.post("/action", { type: "place", row, col, buildingId }).then((r) => r.data);
}

export function rehouseSlum(row, col) {
  return api.post("/action", { type: "rehouse", row, col }).then((r) => r.data);
}

function adminHeaders(key) {
  return { headers: { "x-admin-key": key } };
}

export function fetchOverview(key) {
  return api.get("/overview", adminHeaders(key)).then((r) => r.data);
}

export function lockYear(key) {
  return api.post("/lock-year", {}, adminHeaders(key)).then((r) => r.data);
}

export function advanceYear(key) {
  return api.post("/advance-year", {}, adminHeaders(key)).then((r) => r.data);
}

export function resetAll(key) {
  return api.post("/reset", {}, adminHeaders(key)).then((r) => r.data);
}

export default api;

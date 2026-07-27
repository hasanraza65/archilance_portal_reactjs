import axios from "axios";
import Cookies from "js-cookie";
import { getApiBasePathForRole } from "@/pages/utility/apiHelper";

const BASE = import.meta.env.VITE_BACKEND_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${Cookies.get("token")}`,
  Accept: "application/json",
});

/* ----------------------------- Templates ----------------------------- */
export const fetchTemplates = (params = {}) =>
  axios.get(`${BASE}/api/contract-templates`, { headers: authHeaders(), params });

export const fetchTemplate = (id) =>
  axios.get(`${BASE}/api/contract-templates/${id}`, { headers: authHeaders() });

export const createTemplate = (data) =>
  axios.post(`${BASE}/api/contract-templates`, data, { headers: authHeaders() });

export const updateTemplate = (id, data) =>
  axios.put(`${BASE}/api/contract-templates/${id}`, data, { headers: authHeaders() });

export const deleteTemplate = (id) =>
  axios.delete(`${BASE}/api/contract-templates/${id}`, { headers: authHeaders() });

/* ----------------------------- Variables ----------------------------- */
export const fetchContractVariables = () =>
  axios.get(`${BASE}/api/contract-variables`, { headers: authHeaders() });

/* ----------------------------- Contracts ----------------------------- */
export const fetchContracts = (params = {}) =>
  axios.get(`${BASE}/api/contracts`, { headers: authHeaders(), params });

export const fetchContract = (id) =>
  axios.get(`${BASE}/api/contracts/${id}`, { headers: authHeaders() });

export const createContract = (data) =>
  axios.post(`${BASE}/api/contracts`, data, { headers: authHeaders() });

export const updateContract = (id, data) =>
  axios.put(`${BASE}/api/contracts/${id}`, data, { headers: authHeaders() });

export const updateContractStatus = (id, status) =>
  axios.patch(`${BASE}/api/contracts/${id}/status`, { status }, { headers: authHeaders() });

export const resendContract = (id) =>
  axios.post(`${BASE}/api/contracts/${id}/resend`, {}, { headers: authHeaders() });

export const deleteContract = (id) =>
  axios.delete(`${BASE}/api/contracts/${id}`, { headers: authHeaders() });

/* --------------------- Employees (for the picker) -------------------- */
// Reuses the role-appropriate employee list endpoint (admin -> /api/admin/...,
// executive -> /api/employee/...). A large page so the searchable dropdown has
// everyone client-side.
export const fetchEmployeesForPicker = () =>
  axios.get(`${BASE}${getApiBasePathForRole("/employee-user")}`, {
    headers: authHeaders(),
    params: { page: 1, per_page: 500 },
  });

/* --------------------------- Public (no auth) ------------------------ */
export const fetchPublicContract = (token) =>
  axios.get(`${BASE}/api/contracts/public/${token}`, { headers: { Accept: "application/json" } });

export const acceptPublicContract = (token) =>
  axios.post(`${BASE}/api/contracts/public/${token}/accept`, {}, { headers: { Accept: "application/json" } });

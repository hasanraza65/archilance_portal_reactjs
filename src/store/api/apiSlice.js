import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Add token to request headers if available
const prepareHeaders = (headers, { getState }) => {
  const token = localStorage.getItem("token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`); // Good for authenticated requests AFTER login
  }
  return headers;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://demo.aentora.com/backend/public/api", // Correct
    prepareHeaders, // Correct for general API calls
  }),
  endpoints: (builder) => ({}),
});
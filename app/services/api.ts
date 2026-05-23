import axios from "axios";

const apiBaseURL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

const API = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

export default API;

import axios from "axios";

const backendUrl =  "http://localhost:5000"; // 🔹 local backend

const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
});

export default api;

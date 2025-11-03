import axios from "axios";

const backendUrl =  "https://incomparable-cucurucho-7347e5.netlify.app";

const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
});

export default api;

import axios from "axios";

const API = axios.create({
  baseURL: "https://ai-travel-planner-2tx1.vercel.app/",
});

export default API;
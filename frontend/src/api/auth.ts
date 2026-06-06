import axios from 'axios';
import { API_URL } from './axios';

export interface LoginResponse {
  access: string;
  refresh: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await axios.post(`${API_URL}/api/auth/login/`, { username, password });
  return data;
}

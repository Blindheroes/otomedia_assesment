import { BASE_URL } from '../config';

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 204) return {} as T; // No Content

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Something went wrong');
  }
  return data as T;
}

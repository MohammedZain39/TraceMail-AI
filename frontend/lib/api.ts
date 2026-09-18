import { supabase } from "./supabase";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";


export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const headers = new Headers(options.headers);

  headers.set(
    "Authorization",
    `Bearer ${session.access_token}`
  );

  return fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,
    }
  );
}
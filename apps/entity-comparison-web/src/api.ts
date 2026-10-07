const API_BASE_URL =
  import.meta.env.VITE_TOOLS_API_URL || "http://localhost:4000";

export async function apiRequest<T>(
  path: string,
  token?: string
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed with ${response.status}`);
  }

  return response.json();
}
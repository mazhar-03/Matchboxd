// utils/auth.ts
export const getAuthToken = (): string | null => {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) return token;

    // Fallback to cookies
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('authToken='))
      ?.split('=')[1];

    return cookieToken || null;
  }
  return null;
};
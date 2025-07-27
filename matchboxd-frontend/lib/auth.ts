import jwt from "jsonwebtoken";

export function getAuthData() {
  if (typeof window === "undefined") return { isSignedIn: false };

  const token = localStorage.getItem("authToken");
  if (!token) return { isSignedIn: false };

  try {
    const decoded = jwt.decode(token) as {
      username?: string;
      userPhoto?: string;
    };

    return {
      isSignedIn: true,
      username: decoded?.username,
      userPhoto: decoded?.userPhoto,
    };
  } catch (err) {
    return { isSignedIn: false };
  }
}

import jwt from "jsonwebtoken";

export function getAuthData() {
  if (typeof window === "undefined") return { isSignedIn: false };

  const token = localStorage.getItem("authToken");
  if (!token) return { isSignedIn: false };

  try {
    const decoded = jwt.decode(token) as {
      userId?: string;     // if your token contains it
      username?: string;
      userPhoto?: string;
    };

    return {
      isSignedIn: true,
      userId: decoded?.userId, // add this if you have it
      username: decoded?.username,
      userPhoto: decoded?.userPhoto,
    };
  } catch {
    return { isSignedIn: false };
  }
}

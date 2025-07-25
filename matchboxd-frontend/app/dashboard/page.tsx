// app/dashboard/page.tsx
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export default async function Dashboard() {
  const cookieStore = await cookies(); // Remove await
  const token = cookieStore.get("token")?.value;

  // Proper JWT decoding
  const decoded = token ? jwt.decode(token) as { username?: string } : null;
  const isSignedIn = !!token;
  const username = decoded?.username || "User"; // Fallback to "User"

  return (
    <section>
      <h1>Dashboard</h1>
      {isSignedIn ? (
        <p>Welcome back, {username}!</p>
      ) : (
        <p>Please log in.</p>
      )}
    </section>
  );
}
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

type User = {
  id: string;
  email: string;
  role: string;
};

type AdminCheckError = {
  error: true;
  status: number;
  message: string;
};

/**
 * Get the current user session on the server side
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  return session?.user as User | null;
}

/**
 * Check if the current user is authenticated
 * Redirects to login if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  return user;
}

/**
 * Check if the current user is an admin
 * Returns 401/403 if not an admin
 * @param returnJson - If true, returns JSON response for API routes
 */
export async function requireAdmin(returnJson = false): Promise<User | AdminCheckError> {
  const user = await requireAuth();
  
  if (user.role !== "ADMIN") {
    if (returnJson) {
      // For API routes, return JSON error
      return {
        error: true,
        status: 403,
        message: "Forbidden: Admin access required"
      };
    } else {
      // For page routes, redirect or show error
      redirect("/dashboard?error=admin_required");
    }
  }
  
  return user;
}

/**
 * Utility for API routes to check admin access
 * Returns null if user is admin, otherwise returns error response
 */
export async function checkAdminAccess(): Promise<Response | null> {
  const adminCheck = await requireAdmin(true);
  if ("error" in adminCheck && adminCheck.error) {
    return Response.json(
      { error: adminCheck.message },
      { status: adminCheck.status }
    );
  }
  return null;
}

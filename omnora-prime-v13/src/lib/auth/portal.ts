import { cookies } from "next/headers";
import { verifyPortalToken } from "@/lib/actions/clientPortal";
import { ClientPortal } from "@/lib/db/schema";

/**
 * Retrieve the active portal session from cookies.
 * Used in Server Components to authorize and context-bind portal views.
 */
export async function getPortalSession(): Promise<ClientPortal | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('portal_session')?.value;

  if (!token) return null;

  // verifyPortalToken handles hashing and DB check
  return await verifyPortalToken(token);
}


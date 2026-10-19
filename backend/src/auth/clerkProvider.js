import { clerkMiddleware, clerkClient, getAuth } from '@clerk/express';

/**
 * Everything the API needs from an identity provider, behind one small
 * interface. The app depends on this shape, not on Clerk directly, so tests
 * can pass a fake provider and we could swap Clerk out later.
 *
 *   middleware()          → express middleware that verifies the session
 *   resolveAuth(req)      → Clerk user id or null
 *   fetchProfile(id)      → { name, email, avatar }
 *   setRole(id, role)     → mirrors our role into Clerk publicMetadata
 */
export const clerkProvider = {
  middleware: () => clerkMiddleware(),

  resolveAuth(req) {
    return getAuth(req)?.userId ?? null;
  },

  async fetchProfile(clerkId) {
    const u = await clerkClient.users.getUser(clerkId);
    const primary = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId) ?? u.emailAddresses[0];
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || primary?.emailAddress;
    return { name, email: primary?.emailAddress, avatar: u.imageUrl };
  },

  async setRole(clerkId, role) {
    await clerkClient.users.updateUserMetadata(clerkId, { publicMetadata: { role } });
  },
};

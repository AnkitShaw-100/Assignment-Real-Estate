/**
 * DEVELOPMENT ONLY. Lets you act as any user by sending `x-dev-user: <email>`,
 * so the CRM can be tried locally without Clerk keys. app.js only enables it
 * when DEV_AUTH=true, NODE_ENV is not production and no Clerk key is set.
 */
export const devProvider = {
  resolveAuth(req) {
    const email = req.get('x-dev-user')?.trim().toLowerCase();
    return email ? `dev_${email}` : null;
  },
  async fetchProfile(clerkId) {
    const email = clerkId.slice(4);
    return { email, name: email.split(/[@+]/)[0].replace(/^\w/, (c) => c.toUpperCase()) };
  },
};

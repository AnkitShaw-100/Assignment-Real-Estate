/** The user fields the API may send to clients. Never includes the password hash. */
export function publicUser(user) {
  const { _id, name, email, avatar, phone, role, title, savedProperties, createdAt } = user;
  return { _id, name, email, avatar, phone, role, title, savedProperties, createdAt };
}

import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export interface UserMatchResult {
  user: User;
  isNew: boolean;
}

/**
 * Find or create a user by email OR phone.
 *
 * Matching logic:
 * 1. Check if email matches an existing user
 * 2. If not, check if phone matches an existing user
 * 3. If neither matches, create a new user
 *
 * @param email - User's email address
 * @param phone - User's phone number
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns The matched or created user, and whether it's new
 */
export async function findOrCreateUser(
  email: string,
  phone: string,
  firstName: string,
  lastName: string
): Promise<UserMatchResult> {
  const now = new Date();

  // 1. Try to find by email
  if (email) {
    const userByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (userByEmail) {
      // Update last activity
      await db
        .update(users)
        .set({ updatedAt: now })
        .where(eq(users.id, userByEmail.id));

      return { user: userByEmail, isNew: false };
    }
  }

  // 2. Try to find by phone
  if (phone) {
    const userByPhone = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .get();

    if (userByPhone) {
      // Update last activity
      await db
        .update(users)
        .set({ updatedAt: now })
        .where(eq(users.id, userByPhone.id));

      return { user: userByPhone, isNew: false };
    }
  }

  // 3. Create new user
  const newUser: User = {
    id: uuid(),
    email: email || null,
    phone: phone || null,
    firstName: firstName || null,
    lastName: lastName || null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(users).values(newUser);

  return { user: newUser, isNew: true };
}

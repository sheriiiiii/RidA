// import { supabase } from "@/lib/supabase"
// import { PrismaClient } from "@prisma/client"
// import type { User } from "@supabase/supabase-js"

// const prisma = new PrismaClient()

// export interface AuthUser extends User {
//   email: string
// }

// export const signIn = async (email: string, password: string) => {
//   const { data, error } = await supabase.auth.signInWithPassword({
//     email,
//     password,
//   })

//   if (error) throw error

//   // Optionally sync with Prisma User model
//   if (data.user) {
//     await syncUserWithPrisma(data.user)
//   }

//   return data
// }

// export const signUp = async (email: string, password: string, name: string) => {
//   const { data, error } = await supabase.auth.signUp({
//     email,
//     password,
//     options: {
//       data: {
//         name,
//       },
//     },
//   })

//   if (error) throw error

//   // Create corresponding record in Prisma User model
//   if (data.user) {
//     await syncUserWithPrisma(data.user, name)
//   }

//   return data
// }

// export const signOut = async () => {
//   const { error } = await supabase.auth.signOut()
//   if (error) throw error
// }

// export const getCurrentUser = async (): Promise<AuthUser | null> => {
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()
//   return user as AuthUser | null
// }

// export const getSession = async () => {
//   const {
//     data: { session },
//   } = await supabase.auth.getSession()
//   return session
// }

// // Sync Supabase Auth user with Prisma User model
// export const syncUserWithPrisma = async (supabaseUser: User, name?: string) => {
//   try {
//     const existingUser = await prisma.user.findUnique({
//       where: { email: supabaseUser.email! },
//     })

//     if (!existingUser) {
//       await prisma.user.create({
//         data: {
//           name: name || supabaseUser.user_metadata?.name || "Admin User",
//           email: supabaseUser.email!,
//           password: "supabase_managed", // Placeholder since Supabase manages the actual password
//         },
//       })
//       console.log("✅ User synced with Prisma database")
//     }
//   } catch (error) {
//     console.error("Error syncing user with Prisma:", error)
//   }
// }

// // Get Prisma user data
// export const getPrismaUser = async (email: string) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { email },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     })
//     return user
//   } catch (error) {
//     console.error("Error getting Prisma user:", error)
//     return null
//   }
// }

import { supabase } from "@/lib/supabase";
import { PrismaClient } from "@prisma/client";
import type { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export interface AuthUser extends User {
  email: string;
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Optionally sync with Prisma User model
  if (data.user) {
    await syncUserWithPrisma(data.user);
  }

  return data;
};

export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) throw error;

  // Create corresponding record in Prisma User model
  if (data.user) {
    await syncUserWithPrisma(data.user, name);
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user as AuthUser | null;
};

export const getSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

// Sync Supabase Auth user with Prisma User model
export const syncUserWithPrisma = async (supabaseUser: User, name?: string) => {
  try {
    // Use upsert to either create or update the user
    await prisma.user.upsert({
      where: {
        email: supabaseUser.email!,
      },
      update: {
        name: name || supabaseUser.user_metadata?.name || "Admin User",
      },
      create: {
        name: name || supabaseUser.user_metadata?.name || "Admin User",
        email: supabaseUser.email!,
        // Remove password field - Supabase manages authentication
      },
    });

    console.log("✅ User synced with Prisma database");
  } catch (error) {
    console.error("Error syncing user with Prisma:", error);
    throw error; // Re-throw to handle upstream
  }
};

// Get Prisma user data
export const getPrismaUser = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error getting Prisma user:", error);
    return null;
  }
};

export const getUser = async (): Promise<AuthUser | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user as AuthUser | null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

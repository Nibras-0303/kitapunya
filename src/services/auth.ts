import { createClient } from "@supabase/supabase-js";
import { dbService } from "./db.js";

// Lazy initialize Supabase
let supabaseInstance: any = null;

export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || (typeof window !== 'undefined' ? (window as any).env?.SUPABASE_URL : null);
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || (typeof window !== 'undefined' ? (window as any).env?.SUPABASE_ANON_KEY : null);

  console.log(`[getSupabase] URL exists: ${url ? "YES" : "NO"} (${url ? url.substring(0, 15) : ""}), Key exists: ${key ? "YES" : "NO"}`);

  if (url && key) {
    if (!supabaseInstance) {
      try {
        supabaseInstance = createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          }
        });
        console.log("Supabase client initialized successfully!");
      } catch (err) {
        console.error("Failed to initialize Supabase client:", err);
      }
    }
    return supabaseInstance;
  }
  return null;
}

// User Profile definition matching both db schema and Supabase Auth
export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "user";
}

// Local mock storage key
const FALLBACK_SESSION_KEY = "kitapunya_fallback_session";

export const authService = {
  async getSession(): Promise<SessionUser | null> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session && session.user) {
          // Fetch profile role from DB
          const profile = await dbService.getUser(session.user.id);
          return {
            id: session.user.id,
            email: session.user.email || "",
            fullName: profile?.fullName || session.user.user_metadata?.full_name || "User KitaPunya",
            role: (profile?.role as "admin" | "user") || "user",
          };
        }
      } catch (e) {
        console.error("Supabase getSession error, checking local session:", e);
      }
    }

    // Fallback Client-side session check
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(FALLBACK_SESSION_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Verify user still exists in our dbService
          const profile = await dbService.getUser(parsed.id);
          if (profile) {
            return {
              id: profile.id,
              email: profile.email,
              fullName: profile.fullName || "User KitaPunya",
              role: profile.role as "admin" | "user",
            };
          }
        } catch (e) {
          console.error("Failed to parse local session:", e);
        }
      }
    }
    return null;
  },

  async login(email: string, passwordString?: string): Promise<SessionUser> {
    console.log("Profile selection login called:", email);
    const cleanEmail = email.trim().toLowerCase();
    
    let id = "33333333-3333-3333-3333-333333333333";
    let fullName = "Uang Bersama";
    let role: "admin" | "user" = "admin";

    if (cleanEmail.includes("nibras")) {
      id = "11111111-1111-1111-1111-111111111111";
      fullName = "Nibras";
      role = "user";
    } else if (cleanEmail.includes("zenita")) {
      id = "22222222-2222-2222-2222-222222222222";
      fullName = "Zenita";
      role = "user";
    }

    // Ensure the profile exists in database service
    let profile = await dbService.getUser(id);
    if (!profile) {
      profile = await dbService.createUser({
        id,
        email: cleanEmail,
        fullName,
        role,
      });
    }

    const sessionUser: SessionUser = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName || fullName,
      role: profile.role as "admin" | "user",
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(FALLBACK_SESSION_KEY, JSON.stringify(sessionUser));
    }

    await dbService.addActivityLog(profile.id, "LOGIN", `Pilih profil ${fullName} berhasil`);
    return sessionUser;
  },

  async signUp(email: string, passwordString: string, fullName: string): Promise<SessionUser> {
    // Treat as simple profile creation / login
    return this.login(email);
  },

  async logout(userId: string | null): Promise<void> {
    if (userId) {
      await dbService.addActivityLog(userId, "LOGOUT", "Keluar dari profil");
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(FALLBACK_SESSION_KEY);
    }
  }
};

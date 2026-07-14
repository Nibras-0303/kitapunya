import { AuthSession, Account, Category, Transaction, Budget, SavingsGoal, Investment, ActivityLog, User } from "../types.js";

const BASE_URL = "/api";

// Fetch Helper with Authorization and error handling
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Get active session user ID for authentication header
  let activeUserId = "";
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("kitapunya_active_userid");
    if (saved) activeUserId = saved;
  }

  const headers = {
    "Content-Type": "application/json",
    ...(activeUserId ? { 
      "x-user-id": activeUserId,
      "x-profile-id": activeUserId 
    } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error("Non-JSON response received:", text.substring(0, 200));
    throw new Error(`Pelayan mengembalikan respons bukan JSON (Status ${response.status}). Sila hubungi admin atau cuba lagi.`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Ralat komunikasi pelayan.");
  }

  // If the server wrapped the response in { success: true, data: ... }, unwrap it for the client.
  if (data && typeof data === "object" && "success" in data && "data" in data) {
    if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
      return { success: data.success, ...data.data } as T;
    }
    return data.data as T;
  }

  return data as T;
}

export const api = {
  // --- AUTH ---
  async login(email: string, passwordString: string): Promise<AuthSession> {
    const res = await request<{ session: AuthSession }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: passwordString }),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("kitapunya_active_userid", res.session.id);
      localStorage.setItem("kitapunya_session", JSON.stringify(res.session));
    }
    return res.session;
  },

  async signUp(email: string, passwordString: string, fullName: string): Promise<AuthSession> {
    const res = await request<{ session: AuthSession }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password: passwordString, fullName }),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("kitapunya_active_userid", res.session.id);
      localStorage.setItem("kitapunya_session", JSON.stringify(res.session));
    }
    return res.session;
  },

  async logout(): Promise<void> {
    let activeUserId = "";
    if (typeof window !== "undefined") {
      activeUserId = localStorage.getItem("kitapunya_active_userid") || "";
      localStorage.removeItem("kitapunya_active_userid");
      localStorage.removeItem("kitapunya_session");
    }
    try {
      await request("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ userId: activeUserId }),
      });
    } catch (e) {
      console.warn("Server logout request ignored or failed:", e);
    }
  },

  async checkSession(): Promise<AuthSession | null> {
    let activeUserId = "";
    if (typeof window !== "undefined") {
      activeUserId = localStorage.getItem("kitapunya_active_userid") || "";
    }
    if (!activeUserId) return null;

    try {
      // Fetch accounts to check if session userId is still valid on server
      await request<{ accounts: Account[] }>("/accounts");
      // Return details for the exact static profile
      const isNibras = activeUserId === "11111111-1111-1111-1111-111111111111";
      const isZenita = activeUserId === "22222222-2222-2222-2222-222222222222";
      return {
        id: activeUserId,
        email: isNibras ? "nibras@kitapunya.id" : isZenita ? "zenita@kitapunya.id" : "bersama@kitapunya.id",
        fullName: isNibras ? "Nibras" : isZenita ? "Zenita" : "Uang Bersama",
        role: (isNibras || isZenita) ? "user" : "admin",
      };
    } catch (e) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("kitapunya_active_userid");
      }
      return null;
    }
  },

  // --- ACCOUNTS ---
  async getAccounts(): Promise<Account[]> {
    const res = await request<{ accounts: Account[] }>("/accounts");
    return res?.accounts || [];
  },

  async createAccount(acc: Omit<Account, "id" | "userId" | "createdAt">): Promise<Account> {
    const res = await request<{ account: Account }>("/accounts", {
      method: "POST",
      body: JSON.stringify(acc),
    });
    return res.account;
  },

  async updateAccount(id: string, acc: Partial<Omit<Account, "id" | "userId" | "createdAt">>): Promise<Account> {
    const res = await request<{ account: Account }>(`/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(acc),
    });
    return res.account;
  },

  async deleteAccount(id: string): Promise<void> {
    await request(`/accounts/${id}`, { method: "DELETE" });
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    const res = await request<{ categories: Category[] }>("/categories");
    return res?.categories || [];
  },

  async createCategory(cat: Omit<Category, "id" | "userId" | "createdAt">): Promise<Category> {
    const res = await request<{ category: Category }>("/categories", {
      method: "POST",
      body: JSON.stringify(cat),
    });
    return res.category;
  },

  async updateCategory(id: string, cat: Partial<Omit<Category, "id" | "userId" | "createdAt">>): Promise<Category> {
    const res = await request<{ category: Category }>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(cat),
    });
    return res.category;
  },

  async deleteCategory(id: string): Promise<void> {
    await request(`/categories/${id}`, { method: "DELETE" });
  },

  // --- TRANSACTIONS ---
  async getTransactions(filters?: { accountId?: string; categoryId?: string; startDate?: string; endDate?: string; search?: string }): Promise<Transaction[]> {
    const query = filters ? "?" + new URLSearchParams(filters as any).toString() : "";
    const res = await request<{ transactions: Transaction[] }>(`/transactions${query}`);
    return res?.transactions || [];
  },

  async createTransaction(tx: Omit<Transaction, "id" | "userId" | "createdAt">): Promise<Transaction> {
    const res = await request<{ transaction: Transaction }>("/transactions", {
      method: "POST",
      body: JSON.stringify(tx),
    });
    return res.transaction;
  },

  async deleteTransaction(id: string): Promise<void> {
    await request(`/transactions/${id}`, { method: "DELETE" });
  },

  // --- BUDGETS ---
  async getBudgets(month?: string): Promise<Budget[]> {
    const query = month ? `?month=${month}` : "";
    const res = await request<{ budgets: Budget[] }>(`/budgets${query}`);
    return res?.budgets || [];
  },

  async createOrUpdateBudget(budget: { categoryId: string; amount: number; month: string }): Promise<Budget> {
    const res = await request<{ budget: Budget }>("/budgets", {
      method: "POST",
      body: JSON.stringify(budget),
    });
    return res.budget;
  },

  // --- SAVINGS GOALS ---
  async getSavingsGoals(): Promise<SavingsGoal[]> {
    const res = await request<{ goals: SavingsGoal[] }>("/savings-goals");
    return res?.goals || [];
  },

  async createSavingsGoal(goal: Omit<SavingsGoal, "id" | "userId" | "createdAt">): Promise<SavingsGoal> {
    const res = await request<{ goal: SavingsGoal }>("/savings-goals", {
      method: "POST",
      body: JSON.stringify(goal),
    });
    return res.goal;
  },

  async updateSavingsGoal(id: string, goal: Partial<Omit<SavingsGoal, "id" | "userId" | "createdAt">>): Promise<SavingsGoal> {
    const res = await request<{ goal: SavingsGoal }>(`/savings-goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(goal),
    });
    return res.goal;
  },

  async deleteSavingsGoal(id: string): Promise<void> {
    await request(`/savings-goals/${id}`, { method: "DELETE" });
  },

  // --- INVESTMENTS ---
  async getInvestments(): Promise<Investment[]> {
    const res = await request<{ investments: Investment[] }>("/investments");
    return res?.investments || [];
  },

  async createInvestment(inv: Omit<Investment, "id" | "userId" | "createdAt">): Promise<Investment> {
    const res = await request<{ investment: Investment }>("/investments", {
      method: "POST",
      body: JSON.stringify(inv),
    });
    return res.investment;
  },

  async updateInvestment(id: string, inv: Partial<Omit<Investment, "id" | "userId" | "createdAt">>): Promise<Investment> {
    const res = await request<{ investment: Investment }>(`/investments/${id}`, {
      method: "PUT",
      body: JSON.stringify(inv),
    });
    return res.investment;
  },

  async deleteInvestment(id: string): Promise<void> {
    await request(`/investments/${id}`, { method: "DELETE" });
  },

  async refreshInvestments(): Promise<{ investments: Investment[]; lastUpdated: string; updatedCount: number }> {
    return await request<{ investments: Investment[]; lastUpdated: string; updatedCount: number }>("/investments/refresh", {
      method: "POST",
    });
  },

  // --- QRIS ---
  async getQris(): Promise<string> {
    const res = await request<{ qrImageUrl: string }>("/qris");
    return res.qrImageUrl;
  },

  async updateQris(qrImageUrl: string): Promise<string> {
    const res = await request<{ qrImageUrl: string }>("/qris", {
      method: "POST",
      body: JSON.stringify({ qrImageUrl }),
    });
    return res.qrImageUrl;
  },

  // --- ADMIN TOOLS ---
  async getAdminUsers(): Promise<User[]> {
    const res = await request<{ users: User[] }>("/admin/users");
    return res?.users || [];
  },

  async updateAdminUserRole(id: string, role: "admin" | "user"): Promise<User> {
    const res = await request<{ user: User }>(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
    return res.user;
  },

  async getAdminLogs(): Promise<ActivityLog[]> {
    const res = await request<{ logs: ActivityLog[] }>("/logs");
    return res?.logs || [];
  },

  async initializeDatabaseSchema(): Promise<{ success: boolean; log: string }> {
    return await request<{ success: boolean; log: string }>("/admin/db-init", {
      method: "POST",
    });
  },

  // --- AI SCAN ---
  async scanReceipt(base64Image: string, mimeType?: string): Promise<{ totalAmount: number; categoryName: string; description: string; date: string }> {
    const res = await request<{ result: { totalAmount: number; categoryName: string; description: string; date: string } }>("/scan-receipt", {
      method: "POST",
      body: JSON.stringify({ base64Image, mimeType }),
    });
    return res.result;
  }
};

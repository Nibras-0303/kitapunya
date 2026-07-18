import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import * as schema from "../db/schema.js";

const { Pool } = pg;

// Types
export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  color: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  type: string; // 'income' | 'expense'
  icon: string;
  color: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  amount: number;
  type: string; // 'income' | 'expense' | 'transfer'
  description: string | null;
  date: Date;
  receiptImageUrl: string | null;
  createdAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  month: string; // 'YYYY-MM'
  createdAt: Date;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
  createdAt: Date;
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: string;
  buyPrice: number;
  currentPrice: number;
  currentValue: number;
  shares: number | null;
  initialCapital: number;
  sourceAccountId: string | null;
  status: "Aktif" | "Dijual";
  purchaseDate: Date;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  action: string;
  details: string | null;
  createdAt: Date;
}

// Memory database storage for fallback
class MemoryDatabase {
  users: User[] = [];
  accounts: Account[] = [];
  categories: Category[] = [];
  transactions: Transaction[] = [];
  budgets: Budget[] = [];
  savingsGoals: SavingsGoal[] = [];
  investments: Investment[] = [];
  qrisUrl: string = "https://images.unsplash.com/photo-1680120519121-4fa30e872d82?q=80&w=600&auto=format&fit=crop";
  activityLogs: ActivityLog[] = [];

  constructor() {
    this.seedDefaultData();
  }

  seedDefaultData() {
    // 3 Main Profiles
    const nibrasId = "11111111-1111-1111-1111-111111111111";
    const zenitaId = "22222222-2222-2222-2222-222222222222";
    const bersamaId = "33333333-3333-3333-3333-333333333333";

    this.users.push({
      id: nibrasId,
      email: "nibras@kitapunya.id",
      fullName: "Nibras",
      role: "user",
      createdAt: new Date(),
    });

    this.users.push({
      id: zenitaId,
      email: "zenita@kitapunya.id",
      fullName: "Zenita",
      role: "user",
      createdAt: new Date(),
    });

    this.users.push({
      id: bersamaId,
      email: "bersama@kitapunya.id",
      fullName: "Uang Bersama",
      role: "admin",
      createdAt: new Date(),
    });

    // Default Categories: Simplified list of categories (income & expense)
    const defaultCats = [
      // Pemasukan
      { id: "c0000000-0000-0000-0000-000000000001", userId: null, name: "Gaji", type: "income" as const, icon: "Briefcase", color: "#10B981" },
      { id: "c0000000-0000-0000-0000-000000000002", userId: null, name: "Bonus", type: "income" as const, icon: "TrendingUp", color: "#059669" },
      { id: "c0000000-0000-0000-0000-000000000003", userId: null, name: "Lain-lain", type: "income" as const, icon: "Tag", color: "#6B7280" },
      // Pengeluaran
      { id: "c0000000-0000-0000-0000-000000000004", userId: null, name: "Jajan", type: "expense" as const, icon: "ShoppingBag", color: "#EC4899" },
      { id: "c0000000-0000-0000-0000-000000000005", userId: null, name: "Makan", type: "expense" as const, icon: "Utensils", color: "#EF4444" },
      { id: "c0000000-0000-0000-0000-000000000006", userId: null, name: "Kebutuhan", type: "expense" as const, icon: "Home", color: "#3B82F6" },
      { id: "c0000000-0000-0000-0000-000000000007", userId: null, name: "Tabungan", type: "expense" as const, icon: "Target", color: "#8B5CF6" },
      { id: "c0000000-0000-0000-0000-000000000008", userId: null, name: "Lain-lain", type: "expense" as const, icon: "Tag", color: "#6B7280" },
    ];
    this.categories.push(...defaultCats.map(c => ({ ...c, createdAt: new Date() })));

    // Default Accounts: Rekening Pribadi Nibras, Rekening Pribadi Zenita, SeaBank Tabungan, SeaBank Jajan Bulanan
    const defaultAccs = [
      // Nibras
      { id: "a0000000-0000-0000-0000-000000000101", userId: nibrasId, name: "Mandiri", type: "personal", balance: 1500000, color: "#3B82F6", createdAt: new Date() },
      // Zenita
      { id: "a0000000-0000-0000-0000-000000000201", userId: zenitaId, name: "BCA", type: "personal", balance: 1500000, color: "#EC4899", createdAt: new Date() },
      // Uang Bersama
      { id: "a0000000-0000-0000-0000-000000000301", userId: bersamaId, name: "SeaBank Tabungan", type: "shared_savings", balance: 5000000, color: "#10B981", createdAt: new Date() },
      { id: "a0000000-0000-0000-0000-000000000302", userId: bersamaId, name: "SeaBank Jajan Bulanan", type: "shared_spending", balance: 1250000, color: "#F59E0B", createdAt: new Date() },
    ];
    this.accounts.push(...defaultAccs);

    // Default Goals: Dana Darurat, Menikah, Rumah, Liburan
    const defaultGoals = [
      { id: "g0000000-0000-0000-0000-000000000001", userId: bersamaId, name: "Dana Darurat", targetAmount: 10000000, currentAmount: 0, deadline: null, createdAt: new Date() },
      { id: "g0000000-0000-0000-0000-000000000002", userId: bersamaId, name: "Menikah", targetAmount: 50000000, currentAmount: 0, deadline: null, createdAt: new Date() },
      { id: "g0000000-0000-0000-0000-000000000003", userId: bersamaId, name: "Rumah", targetAmount: 150000000, currentAmount: 0, deadline: null, createdAt: new Date() },
      { id: "g0000000-0000-0000-0000-000000000004", userId: bersamaId, name: "Liburan", targetAmount: 15000000, currentAmount: 0, deadline: null, createdAt: new Date() },
    ];
    this.savingsGoals.push(...defaultGoals);

    // Default Activity Logs
    this.activityLogs.push({
      id: "log-init",
      userId: bersamaId,
      action: "INITIALIZE",
      details: "Sistem pengurusan kewangan berjaya dimulakan",
      createdAt: new Date(),
    });
  }
}

const memoryDb = new MemoryDatabase();

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    balance DOUBLE PRECISION DEFAULT 0 NOT NULL,
    color VARCHAR(50) DEFAULT '#10B981' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    icon VARCHAR(100) DEFAULT 'Tag' NOT NULL,
    color VARCHAR(50) DEFAULT '#10B981' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
    amount DOUBLE PRECISION NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    date TIMESTAMP DEFAULT NOW() NOT NULL,
    receipt_image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES transaction_categories(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION NOT NULL,
    month VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_amount DOUBLE PRECISION NOT NULL,
    current_amount DOUBLE PRECISION DEFAULT 0 NOT NULL,
    deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    buy_price DOUBLE PRECISION NOT NULL,
    current_price DOUBLE PRECISION DEFAULT 0 NOT NULL,
    current_value DOUBLE PRECISION NOT NULL,
    shares DOUBLE PRECISION,
    initial_capital DOUBLE PRECISION DEFAULT 0 NOT NULL,
    source_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Aktif' NOT NULL,
    purchase_date TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS investment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    price DOUBLE PRECISION NOT NULL,
    date TIMESTAMP DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    image_url TEXT,
    total_amount DOUBLE PRECISION NOT NULL,
    merchant_name VARCHAR(255),
    scan_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    quantity DOUBLE PRECISION DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    qr_image_url TEXT NOT NULL,
    currency VARCHAR(50) DEFAULT 'IDR' NOT NULL,
    language VARCHAR(50) DEFAULT 'Indonesia' NOT NULL,
    theme VARCHAR(50) DEFAULT 'System' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`
];

// Drizzle Client (Lazily initialized)
let dbClient: any = null;
let pgPool: any = null;
let schemaInitialized = false;
let dbInitPromise: Promise<void> | null = null;
let useMemoryFallback = false;

export async function seedDb(db: any) {
  try {
    console.log("Seeding PostgreSQL Database with standard profiles, accounts, and categories...");

    const nibrasId = "11111111-1111-1111-1111-111111111111";
    const zenitaId = "22222222-2222-2222-2222-222222222222";
    const bersamaId = "33333333-3333-3333-3333-333333333333";

    // 1. Check Profiles / Users
    const existingProfiles = await db.select().from(schema.users);
    if (existingProfiles && existingProfiles.length > 0) {
      console.log("Profile sudah ada");
    } else {
      await db.insert(schema.users).values([
        { id: nibrasId, email: "nibras@kitapunya.id", fullName: "Nibras", role: "user" },
        { id: zenitaId, email: "zenita@kitapunya.id", fullName: "Zenita", role: "user" },
        { id: bersamaId, email: "bersama@kitapunya.id", fullName: "Uang Bersama", role: "admin" },
      ]).onConflictDoNothing();
      console.log("✓ Profile dibuat");
    }

    // 2. Check Accounts
    const existingAccounts = await db.select().from(schema.accounts);
    if (existingAccounts && existingAccounts.length > 0) {
      console.log("Accounts sudah ada");
    } else {
      await db.insert(schema.accounts).values([
        // Nibras
        { id: "a0000000-0000-0000-0000-000000000101", userId: nibrasId, name: "Mandiri", type: "personal", balance: 1500000, color: "#3B82F6" },
        // Zenita
        { id: "a0000000-0000-0000-0000-000000000201", userId: zenitaId, name: "BCA", type: "personal", balance: 1500000, color: "#EC4899" },
        // Uang Bersama
        { id: "a0000000-0000-0000-0000-000000000301", userId: bersamaId, name: "SeaBank Tabungan", type: "shared_savings", balance: 5000000, color: "#10B981" },
        { id: "a0000000-0000-0000-0000-000000000302", userId: bersamaId, name: "SeaBank Jajan Bulanan", type: "shared_spending", balance: 1250000, color: "#F59E0B" },
      ]).onConflictDoNothing();
      console.log("✓ Rekening dibuat");
    }

    // 3. Check Categories
    const existingCategories = await db.select().from(schema.categories);
    if (existingCategories && existingCategories.length > 0) {
      console.log("Categories sudah ada");
    } else {
      const defaultCats = [
        // Pemasukan
        { id: "c0000000-0000-0000-0000-000000000001", name: "Gaji", type: "income", icon: "Briefcase", color: "#10B981" },
        { id: "c0000000-0000-0000-0000-000000000002", name: "Bonus", type: "income", icon: "TrendingUp", color: "#059669" },
        { id: "c0000000-0000-0000-0000-000000000003", name: "Lain-lain", type: "income", icon: "Tag", color: "#6B7280" },
        // Pengeluaran
        { id: "c0000000-0000-0000-0000-000000000004", name: "Jajan", type: "expense", icon: "ShoppingBag", color: "#EC4899" },
        { id: "c0000000-0000-0000-0000-000000000005", name: "Makan", type: "expense", icon: "Utensils", color: "#EF4444" },
        { id: "c0000000-0000-0000-0000-000000000006", name: "Kebutuhan", type: "expense", icon: "Home", color: "#3B82F6" },
        { id: "c0000000-0000-0000-0000-000000000007", name: "Tabungan", type: "expense", icon: "Target", color: "#8B5CF6" },
        { id: "c0000000-0000-0000-0000-000000000008", name: "Lain-lain", type: "expense", icon: "Tag", color: "#6B7280" },
      ];
      for (const cat of defaultCats) {
        await db.insert(schema.categories).values({
          id: cat.id,
          userId: null,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
        }).onConflictDoNothing();
      }
      console.log("✓ Kategori dibuat");
    }

    // 4. Check Goals
    const existingGoals = await db.select().from(schema.savingsGoals);
    if (existingGoals && existingGoals.length > 0) {
      console.log("Goals sudah ada");
    } else {
      await db.insert(schema.savingsGoals).values([
        { id: "g0000000-0000-0000-0000-000000000001", userId: bersamaId, name: "Dana Darurat", targetAmount: 10000000, currentAmount: 0 },
        { id: "g0000000-0000-0000-0000-000000000002", userId: bersamaId, name: "Menikah", targetAmount: 50000000, currentAmount: 0 },
        { id: "g0000000-0000-0000-0000-000000000003", userId: bersamaId, name: "Rumah", targetAmount: 150000000, currentAmount: 0 },
        { id: "g0000000-0000-0000-0000-000000000004", userId: bersamaId, name: "Liburan", targetAmount: 15000000, currentAmount: 0 },
      ]).onConflictDoNothing();
      console.log("✓ Goals dibuat");
    }

    // 5. Check Settings
    const existingSettings = await db.select().from(schema.qrisConfig).where(eq(schema.qrisConfig.id, "default"));
    if (existingSettings && existingSettings.length > 0) {
      console.log("Settings sudah ada");
    } else {
      await db.insert(schema.qrisConfig).values({
        id: "default",
        qrImageUrl: "https://images.unsplash.com/photo-1680120519121-4fa30e872d82?q=80&w=600&auto=format&fit=crop",
        currency: "IDR",
        language: "Indonesia",
        theme: "System",
      }).onConflictDoNothing();
      console.log("✓ Settings dibuat");
    }

    console.log("✓ Seeder selesai");
  } catch (err) {
    console.error("Error seeding PostgreSQL database:", err);
  }
}

function getDb() {
  if (useMemoryFallback) {
    return null;
  }
  if (process.env.DATABASE_URL) {
    if (!dbClient) {
      try {
        pgPool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });
        
        // Prevent unhandled exception crashes on idle database clients
        pgPool.on("error", (err: any) => {
          console.error("Unexpected error on idle PostgreSQL client:", err);
        });

        dbClient = drizzle(pgPool, { schema });
        console.log("PostgreSQL Database client created successfully.");
        
        // Auto initialize tables in the background lazily with a connection test
        if (!schemaInitialized && !dbInitPromise) {
          dbInitPromise = (async () => {
            try {
              console.log("[db] Testing database connection...");
              // Test the connection with a fast SELECT 1
              await dbClient.execute(sql`SELECT 1`);
              console.log("[db] Database connection test succeeded. Auto-initializing tables...");
              
              for (const statement of DDL_STATEMENTS) {
                try {
                  await dbClient.execute(sql.raw(statement));
                } catch (ddlErr: any) {
                  console.warn(`[db] DDL statement warning (continuing): ${statement.substring(0, 50)}... Error:`, ddlErr.message || ddlErr);
                }
              }
              
              try {
                await seedDb(dbClient);
              } catch (seedErr: any) {
                console.error("[db] Database seed failed:", seedErr.message || seedErr);
              }
              
              schemaInitialized = true;
              console.log("[db] Database initialization completed successfully!");
            } catch (err: any) {
              console.error("[db] Database connection test failed. Falling back to Memory mode.", err.message || err);
              useMemoryFallback = true;
              dbClient = null; // Set to null so that we bypass DB completely and use memory mode
            }
          })();
        }
      } catch (err) {
        console.error("Failed to connect to PostgreSQL database, falling back to Memory mode:", err);
        useMemoryFallback = true;
        dbClient = null;
      }
    }
    return dbClient;
  }
  return null;
}

function getTargetUserIds(userId: string): string[] {
  const nibrasId = "11111111-1111-1111-1111-111111111111";
  const zenitaId = "22222222-2222-2222-2222-222222222222";
  const bersamaId = "33333333-3333-3333-3333-333333333333";
  if (userId === nibrasId || userId === zenitaId || userId === bersamaId) {
    return [nibrasId, zenitaId, bersamaId];
  }
  return [userId];
}

// Service helper methods implementing operations on either DB or Memory
export const dbService = {
  async ensureInitialized(): Promise<void> {
    const db = getDb();
    if (!db) return;
    if (dbInitPromise) {
      // Add a 1000ms timeout so we don't freeze the request if the database is initializing slowly
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout waiting for database initialization (1000ms exceeded)")), 1000);
      });
      try {
        await Promise.race([dbInitPromise, timeoutPromise]);
      } catch (err: any) {
        console.warn("[db] Proceeding in background: " + (err.message || err));
      }
    }
  },

  // --- USERS ---
  async getUser(id: string): Promise<User | null> {
    const db = getDb();
    if (db) {
      const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
      return result[0] || null;
    }
    return memoryDb.users.find((u) => u.id === id) || null;
  },

  async createUser(user: { id: string; email: string; fullName: string | null; role?: string }): Promise<User> {
    const db = getDb();
    const newUser: User = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role || "user",
      createdAt: new Date(),
    };

    if (db) {
      await db.insert(schema.users).values({
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      }).onConflictDoNothing();
      return newUser;
    }

    const exists = memoryDb.users.find(u => u.id === user.id);
    if (!exists) {
      memoryDb.users.push(newUser);
    }
    return exists || newUser;
  },

  async getUsers(): Promise<User[]> {
    const db = getDb();
    if (db) {
      return await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
    }
    return [...memoryDb.users].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async updateUserRole(id: string, role: string): Promise<User | null> {
    const db = getDb();
    if (db) {
      const result = await db.update(schema.users)
        .set({ role })
        .where(eq(schema.users.id, id))
        .returning();
      return result[0] || null;
    }
    const user = memoryDb.users.find(u => u.id === id);
    if (user) {
      user.role = role;
      return user;
    }
    return null;
  },

  // --- FINANCIAL ACCOUNTS ---
  async getAccounts(userId: string): Promise<Account[]> {
    const db = getDb();
    const nibrasId = "11111111-1111-1111-1111-111111111111";
    const zenitaId = "22222222-2222-2222-2222-222222222222";
    const bersamaId = "33333333-3333-3333-3333-333333333333";

    if (db) {
      // Check if accounts exist for the active user (profileAktif)
      const currentProfileAccounts = await db.select().from(schema.accounts).where(eq(schema.accounts.userId, userId));
      if (currentProfileAccounts.length === 0) {
        console.log(`No database accounts found for profile ${userId}, creating defaults...`);
        if (userId === nibrasId) {
          await db.insert(schema.accounts).values({
            id: crypto.randomUUID(),
            userId: nibrasId,
            name: "Rekening Pribadi",
            type: "personal",
            balance: 1500000,
            color: "#3B82F6"
          });
        } else if (userId === zenitaId) {
          await db.insert(schema.accounts).values({
            id: crypto.randomUUID(),
            userId: zenitaId,
            name: "Rekening Pribadi",
            type: "personal",
            balance: 1500000,
            color: "#EC4899"
          });
        } else if (userId === bersamaId) {
          await db.insert(schema.accounts).values([
            {
              id: crypto.randomUUID(),
              userId: bersamaId,
              name: "SeaBank Tabungan Bersama",
              type: "shared_savings",
              balance: 5000000,
              color: "#10B981"
            },
            {
              id: crypto.randomUUID(),
              userId: bersamaId,
              name: "SeaBank Operasional Bersama",
              type: "shared_spending",
              balance: 1250000,
              color: "#F59E0B"
            }
          ]);
        }
      }

      // Query raw accounts
      const targetIds = getTargetUserIds(userId);
      const rawAccounts = await db.select().from(schema.accounts).where(inArray(schema.accounts.userId, targetIds));

      // Filter and Map names
      let filtered: Account[] = [];
      if (userId === nibrasId) {
        filtered = rawAccounts.filter(a => a.userId === nibrasId || a.userId === bersamaId);
      } else if (userId === zenitaId) {
        filtered = rawAccounts.filter(a => a.userId === zenitaId || a.userId === bersamaId);
      } else if (userId === bersamaId) {
        filtered = rawAccounts.filter(a => a.userId === bersamaId);
      } else {
        filtered = rawAccounts;
      }

      return filtered.map(a => {
        if (userId === nibrasId) {
          if (a.userId === nibrasId) {
            return { ...a, name: "Rekening Pribadi Nibras" };
          }
          if (a.name.includes("Tabungan")) {
            return { ...a, name: "SeaBank Tabungan Bersama (Transfer)" };
          }
          if (a.name.includes("Jajan") || a.name.includes("Operasional")) {
            return { ...a, name: "SeaBank Operasional Bersama (Transfer)" };
          }
        } else if (userId === zenitaId) {
          if (a.userId === zenitaId) {
            return { ...a, name: "Rekening Pribadi Zenita" };
          }
          if (a.name.includes("Tabungan")) {
            return { ...a, name: "SeaBank Tabungan Bersama (Transfer)" };
          }
          if (a.name.includes("Jajan") || a.name.includes("Operasional")) {
            return { ...a, name: "SeaBank Operasional Bersama (Transfer)" };
          }
        } else if (userId === bersamaId) {
          if (a.name.includes("Tabungan")) {
            return { ...a, name: "SeaBank Tabungan Bersama" };
          }
          if (a.name.includes("Jajan") || a.name.includes("Operasional")) {
            return { ...a, name: "SeaBank Operasional Bersama" };
          }
        }
        return a;
      });

    } else {
      // Memory Fallback
      const currentProfileAccountsMemory = memoryDb.accounts.filter(a => a.userId === userId);
      if (currentProfileAccountsMemory.length === 0) {
        console.log(`No memory accounts found for profile ${userId}, creating defaults...`);
        if (userId === nibrasId) {
          memoryDb.accounts.push({
            id: "a0000000-0000-0000-0000-000000000101",
            userId: nibrasId,
            name: "Rekening Pribadi",
            type: "personal",
            balance: 1500000,
            color: "#3B82F6",
            createdAt: new Date()
          });
        } else if (userId === zenitaId) {
          memoryDb.accounts.push({
            id: "a0000000-0000-0000-0000-000000000201",
            userId: zenitaId,
            name: "Rekening Pribadi",
            type: "personal",
            balance: 1500000,
            color: "#EC4899",
            createdAt: new Date()
          });
        } else if (userId === bersamaId) {
          memoryDb.accounts.push(
            {
              id: "a0000000-0000-0000-0000-000000000301",
              userId: bersamaId,
              name: "SeaBank Tabungan Bersama",
              type: "shared_savings",
              balance: 5000000,
              color: "#10B981",
              createdAt: new Date()
            },
            {
              id: "a0000000-0000-0000-0000-000000000302",
              userId: bersamaId,
              name: "SeaBank Operasional Bersama",
              type: "shared_spending",
              balance: 1250000,
              color: "#F59E0B",
              createdAt: new Date()
            }
          );
        }
      }

      const targetIds = getTargetUserIds(userId);
      const rawAccounts = memoryDb.accounts.filter((a) => targetIds.includes(a.userId));

      let filtered: Account[] = [];
      if (userId === nibrasId) {
        filtered = rawAccounts.filter(a => a.userId === nibrasId || a.userId === bersamaId);
      } else if (userId === zenitaId) {
        filtered = rawAccounts.filter(a => a.userId === zenitaId || a.userId === bersamaId);
      } else if (userId === bersamaId) {
        filtered = rawAccounts.filter(a => a.userId === bersamaId);
      } else {
        filtered = rawAccounts;
      }

      return filtered.map(a => {
        if (userId === nibrasId) {
          if (a.userId === nibrasId) {
            return { ...a, name: "Rekening Pribadi Nibras" };
          }
          if (a.name.includes("Tabungan")) {
            return { ...a, name: "SeaBank Tabungan Bersama (Transfer)" };
          }
          if (a.name.includes("Jajan") || a.name.includes("Operasional")) {
            return { ...a, name: "SeaBank Operasional Bersama (Transfer)" };
          }
        } else if (userId === zenitaId) {
          if (a.userId === zenitaId) {
            return { ...a, name: "Rekening Pribadi Zenita" };
          }
          if (a.name.includes("Tabungan")) {
            return { ...a, name: "SeaBank Tabungan Bersama (Transfer)" };
          }
          if (a.name.includes("Jajan") || a.name.includes("Operasional")) {
            return { ...a, name: "SeaBank Operasional Bersama (Transfer)" };
          }
        } else if (userId === bersamaId) {
          if (a.name.includes("Tabungan")) {
            return { ...a, name: "SeaBank Tabungan Bersama" };
          }
          if (a.name.includes("Jajan") || a.name.includes("Operasional")) {
            return { ...a, name: "SeaBank Operasional Bersama" };
          }
        }
        return a;
      });
    }
  },

  async createAccount(acc: { userId: string; name: string; type: string; balance: number; color?: string }): Promise<Account> {
    const db = getDb();
    const id = crypto.randomUUID();
    const newAcc: Account = {
      id,
      userId: acc.userId,
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      color: acc.color || "#10B981",
      createdAt: new Date(),
    };

    if (db) {
      const result = await db.insert(schema.accounts).values({
        userId: acc.userId,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        color: acc.color,
      }).returning();
      return result[0];
    }

    memoryDb.accounts.push(newAcc);
    return newAcc;
  },

  async updateAccount(id: string, acc: { name?: string; type?: string; balance?: number; color?: string }): Promise<Account | null> {
    const db = getDb();
    if (db) {
      const result = await db.update(schema.accounts)
        .set(acc)
        .where(eq(schema.accounts.id, id))
        .returning();
      return result[0] || null;
    }

    const idx = memoryDb.accounts.findIndex(a => a.id === id);
    if (idx !== -1) {
      memoryDb.accounts[idx] = { ...memoryDb.accounts[idx], ...acc };
      return memoryDb.accounts[idx];
    }
    return null;
  },

  async deleteAccount(id: string): Promise<boolean> {
    const db = getDb();
    if (db) {
      const result = await db.delete(schema.accounts).where(eq(schema.accounts.id, id)).returning();
      return result.length > 0;
    }

    const initialLen = memoryDb.accounts.length;
    memoryDb.accounts = memoryDb.accounts.filter(a => a.id !== id);
    return memoryDb.accounts.length < initialLen;
  },

  // --- CATEGORIES ---
  async getCategories(userId: string): Promise<Category[]> {
    const db = getDb();
    let cats: Category[] = [];
    if (db) {
      cats = await db.select().from(schema.categories).where(
        sql`${schema.categories.userId} = ${userId} OR ${schema.categories.userId} IS NULL`
      );
    } else {
      cats = memoryDb.categories.filter((c) => c.userId === userId || c.userId === null);
    }
    return cats.map(c => {
      if (c.name === "Lainnya" || c.name === "Lainnya ") {
        return { ...c, name: "Lain-lain" };
      }
      return c;
    });
  },

  async createCategory(cat: { userId: string | null; name: string; type: string; icon?: string; color?: string }): Promise<Category> {
    const db = getDb();
    const id = crypto.randomUUID();
    const newCat: Category = {
      id,
      userId: cat.userId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon || "Tag",
      color: cat.color || "#10B981",
      createdAt: new Date(),
    };

    if (db) {
      const result = await db.insert(schema.categories).values({
        userId: cat.userId,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
      }).returning();
      return result[0];
    }

    memoryDb.categories.push(newCat);
    return newCat;
  },

  async updateCategory(id: string, cat: { name?: string; type?: string; icon?: string; color?: string }): Promise<Category | null> {
    const db = getDb();
    if (db) {
      const result = await db.update(schema.categories)
        .set(cat)
        .where(eq(schema.categories.id, id))
        .returning();
      return result[0] || null;
    }

    const idx = memoryDb.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      memoryDb.categories[idx] = { ...memoryDb.categories[idx], ...cat };
      return memoryDb.categories[idx];
    }
    return null;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const db = getDb();
    if (db) {
      const result = await db.delete(schema.categories).where(eq(schema.categories.id, id)).returning();
      return result.length > 0;
    }

    const initialLen = memoryDb.categories.length;
    memoryDb.categories = memoryDb.categories.filter(c => c.id !== id);
    return memoryDb.categories.length < initialLen;
  },

  // --- TRANSACTIONS ---
  async getTransactions(userId: string, filters?: { accountId?: string; categoryId?: string; startDate?: Date; endDate?: Date; search?: string }): Promise<Transaction[]> {
    const db = getDb();
    const targetIds = getTargetUserIds(userId);
    if (db) {
      let conditions = [inArray(schema.transactions.userId, targetIds)];

      if (filters?.accountId) {
        conditions.push(eq(schema.transactions.accountId, filters.accountId));
      }
      if (filters?.categoryId) {
        conditions.push(eq(schema.transactions.categoryId, filters.categoryId));
      }
      if (filters?.startDate) {
        conditions.push(gte(schema.transactions.date, filters.startDate));
      }
      if (filters?.endDate) {
        conditions.push(lte(schema.transactions.date, filters.endDate));
      }

      // Execute and apply client-side text filtering if search is given
      let results = await db.select().from(schema.transactions).where(and(...conditions)).orderBy(desc(schema.transactions.date));

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter((tx: any) => tx.description?.toLowerCase().includes(searchLower));
      }

      return results;
    }

    let items = memoryDb.transactions.filter(t => targetIds.includes(t.userId));

    if (filters?.accountId) {
      items = items.filter(t => t.accountId === filters.accountId || t.toAccountId === filters.accountId);
    }
    if (filters?.categoryId) {
      items = items.filter(t => t.categoryId === filters.categoryId);
    }
    if (filters?.startDate) {
      items = items.filter(t => t.date.getTime() >= filters.startDate!.getTime());
    }
    if (filters?.endDate) {
      items = items.filter(t => t.date.getTime() <= filters.endDate!.getTime());
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      items = items.filter(t => t.description?.toLowerCase().includes(s));
    }

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  },

  async getAllTransactionsForAdmin(): Promise<Transaction[]> {
    const db = getDb();
    if (db) {
      return await db.select().from(schema.transactions).orderBy(desc(schema.transactions.date));
    }
    return [...memoryDb.transactions].sort((a, b) => b.date.getTime() - a.date.getTime());
  },

  async createTransaction(tx: {
    userId: string;
    accountId: string;
    toAccountId?: string | null;
    categoryId?: string | null;
    amount: number;
    type: string;
    description?: string | null;
    date?: Date;
    receiptImageUrl?: string | null;
    transferToAccountId?: string | null;
    paidBy?: string | null;
    reimburse?: boolean | null;
  }): Promise<Transaction> {
    const db = getDb();
    const id = crypto.randomUUID();
    const finalDate = tx.date || new Date();
    
    // Check if this is an expense with "Tabungan" category and has a transferToAccountId
    const isTabunganCategory = tx.categoryId === "c0000000-0000-0000-0000-000000000007";
    const linkedBersamaAccountId = tx.transferToAccountId && tx.transferToAccountId !== "pribadi" ? tx.transferToAccountId : null;

    let finalDescription = tx.description || null;
    if (tx.paidBy === "nibras") {
      finalDescription = `${tx.description || "Transaksi"} [Paid by: Nibras]${tx.reimburse ? " [Reimbursed]" : ""}`;
    } else if (tx.paidBy === "zenita") {
      finalDescription = `${tx.description || "Transaksi"} [Paid by: Zenita]${tx.reimburse ? " [Reimbursed]" : ""}`;
    }

    const newTx: Transaction = {
      id,
      userId: tx.userId,
      accountId: tx.accountId,
      toAccountId: linkedBersamaAccountId || tx.toAccountId || null,
      categoryId: tx.categoryId || null,
      amount: tx.amount,
      type: tx.type,
      description: finalDescription,
      date: finalDate,
      receiptImageUrl: tx.receiptImageUrl || null,
      createdAt: new Date(),
    };

    // Update Account balances based on transaction type
    const adjustBalance = async (accId: string, amount: number) => {
      if (db) {
        await db.execute(sql`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${accId}`);
      } else {
        const acc = memoryDb.accounts.find(a => a.id === accId);
        if (acc) acc.balance += amount;
      }
    };

    if (tx.type === "income") {
      await adjustBalance(tx.accountId, tx.amount);
    } else if (tx.type === "expense") {
      await adjustBalance(tx.accountId, -tx.amount);
    } else if (tx.type === "transfer" && tx.toAccountId) {
      await adjustBalance(tx.accountId, -tx.amount);
      await adjustBalance(tx.toAccountId, tx.amount);
    }

    if (db) {
      const result = await db.insert(schema.transactions).values({
        id,
        userId: tx.userId,
        accountId: tx.accountId,
        toAccountId: linkedBersamaAccountId || tx.toAccountId || null,
        categoryId: tx.categoryId || null,
        amount: tx.amount,
        type: tx.type,
        description: finalDescription,
        date: finalDate,
        receiptImageUrl: tx.receiptImageUrl,
      }).returning();

      // Handle automatic linked transaction for Tabungan to Bersama
      if (tx.type === "expense" && isTabunganCategory && linkedBersamaAccountId) {
        const linkedId = crypto.randomUUID();
        const userProfile = await db.select().from(schema.users).where(eq(schema.users.id, tx.userId));
        const userName = userProfile[0]?.fullName || "Pribadi";
        
        // Adjust balance for the shared account
        await adjustBalance(linkedBersamaAccountId, tx.amount);
        
        // Insert linked transaction
        await db.insert(schema.transactions).values({
          id: linkedId,
          userId: "33333333-3333-3333-3333-333333333333", // Bersama
          accountId: linkedBersamaAccountId, // SeaBank Account
          toAccountId: tx.accountId, // Point back to source account
          categoryId: tx.categoryId || null,
          amount: tx.amount,
          type: "income", // incoming transaction
          description: `[Linked Tabungan] Simpanan dari ${userName}: ${tx.description || "Tabungan harian"}`,
          date: finalDate,
          receiptImageUrl: tx.receiptImageUrl,
        });
      }

      // Handle automatic reimbursement logic
      if (tx.reimburse && (tx.paidBy === "nibras" || tx.paidBy === "zenita")) {
        const payerUserId = tx.paidBy === "nibras" ? "11111111-1111-1111-1111-111111111111" : "22222222-2222-2222-2222-222222222222";
        const payerAccountId = tx.paidBy === "nibras" ? "a0000000-0000-0000-0000-000000000101" : "a0000000-0000-0000-0000-000000000201";
        const reimbursementId = crypto.randomUUID();

        // Increase payer's personal account balance
        await adjustBalance(payerAccountId, tx.amount);

        // Record reimbursement transaction in the payer's personal profile as "income"
        await db.insert(schema.transactions).values({
          id: reimbursementId,
          userId: payerUserId,
          accountId: payerAccountId,
          categoryId: "c0000000-0000-0000-0000-000000000003", // Lainnya
          amount: tx.amount,
          type: "income",
          description: `[Reimbursement] ${tx.description || "Ganti rugi perbelanjaan"}`,
          date: finalDate,
        });
      }

      return result[0];
    }

    // MEMORY DB FALLBACK
    memoryDb.transactions.push(newTx);
    
    if (tx.type === "expense" && isTabunganCategory && linkedBersamaAccountId) {
      const linkedId = crypto.randomUUID();
      const userName = tx.userId === "11111111-1111-1111-1111-111111111111" ? "Nibras" : "Zenita";
      
      await adjustBalance(linkedBersamaAccountId, tx.amount);
      
      const linkedTx: Transaction = {
        id: linkedId,
        userId: "33333333-3333-3333-3333-333333333333",
        accountId: linkedBersamaAccountId,
        toAccountId: tx.accountId,
        categoryId: tx.categoryId || null,
        amount: tx.amount,
        type: "income",
        description: `[Linked Tabungan] Simpanan dari ${userName}: ${tx.description || "Tabungan harian"}`,
        date: finalDate,
        receiptImageUrl: tx.receiptImageUrl || null,
        createdAt: new Date(),
      };
      memoryDb.transactions.push(linkedTx);
    }

    // Handle automatic reimbursement logic in Memory Mode
    if (tx.reimburse && (tx.paidBy === "nibras" || tx.paidBy === "zenita")) {
      const payerUserId = tx.paidBy === "nibras" ? "11111111-1111-1111-1111-111111111111" : "22222222-2222-2222-2222-222222222222";
      const payerAccountId = tx.paidBy === "nibras" ? "a0000000-0000-0000-0000-000000000101" : "a0000000-0000-0000-0000-000000000201";
      const reimbursementId = crypto.randomUUID();

      await adjustBalance(payerAccountId, tx.amount);

      const reimbursementTx: Transaction = {
        id: reimbursementId,
        userId: payerUserId,
        accountId: payerAccountId,
        toAccountId: null,
        categoryId: "c0000000-0000-0000-0000-000000000003",
        amount: tx.amount,
        type: "income",
        description: `[Reimbursement] ${tx.description || "Ganti rugi perbelanjaan"}`,
        date: finalDate,
        receiptImageUrl: null,
        createdAt: new Date(),
      };
      memoryDb.transactions.push(reimbursementTx);
    }

    return newTx;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const db = getDb();

    // Revert balance before deletion
    const getTx = async () => {
      if (db) {
        const result = await db.select().from(schema.transactions).where(eq(schema.transactions.id, id));
        return result[0];
      }
      return memoryDb.transactions.find(t => t.id === id);
    };

    const tx = await getTx();
    if (!tx) return false;

    const adjustBalance = async (accId: string, amount: number) => {
      if (db) {
        await db.execute(sql`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${accId}`);
      } else {
        const acc = memoryDb.accounts.find(a => a.id === accId);
        if (acc) acc.balance += amount;
      }
    };

    if (tx.type === "income") {
      await adjustBalance(tx.accountId, -tx.amount);
    } else if (tx.type === "expense") {
      await adjustBalance(tx.accountId, tx.amount);
    } else if (tx.type === "transfer" && tx.toAccountId) {
      await adjustBalance(tx.accountId, tx.amount);
      await adjustBalance(tx.toAccountId, -tx.amount);
    }

    // Check if this is a linked transaction to delete the sibling
    const isTabunganCategory = tx.categoryId === "c0000000-0000-0000-0000-000000000007";
    const isLinkedExpense = tx.type === "expense" && isTabunganCategory && tx.toAccountId && (tx.toAccountId === "a0000000-0000-0000-0000-000000000301" || tx.toAccountId === "a0000000-0000-0000-0000-000000000302");

    if (isLinkedExpense) {
      const findSibling = async () => {
        if (db) {
          const results = await db.select().from(schema.transactions).where(and(
            eq(schema.transactions.userId, "33333333-3333-3333-3333-333333333333"),
            eq(schema.transactions.accountId, tx.toAccountId),
            eq(schema.transactions.toAccountId, tx.accountId),
            eq(schema.transactions.amount, tx.amount),
            eq(schema.transactions.type, "income")
          ));
          return results[0];
        }
        return memoryDb.transactions.find(t => 
          t.userId === "33333333-3333-3333-3333-333333333333" &&
          t.accountId === tx.toAccountId &&
          t.toAccountId === tx.accountId &&
          t.amount === tx.amount &&
          t.type === "income"
        );
      };

      const sibling = await findSibling();
      if (sibling) {
        // Revert sibling's balance
        await adjustBalance(sibling.accountId, -sibling.amount);
        // Delete sibling
        if (db) {
          await db.delete(schema.transactions).where(eq(schema.transactions.id, sibling.id));
        } else {
          memoryDb.transactions = memoryDb.transactions.filter(t => t.id !== sibling.id);
        }
      }
    }

    if (db) {
      const result = await db.delete(schema.transactions).where(eq(schema.transactions.id, id)).returning();
      return result.length > 0;
    }

    const initialLen = memoryDb.transactions.length;
    memoryDb.transactions = memoryDb.transactions.filter(t => t.id !== id);
    return memoryDb.transactions.length < initialLen;
  },

  // --- BUDGETS ---
  async getBudgets(userId: string, month: string): Promise<Budget[]> {
    const db = getDb();
    const targetIds = getTargetUserIds(userId);
    if (db) {
      return await db.select().from(schema.budgets).where(
        and(inArray(schema.budgets.userId, targetIds), eq(schema.budgets.month, month))
      );
    }
    return memoryDb.budgets.filter(b => targetIds.includes(b.userId) && b.month === month);
  },

  async createOrUpdateBudget(userId: string, b: { categoryId: string; amount: number; month: string }): Promise<Budget> {
    const db = getDb();
    if (db) {
      // Check existing
      const existing = await db.select().from(schema.budgets).where(
        and(
          eq(schema.budgets.userId, userId),
          eq(schema.budgets.categoryId, b.categoryId),
          eq(schema.budgets.month, b.month)
        )
      );

      if (existing.length > 0) {
        const updated = await db.update(schema.budgets)
          .set({ amount: b.amount })
          .where(eq(schema.budgets.id, existing[0].id))
          .returning();
        return updated[0];
      } else {
        const inserted = await db.insert(schema.budgets).values({
          userId,
          categoryId: b.categoryId,
          amount: b.amount,
          month: b.month,
        }).returning();
        return inserted[0];
      }
    }

    const existingIdx = memoryDb.budgets.findIndex(
      x => x.userId === userId && x.categoryId === b.categoryId && x.month === b.month
    );

    if (existingIdx !== -1) {
      memoryDb.budgets[existingIdx].amount = b.amount;
      return memoryDb.budgets[existingIdx];
    } else {
      const newBudget: Budget = {
        id: crypto.randomUUID(),
        userId,
        categoryId: b.categoryId,
        amount: b.amount,
        month: b.month,
        createdAt: new Date(),
      };
      memoryDb.budgets.push(newBudget);
      return newBudget;
    }
  },

  // --- SAVINGS GOALS ---
  async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    const db = getDb();
    const targetIds = getTargetUserIds(userId);
    if (db) {
      return await db.select().from(schema.savingsGoals).where(inArray(schema.savingsGoals.userId, targetIds));
    }
    return memoryDb.savingsGoals.filter(g => targetIds.includes(g.userId));
  },

  async createSavingsGoal(goal: { userId: string; name: string; targetAmount: number; currentAmount?: number; deadline?: Date }): Promise<SavingsGoal> {
    const db = getDb();
    const id = crypto.randomUUID();
    const newGoal: SavingsGoal = {
      id,
      userId: goal.userId,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount || 0,
      deadline: goal.deadline || null,
      createdAt: new Date(),
    };

    if (db) {
      const result = await db.insert(schema.savingsGoals).values({
        userId: goal.userId,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
      }).returning();
      return result[0];
    }

    memoryDb.savingsGoals.push(newGoal);
    return newGoal;
  },

  async updateSavingsGoal(id: string, goal: { name?: string; targetAmount?: number; currentAmount?: number; deadline?: Date | null }): Promise<SavingsGoal | null> {
    const db = getDb();
    if (db) {
      const result = await db.update(schema.savingsGoals)
        .set(goal)
        .where(eq(schema.savingsGoals.id, id))
        .returning();
      return result[0] || null;
    }

    const idx = memoryDb.savingsGoals.findIndex(g => g.id === id);
    if (idx !== -1) {
      memoryDb.savingsGoals[idx] = { ...memoryDb.savingsGoals[idx], ...goal };
      return memoryDb.savingsGoals[idx];
    }
    return null;
  },

  async deleteSavingsGoal(id: string): Promise<boolean> {
    const db = getDb();
    if (db) {
      const result = await db.delete(schema.savingsGoals).where(eq(schema.savingsGoals.id, id)).returning();
      return result.length > 0;
    }

    const initialLen = memoryDb.savingsGoals.length;
    memoryDb.savingsGoals = memoryDb.savingsGoals.filter(g => g.id !== id);
    return memoryDb.savingsGoals.length < initialLen;
  },

  // --- INVESTMENTS ---
  async getInvestments(userId: string): Promise<Investment[]> {
    const db = getDb();
    const targetIds = getTargetUserIds(userId);
    if (db) {
      return await db.select().from(schema.investments).where(inArray(schema.investments.userId, targetIds));
    }
    return memoryDb.investments.filter(i => targetIds.includes(i.userId));
  },

  async getInvestment(id: string): Promise<Investment | null> {
    const db = getDb();
    if (db) {
      const result = await db.select().from(schema.investments).where(eq(schema.investments.id, id));
      return result[0] || null;
    }
    return memoryDb.investments.find(i => i.id === id) || null;
  },

  async createInvestment(inv: {
    userId: string;
    name: string;
    type: string;
    buyPrice: number;
    currentPrice: number;
    currentValue: number;
    shares?: number | null;
    initialCapital: number;
    sourceAccountId?: string | null;
    status?: "Aktif" | "Dijual";
    purchaseDate?: Date;
  }): Promise<Investment> {
    const db = getDb();
    const id = crypto.randomUUID();
    const finalDate = inv.purchaseDate || new Date();
    const status = inv.status || "Aktif";
    
    const newInv: Investment = {
      id,
      userId: inv.userId,
      name: inv.name,
      type: inv.type,
      buyPrice: inv.buyPrice,
      currentPrice: inv.currentPrice,
      currentValue: inv.currentValue,
      shares: inv.shares || null,
      initialCapital: inv.initialCapital,
      sourceAccountId: inv.sourceAccountId || null,
      status: status as "Aktif" | "Dijual",
      purchaseDate: finalDate,
      createdAt: new Date(),
    };

    if (db) {
      const result = await db.insert(schema.investments).values({
        id,
        userId: inv.userId,
        name: inv.name,
        type: inv.type,
        buyPrice: inv.buyPrice,
        currentPrice: inv.currentPrice,
        currentValue: inv.currentValue,
        shares: inv.shares,
        initialCapital: inv.initialCapital,
        sourceAccountId: inv.sourceAccountId || null,
        status: status,
        purchaseDate: finalDate,
      }).returning();
      return result[0];
    }

    memoryDb.investments.push(newInv);
    return newInv;
  },

  async updateInvestment(
    id: string, 
    inv: { 
      name?: string; 
      type?: string; 
      buyPrice?: number; 
      currentPrice?: number;
      currentValue?: number; 
      shares?: number | null; 
      initialCapital?: number;
      sourceAccountId?: string | null;
      status?: "Aktif" | "Dijual";
      purchaseDate?: Date;
    }
  ): Promise<Investment | null> {
    const db = getDb();
    if (db) {
      const result = await db.update(schema.investments)
        .set(inv)
        .where(eq(schema.investments.id, id))
        .returning();
      return result[0] || null;
    }

    const idx = memoryDb.investments.findIndex(i => i.id === id);
    if (idx !== -1) {
      memoryDb.investments[idx] = { ...memoryDb.investments[idx], ...inv };
      return memoryDb.investments[idx];
    }
    return null;
  },

  async deleteInvestment(id: string): Promise<boolean> {
    const db = getDb();
    if (db) {
      const result = await db.delete(schema.investments).where(eq(schema.investments.id, id)).returning();
      return result.length > 0;
    }

    const initialLen = memoryDb.investments.length;
    memoryDb.investments = memoryDb.investments.filter(i => i.id !== id);
    return memoryDb.investments.length < initialLen;
  },

  // --- QRIS CONFIG ---
  async getQrisConfig(): Promise<string> {
    const db = getDb();
    if (db) {
      const result = await db.select().from(schema.qrisConfig).where(eq(schema.qrisConfig.id, "default"));
      return result[0]?.qrImageUrl || memoryDb.qrisUrl;
    }
    return memoryDb.qrisUrl;
  },

  async updateQrisConfig(url: string): Promise<string> {
    const db = getDb();
    if (db) {
      await db.insert(schema.qrisConfig)
        .values({ id: "default", qrImageUrl: url, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: schema.qrisConfig.id,
          set: { qrImageUrl: url, updatedAt: new Date() },
        });
      return url;
    }
    memoryDb.qrisUrl = url;
    return url;
  },

  // --- ACTIVITY LOGS ---
  async getActivityLogs(userId?: string): Promise<ActivityLog[]> {
    const db = getDb();
    if (db) {
      if (userId) {
        return await db.select().from(schema.activityLogs)
          .where(eq(schema.activityLogs.userId, userId))
          .orderBy(desc(schema.activityLogs.createdAt));
      } else {
        return await db.select().from(schema.activityLogs)
          .orderBy(desc(schema.activityLogs.createdAt));
      }
    }

    let logs = memoryDb.activityLogs;
    if (userId) {
      logs = logs.filter(l => l.userId === userId);
    }
    return [...logs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async addActivityLog(userId: string | null, action: string, details: string | null): Promise<ActivityLog> {
    const db = getDb();
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      userId,
      action,
      details,
      createdAt: new Date(),
    };

    if (db) {
      const result = await db.insert(schema.activityLogs).values({
        userId,
        action,
        details,
      }).returning();
      return result[0];
    }

    memoryDb.activityLogs.push(newLog);
    return newLog;
  },

  async getPartnerReport(): Promise<{
    nibras: { balance: number; income: number; expense: number };
    zenita: { balance: number; income: number; expense: number };
    bersama: { tabunganBalance: number; operasionalBalance: number; transferIn: number; expense: number };
  }> {
    const db = getDb();
    const nibrasId = "11111111-1111-1111-1111-111111111111";
    const zenitaId = "22222222-2222-2222-2222-222222222222";
    const bersamaId = "33333333-3333-3333-3333-333333333333";

    let allAccounts: Account[] = [];
    let allTransactions: Transaction[] = [];

    if (db) {
      allAccounts = await db.select().from(schema.accounts);
      allTransactions = await db.select().from(schema.transactions);
    } else {
      allAccounts = memoryDb.accounts;
      allTransactions = memoryDb.transactions;
    }

    // Calculations
    const nibrasAccounts = allAccounts.filter(a => a.userId === nibrasId);
    const nibrasBalance = nibrasAccounts.reduce((sum, a) => sum + a.balance, 0);
    const nibrasTxs = allTransactions.filter(t => t.userId === nibrasId);
    const nibrasIncome = nibrasTxs.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const nibrasExpense = nibrasTxs.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

    const zenitaAccounts = allAccounts.filter(a => a.userId === zenitaId);
    const zenitaBalance = zenitaAccounts.reduce((sum, a) => sum + a.balance, 0);
    const zenitaTxs = allTransactions.filter(t => t.userId === zenitaId);
    const zenitaIncome = zenitaTxs.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const zenitaExpense = zenitaTxs.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

    const tabunganAcc = allAccounts.find(a => a.id === "a0000000-0000-0000-0000-000000000301");
    const operasionalAcc = allAccounts.find(a => a.id === "a0000000-0000-0000-0000-000000000302");
    
    const tabunganBalance = tabunganAcc ? tabunganAcc.balance : 0;
    const operasionalBalance = operasionalAcc ? operasionalAcc.balance : 0;

    const bersamaTxs = allTransactions.filter(t => t.userId === bersamaId);
    const bersamaTransferIn = bersamaTxs.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const bersamaExpense = bersamaTxs.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

    return {
      nibras: { balance: nibrasBalance, income: nibrasIncome, expense: nibrasExpense },
      zenita: { balance: zenitaBalance, income: zenitaIncome, expense: zenitaExpense },
      bersama: {
        tabunganBalance,
        operasionalBalance,
        transferIn: bersamaTransferIn,
        expense: bersamaExpense
      }
    };
  },

  async initializeDatabaseSchema(): Promise<{ success: boolean; log: string }> {
    const db = getDb();
    if (!db) {
      return { 
        success: false, 
        log: "DATABASE_URL tidak ditemui. Sila pastikan anda telah memasukkan pembolehubah persekitaran (environment variable) DATABASE_URL di panel Secrets AI Studio." 
      };
    }
    
    let logOutput = "Menyambung ke pangkalan data Supabase...\n";
    try {
      for (const statement of DDL_STATEMENTS) {
        const tableNameMatch = statement.match(/IF NOT EXISTS\s+(\w+)/i);
        const tableName = tableNameMatch ? tableNameMatch[1] : "jadual";
        logOutput += `Membina/mengesahkan jadual '${tableName}'... `;
        await db.execute(sql.raw(statement));
        logOutput += "OK\n";
      }
      
      logOutput += "Semua jadual berjaya dicipta atau disahkan di Supabase!\n";
      logOutput += "Menjalankan penyemaian data permulaan (seeding)...\n";
      await seedDb(db);
      logOutput += "Penyemaian data permulaan berjaya diselesaikan!\n";
      schemaInitialized = true;
      return { success: true, log: logOutput };
    } catch (err: any) {
      console.error("Manual database init failed:", err);
      logOutput += `\nRALAT KETIKA MIGRASI: ${err.message || err}\nSila periksa sambungan atau keizinan pangkalan data Supabase anda.`;
      return { success: false, log: logOutput };
    }
  }
};

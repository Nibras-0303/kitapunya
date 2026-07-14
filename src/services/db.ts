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

    // Default Categories: 21 categories (income & expense)
    const defaultCats = [
      // Pemasukan
      { id: "c0000000-0000-0000-0000-000000000001", userId: null, name: "Gaji", type: "income" as const, icon: "Briefcase", color: "#10B981" },
      { id: "c0000000-0000-0000-0000-000000000002", userId: null, name: "Bonus", type: "income" as const, icon: "TrendingUp", color: "#059669" },
      { id: "c0000000-0000-0000-0000-000000000003", userId: null, name: "Hadiah", type: "income" as const, icon: "Gift", color: "#34D399" },
      { id: "c0000000-0000-0000-0000-000000000004", userId: null, name: "Investasi", type: "income" as const, icon: "Percent", color: "#06B6D4" },
      // Pengeluaran
      { id: "c0000000-0000-0000-0000-000000000005", userId: null, name: "Makanan", type: "expense" as const, icon: "Utensils", color: "#EF4444" },
      { id: "c0000000-0000-0000-0000-000000000006", userId: null, name: "Minuman", type: "expense" as const, icon: "GlassWater", color: "#F87171" },
      { id: "c0000000-0000-0000-0000-000000000007", userId: null, name: "Belanja", type: "expense" as const, icon: "ShoppingBag", color: "#EC4899" },
      { id: "c0000000-0000-0000-0000-000000000008", userId: null, name: "Transportasi", type: "expense" as const, icon: "Car", color: "#3B82F6" },
      { id: "c0000000-0000-0000-0000-000000000009", userId: null, name: "Tagihan", type: "expense" as const, icon: "Receipt", color: "#F59E0B" },
      { id: "c0000000-0000-0000-0000-000000000010", userId: null, name: "Hiburan", type: "expense" as const, icon: "Gamepad2", color: "#F43F5E" },
      { id: "c0000000-0000-0000-0000-000000000011", userId: null, name: "Kesehatan", type: "expense" as const, icon: "Heart", color: "#14B8A6" },
      { id: "c0000000-0000-0000-0000-000000000012", userId: null, name: "Pendidikan", type: "expense" as const, icon: "GraduationCap", color: "#6366F1" },
      { id: "c0000000-0000-0000-0000-000000000013", userId: null, name: "Rumah Tangga", type: "expense" as const, icon: "Home", color: "#8B5CF6" },
      { id: "c0000000-0000-0000-0000-000000000014", userId: null, name: "Bensin", type: "expense" as const, icon: "Fuel", color: "#D97706" },
      { id: "c0000000-0000-0000-0000-000000000015", userId: null, name: "Parkir", type: "expense" as const, icon: "MapPin", color: "#4B5563" },
      { id: "c0000000-0000-0000-0000-000000000016", userId: null, name: "Internet", type: "expense" as const, icon: "Globe", color: "#2563EB" },
      { id: "c0000000-0000-0000-0000-000000000017", userId: null, name: "Listrik", type: "expense" as const, icon: "Lightbulb", color: "#EAB308" },
      { id: "c0000000-0000-0000-0000-000000000018", userId: null, name: "Air", type: "expense" as const, icon: "Droplet", color: "#0EA5E9" },
      { id: "c0000000-0000-0000-0000-000000000019", userId: null, name: "Pulsa", type: "expense" as const, icon: "Phone", color: "#D946EF" },
      { id: "c0000000-0000-0000-0000-000000000020", userId: null, name: "Sedekah", type: "expense" as const, icon: "HeartHandshake", color: "#10B981" },
      { id: "c0000000-0000-0000-0000-000000000021", userId: null, name: "Lainnya", type: "expense" as const, icon: "Tag", color: "#6B7280" },
    ];
    this.categories.push(...defaultCats.map(c => ({ ...c, createdAt: new Date() })));

    // Default Accounts: Rekening Pribadi Nibras, Rekening Pribadi Zenita, Tabungan Bersama, Jajan Berdua (starting balance 0)
    const defaultAccs = [
      // Nibras
      { id: "a0000000-0000-0000-0000-000000000101", userId: nibrasId, name: "Rekening Pribadi", type: "personal", balance: 0, color: "#3B82F6", createdAt: new Date() },
      // Zenita
      { id: "a0000000-0000-0000-0000-000000000201", userId: zenitaId, name: "Rekening Pribadi", type: "personal", balance: 0, color: "#EC4899", createdAt: new Date() },
      // Uang Bersama
      { id: "a0000000-0000-0000-0000-000000000301", userId: bersamaId, name: "Tabungan Bersama", type: "shared_savings", balance: 0, color: "#10B981", createdAt: new Date() },
      { id: "a0000000-0000-0000-0000-000000000302", userId: bersamaId, name: "Jajan Berdua", type: "shared_spending", balance: 0, color: "#F59E0B", createdAt: new Date() },
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
        { id: "a0000000-0000-0000-0000-000000000101", userId: nibrasId, name: "Rekening Pribadi", type: "personal", balance: 0, color: "#3B82F6" },
        // Zenita
        { id: "a0000000-0000-0000-0000-000000000201", userId: zenitaId, name: "Rekening Pribadi", type: "personal", balance: 0, color: "#EC4899" },
        // Uang Bersama
        { id: "a0000000-0000-0000-0000-000000000301", userId: bersamaId, name: "Tabungan Bersama", type: "shared_savings", balance: 0, color: "#10B981" },
        { id: "a0000000-0000-0000-0000-000000000302", userId: bersamaId, name: "Jajan Berdua", type: "shared_spending", balance: 0, color: "#F59E0B" },
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
        { id: "c0000000-0000-0000-0000-000000000003", name: "Hadiah", type: "income", icon: "Gift", color: "#34D399" },
        { id: "c0000000-0000-0000-0000-000000000004", name: "Investasi", type: "income", icon: "Percent", color: "#06B6D4" },
        // Pengeluaran
        { id: "c0000000-0000-0000-0000-000000000005", name: "Makanan", type: "expense", icon: "Utensils", color: "#EF4444" },
        { id: "c0000000-0000-0000-0000-000000000006", name: "Minuman", type: "expense", icon: "GlassWater", color: "#F87171" },
        { id: "c0000000-0000-0000-0000-000000000007", name: "Belanja", type: "expense", icon: "ShoppingBag", color: "#EC4899" },
        { id: "c0000000-0000-0000-0000-000000000008", name: "Transportasi", type: "expense", icon: "Car", color: "#3B82F6" },
        { id: "c0000000-0000-0000-0000-000000000009", name: "Tagihan", type: "expense", icon: "Receipt", color: "#F59E0B" },
        { id: "c0000000-0000-0000-0000-000000000010", name: "Hiburan", type: "expense", icon: "Gamepad2", color: "#F43F5E" },
        { id: "c0000000-0000-0000-0000-000000000011", name: "Kesehatan", type: "expense", icon: "Heart", color: "#14B8A6" },
        { id: "c0000000-0000-0000-0000-000000000012", name: "Pendidikan", type: "expense", icon: "GraduationCap", color: "#6366F1" },
        { id: "c0000000-0000-0000-0000-000000000013", name: "Rumah Tangga", type: "expense", icon: "Home", color: "#8B5CF6" },
        { id: "c0000000-0000-0000-0000-000000000014", name: "Bensin", type: "expense", icon: "Fuel", color: "#D97706" },
        { id: "c0000000-0000-0000-0000-000000000015", name: "Parkir", type: "expense", icon: "MapPin", color: "#4B5563" },
        { id: "c0000000-0000-0000-0000-000000000016", name: "Internet", type: "expense", icon: "Globe", color: "#2563EB" },
        { id: "c0000000-0000-0000-0000-000000000017", name: "Listrik", type: "expense", icon: "Lightbulb", color: "#EAB308" },
        { id: "c0000000-0000-0000-0000-000000000018", name: "Air", type: "expense", icon: "Droplet", color: "#0EA5E9" },
        { id: "c0000000-0000-0000-0000-000000000019", name: "Pulsa", type: "expense", icon: "Phone", color: "#D946EF" },
        { id: "c0000000-0000-0000-0000-000000000020", name: "Sedekah", type: "expense", icon: "HeartHandshake", color: "#10B981" },
        { id: "c0000000-0000-0000-0000-000000000021", name: "Lainnya", type: "expense", icon: "Tag", color: "#6B7280" },
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
              dbClient = null; // Set to null so that we bypass DB completely and use memory mode
            }
          })();
        }
      } catch (err) {
        console.error("Failed to connect to PostgreSQL database, falling back to Memory mode:", err);
        dbClient = null;
      }
    }
    return dbClient;
  }
  return null;
}

function getTargetUserIds(userId: string): string[] {
  if (userId === "33333333-3333-3333-3333-333333333333") {
    return ["11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222", "33333333-3333-3333-3333-333333333333"];
  }
  if (userId === "11111111-1111-1111-1111-111111111111") {
    return ["11111111-1111-1111-1111-111111111111", "33333333-3333-3333-3333-333333333333"];
  }
  if (userId === "22222222-2222-2222-2222-222222222222") {
    return ["22222222-2222-2222-2222-222222222222", "33333333-3333-3333-3333-333333333333"];
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
    const targetIds = getTargetUserIds(userId);
    if (db) {
      return await db.select().from(schema.accounts).where(inArray(schema.accounts.userId, targetIds));
    }
    return memoryDb.accounts.filter((a) => targetIds.includes(a.userId));
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
    if (db) {
      return await db.select().from(schema.categories).where(
        sql`${schema.categories.userId} = ${userId} OR ${schema.categories.userId} IS NULL`
      );
    }
    return memoryDb.categories.filter((c) => c.userId === userId || c.userId === null);
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
  }): Promise<Transaction> {
    const db = getDb();
    const id = crypto.randomUUID();
    const finalDate = tx.date || new Date();
    const newTx: Transaction = {
      id,
      userId: tx.userId,
      accountId: tx.accountId,
      toAccountId: tx.toAccountId || null,
      categoryId: tx.categoryId || null,
      amount: tx.amount,
      type: tx.type,
      description: tx.description || null,
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
        userId: tx.userId,
        accountId: tx.accountId,
        toAccountId: tx.toAccountId || null,
        categoryId: tx.categoryId || null,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        date: finalDate,
        receiptImageUrl: tx.receiptImageUrl,
      }).returning();
      return result[0];
    }

    memoryDb.transactions.push(newTx);
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

import { pgTable, text, timestamp, integer, uuid, varchar, doublePrecision, boolean, index } from "drizzle-orm/pg-core";

// 1. profiles (mapped to export const users)
export const users = pgTable("profiles", {
  id: varchar("id", { length: 255 }).primaryKey(), // Matches active profile user id ('nibras', 'zenita', 'uang_bersama')
  email: varchar("email", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    idxProfilesEmail: index("idx_profiles_email").on(table.email),
  };
});

// 2. accounts
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // 'Bank', 'E-Wallet', 'Cash'
  balance: doublePrecision("balance").default(0).notNull(),
  color: varchar("color", { length: 50 }).default("#10B981").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    idxAccountsUser: index("idx_accounts_user").on(table.userId),
  };
});

// 3. transaction_categories (mapped to export const categories)
export const categories = pgTable("transaction_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'income' or 'expense'
  icon: varchar("icon", { length: 100 }).default("Tag").notNull(),
  color: varchar("color", { length: 50 }).default("#10B981").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    idxCategoriesUser: index("idx_categories_user").on(table.userId),
  };
});

// 4. transactions
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
  toAccountId: uuid("to_account_id").references(() => accounts.id, { onDelete: "set null" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  amount: doublePrecision("amount").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'income', 'expense', 'transfer'
  description: text("description"),
  date: timestamp("date").defaultNow().notNull(),
  receiptImageUrl: text("receipt_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    idxTransactionsUser: index("idx_transactions_user").on(table.userId),
    idxTransactionsAccount: index("idx_transactions_account").on(table.accountId),
  };
});

// 5. budgets
export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
  amount: doublePrecision("amount").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // 'YYYY-MM'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    idxBudgetsUser: index("idx_budgets_user").on(table.userId),
  };
});

// 6. budget_items
export const budgetItems = pgTable("budget_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  budgetId: uuid("budget_id").references(() => budgets.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: doublePrecision("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 7. goals (mapped to export const savingsGoals)
export const savingsGoals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: doublePrecision("target_amount").notNull(),
  currentAmount: doublePrecision("current_amount").default(0).notNull(),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    idxGoalsUser: index("idx_goals_user").on(table.userId),
  };
});

// 8. investments
export const investments = pgTable("investments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // 'Emas', 'Saham', 'Reksa Dana', etc.
  buyPrice: doublePrecision("buy_price").notNull(),
  currentPrice: doublePrecision("current_price").default(0).notNull(),
  currentValue: doublePrecision("current_value").notNull(),
  shares: doublePrecision("shares"),
  initialCapital: doublePrecision("initial_capital").default(0).notNull(),
  sourceAccountId: uuid("source_account_id").references(() => accounts.id, { onDelete: "set null" }),
  status: varchar("status", { length: 50 }).default("Aktif").notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    idxInvestmentsUser: index("idx_investments_user").on(table.userId),
  };
});

// 9. investment_history
export const investmentHistory = pgTable("investment_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  investmentId: uuid("investment_id").references(() => investments.id, { onDelete: "cascade" }).notNull(),
  price: doublePrecision("price").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 10. receipts
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  imageUrl: text("image_url"),
  totalAmount: doublePrecision("total_amount").notNull(),
  merchantName: varchar("merchant_name", { length: 255 }),
  scanDate: timestamp("scan_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 11. receipt_items
export const receiptItems = pgTable("receipt_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  receiptId: uuid("receipt_id").references(() => receipts.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: doublePrecision("price").notNull(),
  quantity: doublePrecision("quantity").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 12. photos
export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 13. notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 14. activity_logs
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    idxActivityLogsUser: index("idx_activity_logs_user").on(table.userId),
  };
});

// 15. settings (mapped to export const qrisConfig)
export const qrisConfig = pgTable("settings", {
  id: varchar("id", { length: 50 }).primaryKey().default("default"),
  qrImageUrl: text("qr_image_url").notNull(),
  currency: varchar("currency", { length: 50 }).default("IDR").notNull(),
  language: varchar("language", { length: 50 }).default("Indonesia").notNull(),
  theme: varchar("theme", { length: 50 }).default("System").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

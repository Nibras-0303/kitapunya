export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: string; // 'user' | 'admin'
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  color: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  amount: number;
  type: "income" | "expense" | "transfer";
  description: string | null;
  date: string;
  receiptImageUrl: string | null;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  month: string; // 'YYYY-MM'
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  createdAt: string;
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: string;
  buyPrice: number; // harga beli per unit
  currentPrice: number; // harga saat ini per unit
  currentValue: number; // nilai saat ini (currentPrice * shares)
  shares: number | null; // jumlah unit
  initialCapital: number; // modal awal
  sourceAccountId: string | null; // rekening sumber dana
  status: "Aktif" | "Dijual"; // status investasi
  purchaseDate: string; // tanggal pembelian
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  action: string;
  details: string | null;
  createdAt: string;
}

export interface AuthSession {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "user";
}

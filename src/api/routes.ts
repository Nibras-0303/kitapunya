import { Router, Request, Response } from "express";
import { dbService } from "../services/db.js";
import { GoogleGenAI, Type } from "@google/genai";

export const apiRouter = Router();

// Middleware to mock/retrieve current user profile
async function requireProfile(req: Request, res: Response, next: any) {
  try {
    const profileId = (req.headers["x-profile-id"] || req.headers["x-user-id"] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.substring(7) : "")) as string;

    if (!profileId) {
      return res.status(401).json({ error: "profile_id diperlukan pada setiap request." });
    }

    const validProfiles = [
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
      "33333333-3333-3333-3333-333333333333"
    ];

    if (!validProfiles.includes(profileId)) {
      return res.status(401).json({ error: "Profil tidak ditemui atau tidak sah." });
    }

    let user = await dbService.getUser(profileId);
    if (!user) {
      const names: Record<string, string> = {
        "11111111-1111-1111-1111-111111111111": "Nibras",
        "22222222-2222-2222-2222-222222222222": "Zenita",
        "33333333-3333-3333-3333-333333333333": "Uang Bersama"
      };
      const emails: Record<string, string> = {
        "11111111-1111-1111-1111-111111111111": "nibras@kitapunya.id",
        "22222222-2222-2222-2222-222222222222": "zenita@kitapunya.id",
        "33333333-3333-3333-3333-333333333333": "bersama@kitapunya.id"
      };
      user = await dbService.createUser({
        id: profileId,
        email: emails[profileId],
        fullName: names[profileId],
        role: profileId === "33333333-3333-3333-3333-333333333333" ? "admin" : "user"
      });
    }

    req.user = user; // attach user to request
    next();
  } catch (err) {
    console.error("Profile middleware error:", err);
    res.status(500).json({ error: "Ralat sistem pada pengesahan profil." });
  }
}

// Middleware to verify Admin role
async function requireAdmin(req: Request, res: Response, next: any) {
  await requireProfile(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Akses dinafikan. Hanya Admin dibenarkan." });
    }
    next();
  });
}

// Extends Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string | null;
        role: string;
        createdAt: Date;
      };
    }
  }
}

// --- AUTH ENDPOINTS ---
apiRouter.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Sila pilih profil." });
    }

    const profileIdMap: Record<string, string> = {
      "nibras@kitapunya.id": "11111111-1111-1111-1111-111111111111",
      "zenita@kitapunya.id": "22222222-2222-2222-2222-222222222222",
      "bersama@kitapunya.id": "33333333-3333-3333-3333-333333333333"
    };

    const profileNames: Record<string, string> = {
      "nibras@kitapunya.id": "Nibras",
      "zenita@kitapunya.id": "Zenita",
      "bersama@kitapunya.id": "Uang Bersama"
    };

    const profileId = profileIdMap[email];
    if (!profileId) {
      return res.status(400).json({ error: "Profil tidak sah." });
    }

    let user = await dbService.getUser(profileId);
    if (!user) {
      user = await dbService.createUser({
        id: profileId,
        email,
        fullName: profileNames[email],
        role: profileId === "33333333-3333-3333-3333-333333333333" ? "admin" : "user"
      });
    }

    const session = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      token: user.id
    };

    res.json({ session });
  } catch (err: any) {
    console.error("Login API error:", err);
    res.status(400).json({ error: err.message || "Log masuk gagal." });
  }
});

apiRouter.post("/auth/signup", async (req: Request, res: Response) => {
  res.status(400).json({ error: "Pendaftaran tidak dibenarkan. Sila gunakan profil tetap." });
});

apiRouter.post("/auth/logout", async (req: Request, res: Response) => {
  res.json({ success: true });
});

// --- ACCOUNT ENDPOINTS ---
apiRouter.get("/accounts", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const accounts = await dbService.getAccounts(userId);
    res.json({ accounts });
  } catch (err) {
    res.status(500).json({ error: "Gagal mendapatkan daftar rekening." });
  }
});

apiRouter.post("/accounts", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, type, balance, color } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "Nama rekening dan jenis rekening diperlukan." });
    }

    const newAcc = await dbService.createAccount({
      userId,
      name,
      type,
      balance: Number(balance) || 0,
      color,
    });

    await dbService.addActivityLog(userId, "ADD_ACCOUNT", `Menambahkan rekening baru: ${name}`);
    res.status(201).json({ account: newAcc });
  } catch (err) {
    res.status(500).json({ error: "Gagal membuat rekening baru." });
  }
});

apiRouter.put("/accounts/:id", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, type, balance, color } = req.body;

    const updated = await dbService.updateAccount(id, {
      name,
      type,
      balance: balance !== undefined ? Number(balance) : undefined,
      color,
    });

    if (!updated) {
      return res.status(404).json({ error: "Rekening tidak ditemukan." });
    }

    await dbService.addActivityLog(userId, "UPDATE_ACCOUNT", `Memperbarui rekening: ${name || updated.name}`);
    res.json({ account: updated });
  } catch (err) {
    res.status(500).json({ error: "Gagal memperbarui rekening." });
  }
});

apiRouter.delete("/accounts/:id", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const success = await dbService.deleteAccount(id);
    if (!success) {
      return res.status(404).json({ error: "Rekening tidak ditemukan." });
    }

    await dbService.addActivityLog(userId, "DELETE_ACCOUNT", `Menghapus rekening dengan ID: ${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus rekening." });
  }
});

apiRouter.post("/accounts/reset-balances", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await dbService.resetBalances(userId);
    await dbService.addActivityLog(userId, "RESET_BALANCES", "Mereset semua saldo rekening keuangan ke 0");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal mereset semua saldo rekening." });
  }
});

// --- CATEGORIES ENDPOINTS ---
apiRouter.get("/categories", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const categories = await dbService.getCategories(userId);
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: "Gagal mendapatkan kategori." });
  }
});

apiRouter.post("/categories", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, type, icon, color } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "Nama dan jenis kategori diperlukan." });
    }

    const newCat = await dbService.createCategory({
      userId,
      name,
      type,
      icon,
      color,
    });

    await dbService.addActivityLog(userId, "ADD_CATEGORY", `Menambah kategori baru: ${name}`);
    res.status(201).json({ category: newCat });
  } catch (err) {
    res.status(500).json({ error: "Gagal menambah kategori." });
  }
});

apiRouter.put("/categories/:id", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, type, icon, color } = req.body;

    const updated = await dbService.updateCategory(id, { name, type, icon, color });
    if (!updated) {
      return res.status(404).json({ error: "Kategori tidak ditemui." });
    }

    await dbService.addActivityLog(userId, "UPDATE_CATEGORY", `Mengemaskini kategori: ${name || updated.name}`);
    res.json({ category: updated });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengemaskini kategori." });
  }
});

apiRouter.delete("/categories/:id", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const success = await dbService.deleteCategory(id);
    if (!success) {
      return res.status(404).json({ error: "Kategori tidak ditemui." });
    }

    await dbService.addActivityLog(userId, "DELETE_CATEGORY", `Memadam kategori dengan ID: ${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal memadam kategori." });
  }
});

// --- TRANSACTIONS ENDPOINTS ---
apiRouter.get("/transactions", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { accountId, categoryId, startDate, endDate, search } = req.query;

    const filters: any = {};
    if (accountId) filters.accountId = accountId as string;
    if (categoryId) filters.categoryId = categoryId as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (search) filters.search = search as string;

    const transactions = await dbService.getTransactions(userId, filters);
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil daftar transaksi." });
  }
});

apiRouter.post("/transactions", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { accountId, toAccountId, categoryId, amount, type, description, date, receiptImageUrl, transferToAccountId, paidBy, reimburse } = req.body;

    if (!accountId || !amount || !type) {
      return res.status(400).json({ error: "Rekening, jumlah, dan jenis transaksi diperlukan." });
    }

    const newTx = await dbService.createTransaction({
      userId,
      accountId,
      toAccountId,
      categoryId,
      amount: Number(amount),
      type,
      description,
      date: date ? new Date(date) : undefined,
      receiptImageUrl,
      transferToAccountId,
      paidBy,
      reimburse: reimburse === true || reimburse === "true",
    });

    await dbService.addActivityLog(userId, "ADD_TRANSACTION", `Menambah transaksi ${type}: RM ${amount}`);
    res.status(201).json({ transaction: newTx });
  } catch (err) {
    console.error("Create tx error:", err);
    res.status(500).json({ error: "Gagal menambah transaksi." });
  }
});

apiRouter.delete("/transactions/:id", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const success = await dbService.deleteTransaction(id);
    if (!success) {
      return res.status(404).json({ error: "Transaksi tidak ditemui." });
    }

    await dbService.addActivityLog(userId, "DELETE_TRANSACTION", `Memadam transaksi ID: ${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal memadam transaksi." });
  }
});

// --- BUDGETS ENDPOINTS ---
apiRouter.get("/budgets", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);

    const budgets = await dbService.getBudgets(userId, month);
    res.json({ budgets });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil daftar anggaran bulanan." });
  }
});

apiRouter.post("/budgets", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { categoryId, amount, month } = req.body;

    if (!categoryId || !amount || !month) {
      return res.status(400).json({ error: "Kategori, jumlah, dan bulan bajet diperlukan." });
    }

    const budget = await dbService.createOrUpdateBudget(userId, {
      categoryId,
      amount: Number(amount),
      month,
    });

    await dbService.addActivityLog(userId, "SET_BUDGET", `Menetapkan bajet bulanan untuk kategori.`);
    res.json({ budget });
  } catch (err) {
    res.status(500).json({ error: "Gagal menetapkan bajet bulanan." });
  }
});

// --- SAVINGS GOALS (TARGET TABUNGAN) ---
apiRouter.get("/savings-goals", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const goals = await dbService.getSavingsGoals(userId);
    res.json({ goals });
  } catch (err) {
    res.status(500).json({ error: "Gagal mendapatkan sasaran simpanan." });
  }
});

apiRouter.post("/savings-goals", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, targetAmount, currentAmount, deadline } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ error: "Nama dan jumlah sasaran simpanan diperlukan." });
    }

    const newGoal = await dbService.createSavingsGoal({
      userId,
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      deadline: deadline ? new Date(deadline) : undefined,
    });

    await dbService.addActivityLog(userId, "ADD_SAVINGS_GOAL", `Menambah sasaran simpanan: ${name}`);
    res.status(201).json({ goal: newGoal });
  } catch (err) {
    res.status(500).json({ error: "Gagal menambah sasaran simpanan." });
  }
});

apiRouter.put("/savings-goals/:id", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, targetAmount, currentAmount, deadline } = req.body;

    const updated = await dbService.updateSavingsGoal(id, {
      name,
      targetAmount: targetAmount !== undefined ? Number(targetAmount) : undefined,
      currentAmount: currentAmount !== undefined ? Number(currentAmount) : undefined,
      deadline: deadline ? new Date(deadline) : (deadline === null ? null : undefined),
    });

    if (!updated) {
      return res.status(404).json({ error: "Sasaran simpanan tidak ditemui." });
    }

    await dbService.addActivityLog(userId, "UPDATE_SAVINGS_GOAL", `Mengemaskini sasaran simpanan: ${name || updated.name}`);
    res.json({ goal: updated });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengemaskini sasaran simpanan." });
  }
});

apiRouter.delete("/savings-goals/:id", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const success = await dbService.deleteSavingsGoal(id);
    if (!success) {
      return res.status(404).json({ error: "Sasaran simpanan tidak ditemui." });
    }

    await dbService.addActivityLog(userId, "DELETE_SAVINGS_GOAL", `Memadam sasaran simpanan ID: ${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal memadam sasaran simpanan." });
  }
});

// --- INVESTMENTS (INVESTASI) ---
apiRouter.get("/investments", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const investments = await dbService.getInvestments(userId);
    res.json({ investments });
  } catch (err) {
    res.status(500).json({ error: "Gagal mendapatkan daftar investasi." });
  }
});

apiRouter.post("/investments", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      type,
      buyPrice,
      currentPrice,
      currentValue,
      shares,
      initialCapital,
      sourceAccountId,
      status,
      purchaseDate,
    } = req.body;

    if (!name || !type || buyPrice === undefined || currentValue === undefined) {
      return res.status(400).json({ error: "Nama, jenis, harga beli, dan nilai saat ini investasi diperlukan." });
    }

    const priceBought = Number(buyPrice);
    const sharesCount = shares ? Number(shares) : null;
    const capital = Number(initialCapital) || (priceBought * (sharesCount || 1));
    const nowPrice = currentPrice !== undefined ? Number(currentPrice) : priceBought;
    const nowValue = Number(currentValue) || (nowPrice * (sharesCount || 1));

    const newInv = await dbService.createInvestment({
      userId,
      name,
      type,
      buyPrice: priceBought,
      currentPrice: nowPrice,
      currentValue: nowValue,
      shares: sharesCount,
      initialCapital: capital,
      sourceAccountId: sourceAccountId || null,
      status: status || "Aktif",
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
    });

    // If sourceAccountId is provided, subtract balance by recording an expense transaction
    if (sourceAccountId && capital > 0) {
      await dbService.createTransaction({
        userId,
        accountId: sourceAccountId,
        categoryId: "cat-5", // Investasi & Tabungan
        amount: capital,
        type: "expense",
        description: `Beli Investasi ${type}: ${name}`,
        date: purchaseDate ? new Date(purchaseDate) : new Date(),
      });
    }

    await dbService.addActivityLog(userId, "ADD_INVESTMENT", `Menambah investasi baru: ${name}`);
    res.status(201).json({ investment: newInv });
  } catch (err: any) {
    console.error("Add investment error:", err);
    res.status(500).json({ error: "Gagal menambah investasi." });
  }
});

apiRouter.post("/investments/refresh", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const investments = await dbService.getInvestments(userId);
    const activeInvestments = investments.filter(i => i.status === "Aktif");

    if (activeInvestments.length === 0) {
      return res.json({ success: true, updatedCount: 0, investments });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let updates: Array<{ id: string; currentPrice: number; currentValue: number }> = [];

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const promptText = `
          Anda adalah sistem penganalisis pasar keuangan Indonesia untuk aplikasi KitaPunya.
          Berikut adalah daftar aset investasi aktif pengguna:
          ${JSON.stringify(activeInvestments.map(i => ({ id: i.id, name: i.name, type: i.type, buyPrice: i.buyPrice, currentPrice: i.currentPrice, shares: i.shares })))}
          
          Silakan perbarui harga per unit saat ini (currentPrice) untuk setiap aset tersebut berdasarkan harga aktual pasar terbaru di Indonesia (misalnya Emas Antam sekitar Rp1.300.000 - Rp1.400.000 per gram, saham IHSG terbaru, reksadana, dll.).
          Jika nama aset tidak dikenal, silakan buat fluktuasi harga yang logis dan realistis (sekitar -2% hingga +3% dari harga saat ini terakhir).
          
          KEMBALIKAN HASIL DALAM FORMAT JSON SAJA yang mematuhi skema berikut tanpa teks markdown apa pun di luar atau di dalam respons:
          {
            "updates": [
              {
                "id": string,
                "currentPrice": number
              }
            ]
          }
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                updates: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      currentPrice: { type: Type.NUMBER }
                    },
                    required: ["id", "currentPrice"]
                  }
                }
              },
              required: ["updates"]
            }
          }
        });

        const responseText = response.text;
        if (responseText) {
          const parsed = JSON.parse(responseText.trim());
          if (parsed && Array.isArray(parsed.updates)) {
            updates = parsed.updates.map((u: any) => {
              const inv = activeInvestments.find(i => i.id === u.id);
              const sharesCount = inv ? (inv.shares || 1) : 1;
              return {
                id: u.id,
                currentPrice: Number(u.currentPrice),
                currentValue: Number(u.currentPrice) * sharesCount
              };
            });
          }
        }
      } catch (geminiErr) {
        console.error("Gemini Investment Refresh Error, falling back to math simulation:", geminiErr);
      }
    }

    // Fallback or standard simulation if Gemini fails or wasn't configured
    if (updates.length === 0) {
      updates = activeInvestments.map(inv => {
        const fluctuation = 1 + (Math.random() * 0.04 - 0.015); // -1.5% to +2.5%
        const lastPrice = inv.currentPrice || inv.buyPrice;
        const newPrice = Math.round(lastPrice * fluctuation);
        const sharesCount = inv.shares || 1;
        return {
          id: inv.id,
          currentPrice: newPrice,
          currentValue: newPrice * sharesCount
        };
      });
    }

    // Save updates to DB
    for (const update of updates) {
      await dbService.updateInvestment(update.id, {
        currentPrice: update.currentPrice,
        currentValue: update.currentValue
      });
    }

    const updatedInvestments = await dbService.getInvestments(userId);
    await dbService.addActivityLog(userId, "REFRESH_INVESTMENTS", `Memperbarui harga investasi secara otomatis.`);

    res.json({
      success: true,
      updatedCount: updates.length,
      investments: updatedInvestments,
      lastUpdated: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Refresh Investments API Error:", err);
    res.status(500).json({ error: "Gagal memperbarui harga investasi: " + (err.message || err) });
  }
});

apiRouter.put("/investments/:id", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      name,
      type,
      buyPrice,
      currentPrice,
      currentValue,
      shares,
      initialCapital,
      sourceAccountId,
      status,
      purchaseDate,
    } = req.body;

    // Get existing investment first to check state changes (like selling)
    const existing = await dbService.getInvestment(id);
    if (!existing) {
      return res.status(404).json({ error: "Investasi tidak ditemukan." });
    }

    const updated = await dbService.updateInvestment(id, {
      name,
      type,
      buyPrice: buyPrice !== undefined ? Number(buyPrice) : undefined,
      currentPrice: currentPrice !== undefined ? Number(currentPrice) : undefined,
      currentValue: currentValue !== undefined ? Number(currentValue) : undefined,
      shares: shares !== undefined ? (shares === null ? null : Number(shares)) : undefined,
      initialCapital: initialCapital !== undefined ? Number(initialCapital) : undefined,
      sourceAccountId: sourceAccountId !== undefined ? sourceAccountId : undefined,
      status: status !== undefined ? status : undefined,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
    });

    if (!updated) {
      return res.status(404).json({ error: "Investasi tidak ditemukan." });
    }

    // Handle selling refund logic
    if (status === "Dijual" && existing.status === "Aktif") {
      const refundAccId = sourceAccountId || existing.sourceAccountId;
      const refundVal = currentValue !== undefined ? Number(currentValue) : existing.currentValue;
      if (refundAccId && refundVal > 0) {
        await dbService.createTransaction({
          userId,
          accountId: refundAccId,
          categoryId: "cat-5", // Investasi & Tabungan
          amount: refundVal,
          type: "income",
          description: `Jual Investasi ${existing.type}: ${existing.name}`,
          date: new Date(),
        });
      }
    }

    await dbService.addActivityLog(userId, "UPDATE_INVESTMENT", `Memperbarui investasi: ${name || updated.name}`);
    res.json({ investment: updated });
  } catch (err) {
    console.error("Update investment error:", err);
    res.status(500).json({ error: "Gagal memperbarui investasi." });
  }
});

apiRouter.delete("/investments/:id", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const success = await dbService.deleteInvestment(id);
    if (!success) {
      return res.status(404).json({ error: "Investasi tidak ditemukan." });
    }

    await dbService.addActivityLog(userId, "DELETE_INVESTMENT", `Menghapus investasi ID: ${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus investasi." });
  }
});

// --- QRIS CONFIG ---
apiRouter.get("/qris", async (req: Request, res: Response) => {
  try {
    const qrImageUrl = await dbService.getQrisConfig();
    res.json({ qrImageUrl });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil konfigurasi QRIS." });
  }
});

apiRouter.post("/qris", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { qrImageUrl } = req.body;
    if (!qrImageUrl) {
      return res.status(400).json({ error: "URL gambar QRIS diperlukan." });
    }
    const updatedUrl = await dbService.updateQrisConfig(qrImageUrl);
    await dbService.addActivityLog(req.user!.id, "UPDATE_QRIS", `Admin mengemaskini kod QRIS.`);
    res.json({ qrImageUrl: updatedUrl });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengemaskini konfigurasi QRIS." });
  }
});

// --- ADMIN & LOG ENDPOINTS ---
apiRouter.get("/logs", requireAdmin, async (req: Request, res: Response) => {
  try {
    const logs = await dbService.getActivityLogs();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil log aktiviti." });
  }
});

apiRouter.get("/admin/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await dbService.getUsers();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil daftar pengguna." });
  }
});

apiRouter.put("/admin/users/:id/role", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role !== "user" && role !== "admin") {
      return res.status(400).json({ error: "Peranan tidak sah. Hanya 'user' atau 'admin' dibenarkan." });
    }

    const updated = await dbService.updateUserRole(id, role);
    if (!updated) {
      return res.status(404).json({ error: "Pengguna tidak ditemui." });
    }

    await dbService.addActivityLog(req.user!.id, "CHANGE_USER_ROLE", `Menukar peranan pengguna ${updated.email} kepada ${role}`);
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengemaskini peranan pengguna." });
  }
});

// --- DATABASE PROVISIONING ENDPOINT ---
apiRouter.post("/admin/db-init", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await dbService.initializeDatabaseSchema();
    res.json(result);
  } catch (err: any) {
    console.error("Database initialization API error:", err);
    res.status(500).json({ success: false, log: `Ralat sistem: ${err.message || err}` });
  }
});

// --- AI SCAN RECEIPT OCR (GEMINI API) ---
apiRouter.post("/scan-receipt", requireProfile, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { base64Image, mimeType } = req.body; // base64Image must not have header 'data:image/...;base64,'

    if (!base64Image) {
      return res.status(400).json({ error: "Data gambar resit diperlukan dalam format base64." });
    }

    const finalMimeType = mimeType || "image/jpeg";

    // Set up Google Gen AI with server API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Google Gemini API Key tidak dikonfigurasikan di server. Sila isi dalam Secrets panel.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const imagePart = {
      inlineData: {
        mimeType: finalMimeType,
        data: base64Image,
      },
    };

    const promptText = `
      Anda adalah ahli pengenalan struk/nota dengan fokus utama pada akurasi nominal transaksi. Silakan lakukan analisis dalam 3 tahap berikut:

      TAHAP 1: EKSTRAK OCR PENUH (RESOLUSI PENUH)
      Baca dan ekstrak seluruh teks yang terdapat pada gambar struk ini tanpa melewatkan teks apa pun. Letakkan hasil transkripsi lengkap ini pada field "rawOcrText".

      TAHAP 2: PARSING INFORMASI BERSTRUKTUR
      Dari teks OCR di Tahap 1, identifikasi dan ambil informasi berikut:
      - Merchant (Nama toko/usaha)
      - Tanggal (Tanggal dalam format YYYY-MM-DD, jika tidak ada silakan gunakan tanggal hari ini)
      - Jam (Waktu dalam format HH:MM jika ada, jika tidak ada letakkan null)
      - Daftar barang (Daftar barang yang dibeli dengan kuantitas dan harga masing-masing jika ada)
      - Total pembayaran (Jumlah keseluruhan)

      TAHAP 3: VALIDASI NOMINAL (TERPENTING)
      Silakan cari angka nominal transaksi setelah kata kunci berikut (tidak sensitif huruf besar/kecil):
      - TOTAL
      - TOTAL BELANJA
      - TOTAL BAYAR
      - GRAND TOTAL
      - JUMLAH
      - TOTAL PEMBAYARAN
      - AMOUNT
      - TOTAL CASH

      Aturan ketat untuk Tahap 3:
      1. Jika terdapat lebih dari satu angka, pilih angka yang posisinya paling dekat setelah kata "TOTAL" atau variasi kata kunci di atas.
      2. Jika terdapat rincian seperti Subtotal, Pajak/Tax, PPN, Diskon/Discount, dan TOTAL, Anda WAJIB menggunakan nilai TOTAL akhir sebagai nominal transaksi.
      3. Nominal ini WAJIB disimpan sebagai angka murni saja TANPA format apa pun (tanpa titik, koma, atau simbol mata uang). Contoh: "Rp126.500" harus disimpan sebagai 126500.
      4. Tentukan tingkat keyakinan (confidence level) dari 0 hingga 100 persen untuk ketepatan pembacaan nominal transaksi ini. Jika terdapat ketidakjelasan, ketiadaan label yang jelas, atau angka yang kurang terbaca, berikan nilai di bawah 90%. Jika sangat jelas dan akurat, berikan 95% - 100%.

      Silakan pilih juga Kategori pengeluaran yang paling sesuai dari daftar ini: 'Makanan & Minuman', 'Transportasi', 'Hiburan & Rekreasi', 'Investasi & Tabungan', 'Belanja Bulanan', atau 'Lain-lain'.

      Kembalikan hasil analisis ini dalam format JSON saja sesuai skema yang ditetapkan.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rawOcrText: { type: Type.STRING, description: "Seluruh hasil pembacaan teks OCR dari gambar (Tahap 1)" },
            merchant: { type: Type.STRING, description: "Nama toko atau merchant (Tahap 2)" },
            date: { type: Type.STRING, description: "Tanggal transaksi dalam format YYYY-MM-DD (Tahap 2)" },
            time: { type: Type.STRING, description: "Waktu transaksi dalam format HH:MM jika ada, jika tidak ada gunakan null (Tahap 2)" },
            categoryName: { type: Type.STRING, description: "Nama kategori terpilih dari daftar yang diberikan" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nama barang" },
                  qty: { type: Type.NUMBER, description: "Kuantitas barang" },
                  price: { type: Type.NUMBER, description: "Harga per unit atau harga barang" }
                }
              },
              description: "Daftar barang (Tahap 2)"
            },
            totalAmount: { type: Type.NUMBER, description: "Nominal transaksi murni berupa angka tanpa format, dihitung berdasarkan validasi Tahap 3" },
            confidence: { type: Type.NUMBER, description: "Tingkat keyakinan akurasi nominal dalam persentase 0-100" }
          },
          required: ["rawOcrText", "merchant", "date", "categoryName", "totalAmount", "confidence"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini AI");
    }

    const parsedResult = JSON.parse(responseText.trim());

    await dbService.addActivityLog(userId, "AI_SCAN_RECEIPT", `Berhasil menganalisis struk via Gemini AI: ${parsedResult.merchant || parsedResult.categoryName} dengan nominal ${parsedResult.totalAmount} (Confidence: ${parsedResult.confidence}%)`);

    res.json({
      success: true,
      result: parsedResult,
    });
  } catch (err: any) {
    console.error("OCR Scan API Error:", err);
    res.status(500).json({ error: "Gagal menganalisis resit: " + (err.message || err) });
  }
});

// --- PARTNER REPORT ENDPOINT ---
apiRouter.get("/reports/partner", requireProfile, async (req: Request, res: Response) => {
  try {
    const report = await dbService.getPartnerReport();
    res.json({ report });
  } catch (err: any) {
    console.error("Partner report API error:", err);
    res.status(500).json({ error: "Gagal memproses laporan keuangan: " + err.message });
  }
});

// --- RESET DATA ENDPOINT ---
apiRouter.post("/reset-data", async (req: Request, res: Response) => {
  try {
    const result = await dbService.resetFinancialData();
    res.json(result);
  } catch (err: any) {
    console.error("Reset data API error:", err);
    res.status(500).json({ error: "Gagal mengosongkan data: " + err.message });
  }
});

// --- DIAGNOSTICS ENDPOINT ---
apiRouter.get("/diagnostics", (req: Request, res: Response) => {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    res.json({
      DATABASE_URL: databaseUrl ? `Terbaca (panjang: ${databaseUrl.length}, bermula dengan: ${databaseUrl.substring(0, 10)}...)` : "Tidak ditemui",
      VITE_SUPABASE_URL_DETECTED: process.env.VITE_SUPABASE_URL ? "YA" : "TIDAK",
      SUPABASE_URL: supabaseUrl ? `Terbaca (panjang: ${supabaseUrl.length}, bermula dengan: ${supabaseUrl.substring(0, 15)}...)` : "Tidak ditemui",
      SUPABASE_KEY: supabaseKey ? `Terbaca (panjang: ${supabaseKey.length})` : "Tidak ditemui",
      SUPABASE_SERVICE_ROLE_KEY_DETECTED: serviceRoleKey ? `YA (panjang: ${serviceRoleKey.length})` : "TIDAK",
      GEMINI_API_KEY: geminiKey ? `Terbaca (panjang: ${geminiKey.length})` : "Tidak ditemui",
      VERCEL: process.env.VERCEL || "bukan 1",
      NODE_ENV: process.env.NODE_ENV || "development"
    });
  } catch (err: any) {
    res.status(500).json({ error: "Gagal menjalankan diagnostics: " + err.message });
  }
});

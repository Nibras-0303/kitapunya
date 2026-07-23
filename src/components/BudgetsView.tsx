import React, { useState, useMemo } from "react";
import { Plus, Edit2, Calendar, AlertTriangle, AlertOctagon, CheckCircle2, TrendingUp, Info } from "lucide-react";
import { Category, Budget, Transaction } from "../types.js";
import { formatRupiah } from "../utils/format.js";

interface BudgetsViewProps {
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  onSetBudget: (categoryId: string, amount: number, month: string) => Promise<void>;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  categories,
  budgets,
  transactions,
  onSetBudget,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7); // Format 'YYYY-MM'
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [budgetAmount, setBudgetAmount] = useState("");

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === "expense");
  }, [categories]);

  // Map budget details (Budget Limit, Actual Spent, Over/Under state)
  const budgetReports = useMemo(() => {
    return expenseCategories.map((cat) => {
      const budgetLimit = budgets.find((b) => b.categoryId === cat.id && b.month === selectedMonth)?.amount || 0;

      // Sum all expense transactions for this category in the selected month
      const actualSpent = transactions
        .filter((tx) => {
          if (tx.type !== "expense" || tx.categoryId !== cat.id) return false;
          const txMonth = new Date(tx.date).toISOString().substring(0, 7);
          return txMonth === selectedMonth;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      const percentage = budgetLimit > 0 ? (actualSpent / budgetLimit) * 100 : 0;

      return {
        category: cat,
        budgetLimit,
        actualSpent,
        percentage,
      };
    });
  }, [expenseCategories, budgets, transactions, selectedMonth]);

  const handleOpenEdit = (cat: Category, currentLimit: number) => {
    setSelectedCategory(cat);
    setBudgetAmount(String(currentLimit));
    setIsEditModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    const amount = Number(budgetAmount);
    if (isNaN(amount) || amount < 0) {
      alert("Silakan masukkan jumlah anggaran yang valid.");
      return;
    }

    await onSetBudget(selectedCategory.id, amount, selectedMonth);
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Batas & Anggaran Bulanan
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-1">
            Pantau sisa batas pengeluaran bulanan sesuai kategori dan hindari pengeluaran berlebihan.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-2xl shadow-sm">
          <Calendar size={16} className="text-zinc-400 ml-1.5" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-none bg-transparent outline-none text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer pr-1.5"
          />
        </div>
      </div>

      {/* Warnings & Alerts Feed */}
      <div className="space-y-3">
        {budgetReports.filter(r => r.budgetLimit > 0 && r.percentage >= 80).map((r, i) => {
          const isOver = r.percentage >= 100;
          return (
            <div
              key={i}
              className={`p-4 border rounded-2xl flex items-start gap-3.5 shadow-sm ${
                isOver
                  ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-400"
                  : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400"
              }`}
            >
              {isOver ? <AlertOctagon className="flex-shrink-0 mt-0.5" size={20} /> : <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />}
              <div>
                <h4 className="font-extrabold text-xs">
                  {isOver ? "PERINGATAN: Anggaran Melebihi Batas!" : "PERINGATAN: Mendekati Batas Anggaran"}
                </h4>
                <p className="text-[11px] font-semibold mt-1 opacity-90 leading-relaxed">
                  Pengeluaran Anda untuk kategori <span className="font-black">{r.category.name}</span> adalah <span className="font-black">{formatRupiah(r.actualSpent)}</span> dari batas yang ditetapkan yaitu <span className="font-black">{formatRupiah(r.budgetLimit)}</span> ({r.percentage.toFixed(0)}%). Silakan hemat sisa uang Anda.
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Budgets Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgetReports.map((report) => {
          const isConfigured = report.budgetLimit > 0;
          const isWarning = report.percentage >= 80 && report.percentage < 100;
          const isOver = report.percentage >= 100;

          return (
            <div
              key={report.category.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: report.category.color }} />
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      {report.category.name}
                    </h3>
                  </div>
                  <button
                    id={`budget-edit-${report.category.id}`}
                    onClick={() => handleOpenEdit(report.category, report.budgetLimit)}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-lg"
                    title="Ubah Batas Anggaran"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Jumlah Dibelanjakan
                    </span>
                    <span className="text-lg font-black text-zinc-950 dark:text-zinc-100 block">
                      {formatRupiah(report.actualSpent)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Batas Anggaran
                    </span>
                    <span className="text-sm font-extrabold text-zinc-600 dark:text-zinc-400 block mt-0.5">
                      {isConfigured ? formatRupiah(report.budgetLimit) : "Belum Diatur"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Status */}
              <div className="mt-6 space-y-2">
                <div className="relative w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver
                        ? "bg-red-600 shadow-md shadow-red-500/20"
                        : isWarning
                        ? "bg-amber-500 shadow-md shadow-amber-500/20"
                        : "bg-emerald-500 shadow-md shadow-emerald-500/20"
                    }`}
                    style={{ width: `${Math.min(report.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                  <span className={isOver ? "text-red-600" : isWarning ? "text-amber-500" : "text-emerald-500"}>
                    {isConfigured ? `${report.percentage.toFixed(0)}% Digunakan` : "Tanpa Batas"}
                  </span>
                  <span className="text-zinc-400">
                    {isConfigured
                      ? report.actualSpent > report.budgetLimit
                        ? `Kelebihan ${formatRupiah(report.actualSpent - report.budgetLimit)}`
                        : `Sisa ${formatRupiah(report.budgetLimit - report.actualSpent)}`
                      : "Bebas Belanja"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SET BUDGET LIMIT MODAL */}
      {isEditModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 mb-1">
              Tetapkan Batas Anggaran Bulanan
            </h3>
            <p className="text-xs text-zinc-400 font-semibold mb-4">
              Kategori: <span className="font-bold" style={{ color: selectedCategory.color }}>{selectedCategory.name}</span>
            </p>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Batas Maksimal Anggaran (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Masukkan batas maksimal"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
                >
                  Simpan Had
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

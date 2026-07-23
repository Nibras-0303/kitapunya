import React, { useState } from "react";
import { Plus, Trash2, Edit2, Target, Calendar, CheckCircle, AlertCircle, TrendingUp, Sparkles } from "lucide-react";
import { SavingsGoal } from "../types.js";
import { formatRupiah, formatDate } from "../utils/format.js";

interface SavingsViewProps {
  goals: SavingsGoal[];
  onCreateGoal: (goal: { name: string; targetAmount: number; currentAmount: number; deadline: string }) => Promise<void>;
  onUpdateGoal: (id: string, goal: { name?: string; targetAmount?: number; currentAmount?: number; deadline?: string | null }) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  goals,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const activeUserId = typeof window !== "undefined" ? localStorage.getItem("kitapunya_active_userid") : null;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // CRUD states
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  // Deposit state
  const [depositValue, setDepositValue] = useState("");

  const handleOpenAdd = () => {
    setName("");
    setTargetAmount("");
    setCurrentAmount("0");
    setDeadline(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setCurrentAmount(String(goal.currentAmount));
    setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().substring(0, 10) : "");
    setIsEditModalOpen(true);
  };

  const handleOpenDeposit = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setDepositValue("");
    setIsDepositModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreateGoal({
      name,
      targetAmount: Number(targetAmount) || 0,
      currentAmount: Number(currentAmount) || 0,
      deadline,
    });
    setIsAddModalOpen(false);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !name.trim()) return;
    await onUpdateGoal(selectedGoal.id, {
      name,
      targetAmount: Number(targetAmount) || 0,
      currentAmount: Number(currentAmount) || 0,
      deadline: deadline || null,
    });
    setIsEditModalOpen(false);
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const addedAmount = Number(depositValue);
    if (isNaN(addedAmount) || addedAmount <= 0) {
      alert("Masukkan nilai deposit simpanan yang sah.");
      return;
    }

    const newTotal = selectedGoal.currentAmount + addedAmount;
    await onUpdateGoal(selectedGoal.id, {
      currentAmount: newTotal,
    });
    setIsDepositModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Sasaran Simpanan & Tabungan
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-1">
            Tetapkan matlamat perbelanjaan masa depan atau sasaran kecemasan dan simpan secara berdisiplin.
          </p>
        </div>
        <button
          id="savings-add-btn"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md active:scale-95"
        >
          <Plus size={16} />
          Tambah Sasaran
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const isCompleted = percentage >= 100;

          return (
            <div
              key={goal.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm relative flex flex-col justify-between overflow-hidden"
            >
              {isCompleted && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle size={12} />
                  Selesai
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start justify-between pr-10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <Target size={18} />
                    </div>
                    <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-base leading-tight truncate max-w-xs">
                      {goal.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-zinc-400">
                    {goal.userId === "33333333-3333-3333-3333-333333333333" && activeUserId !== "33333333-3333-3333-3333-333333333333" ? (
                      <span className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200/40 dark:border-zinc-700/40" title="Uang Bersama (Read-Only)">
                        🔒 Bersama
                      </span>
                    ) : (
                      <>
                        <button
                          id={`savings-edit-${goal.id}`}
                          onClick={() => handleOpenEdit(goal)}
                          className="p-1.5 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          title="Ubah Target"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          id={`savings-delete-${goal.id}`}
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus target "${goal.name}"?`)) {
                              onDeleteGoal(goal.id);
                            }
                          }}
                          className="p-1.5 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Target"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Telah Disimpan
                    </span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {formatRupiah(goal.currentAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Jumlah Sasaran
                    </span>
                    <span className="text-base font-black text-zinc-950 dark:text-zinc-100 block mt-0.5">
                      {formatRupiah(goal.targetAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress and Actions */}
              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <div className="relative w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500 shadow-md shadow-emerald-500/20"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <span>{percentage.toFixed(0)}% Tercapai</span>
                    {goal.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Had Masa: {formatDate(goal.deadline)}
                      </span>
                    )}
                  </div>
                </div>

                {!isCompleted && (goal.userId !== "33333333-3333-3333-3333-333333333333" || activeUserId === "33333333-3333-3333-3333-333333333333") && (
                  <button
                    id={`savings-deposit-${goal.id}`}
                    onClick={() => handleOpenDeposit(goal)}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    Tambah Simpanan (+)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD GOAL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 mb-4">
              Cipta Sasaran Simpanan Baru
            </h3>
            <form onSubmit={handleSubmitAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Nama Sasaran
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pembelian Kereta Kedua"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Jumlah Sasaran (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Saldo Awal (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Tenggat Waktu (Opsional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
                >
                  Cipta Sasaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GOAL MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 mb-4">
              Perbarui Sasaran Tabungan
            </h3>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Nama Sasaran
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Jumlah Sasaran (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Telah Disimpan (Rp)
                  </label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Tenggat Waktu (Opsional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
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
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK DEPOSIT/ADD FUNDS TO GOAL MODAL */}
      {isDepositModalOpen && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 mb-1 flex items-center gap-1.5">
              <Sparkles size={20} className="text-emerald-600 animate-pulse" />
              Menambah Wang Simpanan
            </h3>
            <p className="text-xs text-zinc-500 mb-4 font-semibold">
              Sasaran: <span className="font-bold text-zinc-900 dark:text-zinc-200">{selectedGoal.name}</span>
            </p>
            <form onSubmit={handleSubmitDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Jumlah Wang Yang Disimpan (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 500000"
                  value={depositValue}
                  onChange={(e) => setDepositValue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
                >
                  Masukkan Simpanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

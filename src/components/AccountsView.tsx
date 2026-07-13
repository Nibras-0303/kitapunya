import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Wallet,
  Coins,
  CreditCard,
  Building,
  HelpCircle,
  ArrowRightLeft
} from "lucide-react";
import { Account } from "../types.js";
import { formatRupiah } from "../utils/format.js";

interface AccountsViewProps {
  accounts: Account[];
  onCreateAccount: (acc: { name: string; type: string; balance: number; color: string }) => Promise<void>;
  onUpdateAccount: (id: string, acc: { name?: string; type?: string; balance?: number; color?: string }) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onTransfer: (fromAccountId: string, toAccountId: string, amount: number, description: string) => Promise<void>;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  onTransfer,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // States for CRUD
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("Bank");
  const [balance, setBalance] = useState("0");
  const [color, setColor] = useState("#3B82F6");

  // States for Transfer
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDesc, setTransferDesc] = useState("Pindahan baki akaun");

  const colors = [
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#1E293B", // Slate
  ];

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "Bank": return <Building size={20} />;
      case "E-Wallet": return <Wallet size={20} />;
      case "Cash": return <Coins size={20} />;
      default: return <CreditCard size={20} />;
    }
  };

  const handleOpenAdd = () => {
    setName("");
    setType("Bank");
    setBalance("0");
    setColor("#3B82F6");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setSelectedAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(String(acc.balance));
    setColor(acc.color);
    setIsEditModalOpen(true);
  };

  const handleOpenTransfer = () => {
    if (accounts.length < 2) {
      alert("Anda memerlukan sekurang-kurangnya 2 akaun untuk melakukan pindahan baki.");
      return;
    }
    setFromAccountId(accounts[0].id);
    setToAccountId(accounts[1].id);
    setTransferAmount("");
    setTransferDesc("Pindahan baki akaun");
    setIsTransferModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreateAccount({
      name,
      type,
      balance: Number(balance) || 0,
      color,
    });
    setIsAddModalOpen(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !name.trim()) return;
    await onUpdateAccount(selectedAccount.id, {
      name,
      type,
      balance: Number(balance) || 0,
      color,
    });
    setIsEditModalOpen(false);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(transferAmount);
    if (!fromAccountId || !toAccountId || isNaN(amount) || amount <= 0) {
      alert("Sila masukkan nilai jumlah yang betul.");
      return;
    }

    if (fromAccountId === toAccountId) {
      alert("Akaun sumber dan akaun destinasi tidak boleh sama.");
      return;
    }

    const sourceAcc = accounts.find(a => a.id === fromAccountId);
    if (sourceAcc && sourceAcc.balance < amount) {
      alert("Baki akaun sumber tidak mencukupi.");
      return;
    }

    await onTransfer(fromAccountId, toAccountId, amount, transferDesc);
    setIsTransferModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Urus Akaun Keuangan
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-1">
            Urus baki akaun bank, e-dompet, simpanan dan tunai harian anda secara bersepadu.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="acc-transfer-btn"
            onClick={handleOpenTransfer}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-2xl transition-all"
          >
            <ArrowRightLeft size={16} />
            Pindahan Baki
          </button>
          <button
            id="acc-add-btn"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md active:scale-95"
          >
            <Plus size={16} />
            Tambah Akaun
          </button>
        </div>
      </div>

      {/* Grid List of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 relative shadow-sm flex flex-col justify-between overflow-hidden"
          >
            {/* Left colored tag line */}
            <div className="absolute top-0 bottom-0 left-0 w-2" style={{ backgroundColor: acc.color }} />

            <div className="space-y-4 pl-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2.5 py-1 rounded-lg">
                  {acc.type}
                </span>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <button
                    id={`acc-edit-${acc.id}`}
                    onClick={() => handleOpenEdit(acc)}
                    className="p-1.5 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Edit Akaun"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    id={`acc-delete-${acc.id}`}
                    onClick={() => {
                      if (confirm(`Adakah anda pasti mahu memadam akaun "${acc.name}"?`)) {
                        onDeleteAccount(acc.id);
                      }
                    }}
                    className="p-1.5 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    title="Padam Akaun"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-lg leading-tight truncate">
                  {acc.name}
                </h3>
              </div>
            </div>

            <div className="mt-8 flex items-end justify-between pl-2">
              <div className="p-3.5 rounded-2xl text-white" style={{ backgroundColor: acc.color }}>
                {getAccountIcon(acc.type)}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase block tracking-wider">
                  Baki Semasa
                </span>
                <span className="text-xl font-black text-zinc-950 dark:text-zinc-100 block mt-0.5">
                  {formatRupiah(acc.balance)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD ACCOUNT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 mb-4">
              Tambah Akaun Keuangan Baru
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Nama Akaun
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank Mandiri Utama"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Jenis Akaun
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                  >
                    <option value="Bank">Bank</option>
                    <option value="E-Wallet">E-Wallet</option>
                    <option value="Cash">Cash (Tunai)</option>
                    <option value="Investment">Pelaburan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Baki Permulaan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Tema Warna Kad
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c ? "border-zinc-900 dark:border-zinc-50 scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
                  Simpan Akaun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACCOUNT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 mb-4">
              Kemaskini Akaun Keuangan
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Nama Akaun
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
                    Jenis Akaun
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                  >
                    <option value="Bank">Bank</option>
                    <option value="E-Wallet">E-Wallet</option>
                    <option value="Cash">Cash (Tunai)</option>
                    <option value="Investment">Pelaburan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Baki Akaun (Rp)
                  </label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Tema Warna Kad
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c ? "border-zinc-900 dark:border-zinc-50 scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
                  Kemaskini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FUNDS TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
              <ArrowRightLeft size={20} className="text-emerald-600" />
              Pindahan Baki Antara Akaun
            </h3>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Daripada Akaun (Sumber)
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatRupiah(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Kepada Akaun (Destinasi)
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatRupiah(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Jumlah Pindahan (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Masukkan jumlah wang"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Keterangan Pindahan
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Top up e-wallet"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
                >
                  Lakukan Pindahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

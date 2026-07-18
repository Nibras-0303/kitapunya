import React, { useState } from "react";
import { Plus, Trash2, Edit2, Tag, ShoppingBag, Utensils, Car, Gamepad2, Briefcase, TrendingUp, HelpCircle, Heart, HeartCrack } from "lucide-react";
import { Category } from "../types.js";

interface CategoriesViewProps {
  categories: Category[];
  onCreateCategory: (cat: { name: string; type: "income" | "expense"; icon: string; color: string }) => Promise<void>;
  onUpdateCategory: (id: string, cat: { name?: string; type?: "income" | "expense"; icon?: string; color?: string }) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // States
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [icon, setIcon] = useState("Tag");
  const [color, setColor] = useState("#3B82F6");

  const colors = [
    "#EF4444", // Red
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#F59E0B", // Amber
    "#06B6D4", // Cyan
    "#1E293B", // Slate
  ];

  const icons = [
    { name: "Tag", component: Tag },
    { name: "ShoppingBag", component: ShoppingBag },
    { name: "Utensils", component: Utensils },
    { name: "Car", component: Car },
    { name: "Gamepad2", component: Gamepad2 },
    { name: "Briefcase", component: Briefcase },
    { name: "TrendingUp", component: TrendingUp },
    { name: "Heart", component: Heart },
  ];

  const getIconComponent = (iconName: string) => {
    const found = icons.find((i) => i.name === iconName);
    return found ? found.component : Tag;
  };

  const handleOpenAdd = () => {
    setName("");
    setType("expense");
    setIcon("Tag");
    setColor("#EF4444");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setIcon(cat.icon);
    setColor(cat.color);
    setIsEditModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreateCategory({ name, type, icon, color });
    setIsAddModalOpen(false);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !name.trim()) return;
    await onUpdateCategory(selectedCategory.id, { name, type, icon, color });
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Urus Kategori Transaksi
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-1">
            Cipta kategori belanjawan tersendiri untuk memetakan aliran keluar masuk kewangan secara sistematik.
          </p>
        </div>
        <button
          id="cat-add-btn"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md active:scale-95"
        >
          <Plus size={16} />
          Tambah Kategori
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const IconComponent = getIconComponent(cat.icon);
          const isSystem = cat.userId === null;

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm relative flex items-center gap-4 group"
            >
              <div
                className="p-3.5 rounded-2xl text-white shadow-sm"
                style={{ backgroundColor: cat.color }}
              >
                <IconComponent size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 truncate text-sm">
                    {cat.name}
                  </h3>
                  {isSystem && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                      Sistem
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 capitalize font-semibold block mt-0.5">
                  Jenis: {cat.type === "expense" ? "Perbelanjaan" : "Pendapatan"}
                </span>
              </div>

              {/* Actions */}
              {!isSystem && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                  <button
                    id={`cat-edit-${cat.id}`}
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg"
                    title="Edit Kategori"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    id={`cat-delete-${cat.id}`}
                    onClick={() => {
                      if (confirm(`Adakah anda pasti mahu memadam kategori "${cat.name}"?`)) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-500 hover:text-red-600 rounded-lg"
                    title="Padam Kategori"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD CATEGORY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 mb-4">
              Tambah Kategori Baru
            </h3>
            <form onSubmit={handleSubmitAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Belanja Kopi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Jenis Transaksi
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                  >
                    <option value="expense">Perbelanjaan (-)</option>
                    <option value="income">Pendapatan (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Pilih Ikon
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {icons.map((ic) => {
                      const IconComp = ic.component;
                      return (
                        <button
                          type="button"
                          key={ic.name}
                          onClick={() => setIcon(ic.name)}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            icon === ic.name ? "border-zinc-900 dark:border-zinc-50 bg-zinc-100 dark:bg-zinc-800" : "border-transparent"
                          }`}
                        >
                          <IconComp size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Tema Warna
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
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 mb-4">
              Kemaskini Kategori
            </h3>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Nama Kategori
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
                    Jenis Transaksi
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm focus:border-emerald-600 outline-none font-semibold"
                  >
                    <option value="expense">Perbelanjaan (-)</option>
                    <option value="income">Pendapatan (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Pilih Ikon
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {icons.map((ic) => {
                      const IconComp = ic.component;
                      return (
                        <button
                          type="button"
                          key={ic.name}
                          onClick={() => setIcon(ic.name)}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            icon === ic.name ? "border-zinc-900 dark:border-zinc-50 bg-zinc-100 dark:bg-zinc-800" : "border-transparent"
                          }`}
                        >
                          <IconComp size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Tema Warna
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
    </div>
  );
};

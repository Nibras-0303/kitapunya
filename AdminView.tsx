import React, { useState, useMemo } from "react";
import { ImageIcon, Calendar, DollarSign, ExternalLink, Trash2, Tag, ArrowRight, Eye, AlertCircle } from "lucide-react";
import { Transaction, Category } from "../types.js";
import { formatDate, formatRupiah } from "../utils/format.js";

interface GalleryViewProps {
  transactions: Transaction[];
  categories: Category[];
}

export const GalleryView: React.FC<GalleryViewProps> = ({ transactions, categories }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Filter transactions that have scanned receipt images attached
  const receiptTransactions = useMemo(() => {
    return transactions.filter((t) => t.receiptImageUrl);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Galeri Resit & Nota Pintar
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-1">
          Arkibkan dan cari salinan digital semua resit perbelanjaan anda yang diimbas oleh AI Gemini untuk rujukan cukai atau tuntutan syarikat.
        </p>
      </div>

      {receiptTransactions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {receiptTransactions.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);

            return (
              <div
                key={tx.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col group justify-between"
              >
                {/* Image Container with hover zoom */}
                <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden cursor-pointer" onClick={() => setSelectedImage(tx.receiptImageUrl || null)}>
                  <img
                    referrerPolicy="no-referrer"
                    src={tx.receiptImageUrl || ""}
                    alt={tx.description}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      className="p-2.5 bg-white text-zinc-900 rounded-full hover:scale-110 transition-transform shadow"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      {formatDate(tx.date)}
                    </span>
                    {cat && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {tx.description}
                    </h3>
                    <span className="text-base font-black text-red-600 dark:text-red-400 block mt-1">
                      {formatRupiah(tx.amount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <ImageIcon size={44} className="text-zinc-300" />
          <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">
            Galeri Kosong
          </h3>
          <p className="text-xs text-zinc-400 font-semibold max-w-sm">
            Mana-mana transaksi perbelanjaan yang dilampirkan dengan gambar resit atau diimbas menggunakan imbasan Gemini AI akan dipaparkan di sini.
          </p>
        </div>
      )}

      {/* FULLIMAGE PREVIEW DIALOG/LIGHTBOX */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl relative" onClick={(e) => e.stopPropagation()}>
            <img
              referrerPolicy="no-referrer"
              src={selectedImage}
              alt="Receipt Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer hover:bg-black/80"
            >
              Tutup [X]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from "react";
import { User, Users, Wallet } from "lucide-react";
import { api } from "../services/api.js";
import { AuthSession } from "../types.js";
import { motion } from "motion/react";

interface AuthViewProps {
  onAuthSuccess: (session: AuthSession) => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, showToast }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const selectProfile = async (email: string, name: string) => {
    setLoading(email);
    try {
      const session = await api.login(email, "dummy-password");
      showToast(`Selamat datang kembali, ${name}!`, "success");
      onAuthSuccess(session);
    } catch (err: any) {
      showToast(err.message || "Gagal masuk ke profil.", "error");
    } finally {
      setLoading(null);
    }
  };

  const profiles = [
    {
      name: "Nibras",
      email: "nibras@kitapunya.id",
      description: "Profil Peribadi & Budget Peribadi Nibras",
      color: "from-blue-600 to-indigo-700 shadow-blue-500/20 text-blue-600",
      borderHover: "hover:border-blue-500 hover:bg-blue-50/5 dark:hover:bg-blue-950/10",
      icon: User,
    },
    {
      name: "Zenita",
      email: "zenita@kitapunya.id",
      description: "Profil Peribadi & Budget Peribadi Zenita",
      color: "from-pink-500 to-rose-600 shadow-pink-500/20 text-pink-500",
      borderHover: "hover:border-pink-500 hover:bg-pink-50/5 dark:hover:bg-pink-950/10",
      icon: User,
    },
    {
      name: "Uang Bersama",
      email: "bersama@kitapunya.id",
      description: "Gabungan & Kawalan Penuh Rumah Tangga",
      color: "from-emerald-500 to-teal-600 shadow-emerald-500/20 text-emerald-600",
      borderHover: "hover:border-emerald-500 hover:bg-emerald-50/5 dark:hover:bg-emerald-950/10",
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-4xl flex flex-col items-center relative z-10">
        {/* Title Logo section */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-3xl shadow-xl mb-4">
            <Wallet size={32} />
          </div>
          <h1 className="font-black text-3xl md:text-4xl text-zinc-900 dark:text-white tracking-tight">
            KitaPunya
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Platform Pengurusan Kewangan Moden Pintar
          </p>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-8 tracking-tight">
          Sila Pilih Profil Pengguna
        </h2>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
          {profiles.map((profile, index) => {
            const IconComponent = profile.icon;
            const isLoading = loading === profile.email;

            return (
              <motion.button
                key={profile.email}
                id={`profile-card-${profile.name.toLowerCase().replace(/\s+/g, "-")}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectProfile(profile.email, profile.name)}
                disabled={loading !== null}
                className={`flex flex-col items-center p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-lg transition-all text-center cursor-pointer relative overflow-hidden group ${profile.borderHover}`}
              >
                {/* Profile Card Header Gradient background effect */}
                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${profile.color}`} />

                {/* Profile Icon Container */}
                <div className={`p-5 rounded-2xl bg-gradient-to-br ${profile.color} text-white mb-6 shadow-md transition-all group-hover:scale-110`}>
                  <IconComponent size={32} />
                </div>

                <h3 className="font-black text-xl text-zinc-900 dark:text-white group-hover:text-zinc-950 dark:group-hover:text-zinc-100 mb-2">
                  {profile.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-[200px]">
                  {profile.description}
                </p>

                {/* Selected Indicator/Spinner */}
                <div className="mt-6 min-h-[24px] flex items-center justify-center">
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                      Masuk Profil &rarr;
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

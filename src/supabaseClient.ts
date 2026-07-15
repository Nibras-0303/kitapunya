import { createClient } from "@supabase/supabase-js";

// Retrieve Supabase environment variables from Vite configuration
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Awas: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemui dalam environment. Sila pastikan fail .env diletakkan dengan betul."
  );
}

// Initialize the client for use in the frontend components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadReceiptImage(file: File | Blob): Promise<string> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL atau Anon Key tidak dikesan. Sila hubungi pentadbir sistem.");
  }

  const fileExt = file.type.split("/")[1] || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

  // Attempt to create the bucket 'receipts' if it doesn't exist (ignore error if listing/creating is restricted)
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const hasReceipts = buckets?.some(b => b.name === "receipts");
    if (!hasReceipts) {
      await supabase.storage.createBucket("receipts", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
    }
  } catch (err) {
    console.log("Bucket listing/creation programmatically skipped or not allowed:", err);
  }

  // Upload file
  const { data, error } = await supabase.storage
    .from("receipts")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    // If the bucket wasn't found, try to create bucket explicitly and upload again
    if (error.message?.includes("not found") || error.message?.includes("Bucket")) {
      try {
        await supabase.storage.createBucket("receipts", { public: true });
        const { data: retryData, error: retryError } = await supabase.storage
          .from("receipts")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });
        if (retryError) throw retryError;
        const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(fileName);
        return urlData.publicUrl;
      } catch (retryBucketErr: any) {
        throw new Error(`Gagal memuat naik imej resit: ${retryBucketErr.message || retryBucketErr}`);
      }
    }
    throw new Error(`Gagal memuat naik imej resit: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("receipts")
    .getPublicUrl(fileName);

  if (!urlData || !urlData.publicUrl) {
    throw new Error("Gagal mendapatkan URL awam bagi imej yang dimuat naik.");
  }

  return urlData.publicUrl;
}


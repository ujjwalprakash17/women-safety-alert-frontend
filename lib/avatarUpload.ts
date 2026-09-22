import { supabase } from "./supabaseClient";

const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

/** Uploads directly to Supabase Storage (bucket "avatars") rather than
 * through our own API — the bucket's RLS policies already scope each user
 * to writing only under their own supabase_user_id folder, so there's
 * nothing for a backend endpoint to add here. Returns the public URL to
 * save via api.updateProfile({ avatar_url }). */
export async function uploadAvatar(file: File, supabaseUserId: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Image is too large — please choose one under 3MB.");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${supabaseUserId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

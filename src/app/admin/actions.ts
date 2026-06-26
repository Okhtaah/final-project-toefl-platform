"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function promoteToAdmin(formData: FormData) {
  const supabase = await createClient();
  const userId = formData.get("userId") as string;

  if (!userId) return;

  // We check if the caller is an admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return;

  // Perform the update
  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);

  if (error) {
    console.error("Promote Error:", error);
  } else {
    revalidatePath("/admin");
  }
}

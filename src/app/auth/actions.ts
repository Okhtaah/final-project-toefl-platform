"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login Error:", error);
    return redirect(`/auth/login?message=${encodeURIComponent(error.message || "Could not authenticate user")}`);
  }

  // Determine user role and redirect
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "student";
    revalidatePath("/", "layout");
    redirect(role === "admin" ? "/admin" : "/student");
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Signup Error:", error);
    return redirect(`/auth/signup?message=${encodeURIComponent(error.message || "Could not sign up user")}`);
  }

  revalidatePath("/", "layout");
  redirect("/student");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

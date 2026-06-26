"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function createCourse(formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  const { data: course, error } = await supabase
    .from("courses")
    .insert({ title, description, is_published: true })
    .select()
    .single();

  if (course) {
    // Automatically scaffold a Reading Module for this course
    const { data: module } = await supabase
      .from("modules")
      .insert({
        course_id: course.id,
        title: "Reading Section",
        type: "reading",
        time_limit_minutes: 35,
        order_index: 1,
      })
      .select()
      .single();

    if (module) {
      // Scaffold an empty passage
      await supabase.from("passages").insert({
        module_id: module.id,
        title: "Draft Passage",
        content: "Enter your reading text here...",
      });
    }
    revalidatePath("/admin/courses", "layout");
    redirect(`/admin/courses/${course.id}`);
  }

  revalidatePath("/admin/courses", "layout");
}

export async function updateModule(formData: FormData) {
  const supabase = await createClient();
  const moduleId = formData.get("moduleId") as string;
  const title = formData.get("title") as string;
  const timeLimit = parseInt(formData.get("timeLimit") as string);
  const warningLimit = parseInt(formData.get("warningLimit") as string) || 2;

  await supabase
    .from("modules")
    .update({ title, time_limit_minutes: timeLimit, warning_time_minutes: warningLimit })
    .eq("id", moduleId);

  revalidatePath("/admin/courses", "layout");
}

export async function updatePassage(formData: FormData) {
  const supabase = await createClient();
  const passageId = formData.get("passageId") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await supabase
    .from("passages")
    .update({ title, content })
    .eq("id", passageId);

  revalidatePath("/admin/courses", "layout");
}

export async function addQuestion(formData: FormData) {
  const supabase = await createClient();
  const passageId = formData.get("passageId") as string;
  const type = formData.get("type") as string;
  const questionText = formData.get("questionText") as string;
  const correctAnswer = formData.get("correctAnswer") as string;
  const optionsRaw = formData.get("options") as string;

  let options = null;
  if (type === "mcq" && optionsRaw) {
    options = optionsRaw.split(",").map((o) => o.trim());
  }

  // Get current max order
  const { data: existing } = await supabase
    .from("questions")
    .select("order_index")
    .eq("passage_id", passageId)
    .order("order_index", { ascending: false })
    .limit(1);

  const orderIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 1;

  await supabase.from("questions").insert({
    passage_id: passageId,
    type,
    question_text: questionText,
    correct_answer: correctAnswer,
    options,
    order_index: orderIndex,
  });

  revalidatePath("/admin/courses", "layout");
}

export async function deleteCourse(formData: FormData) {
  const supabase = await createClient();
  const courseId = formData.get("courseId") as string;
  await supabase.from("courses").delete().eq("id", courseId);
  revalidatePath("/admin/courses", "layout");
}

export async function deleteQuestion(formData: FormData) {
  const supabase = await createClient();
  const questionId = formData.get("questionId") as string;
  await supabase.from("questions").delete().eq("id", questionId);
  revalidatePath("/admin/courses");
}

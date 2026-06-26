import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import TestInterface from "./TestInterface";

export default async function TestPage({
  params,
}: {
  params: Promise<{ passageId: string }>;
}) {
  const supabase = await createClient();
  const { passageId } = await params;

  // Fetch the passage, its module (for time limit), and its questions
  const { data: passage } = await supabase
    .from("passages")
    .select(`
      *,
      modules (
        time_limit_minutes,
        warning_time_minutes
      ),
      questions (*)
    `)
    .eq("id", passageId)
    .single();

  if (!passage) {
    return notFound();
  }

  // Sort questions by order_index
  const questions = passage.questions?.sort((a: any, b: any) => a.order_index - b.order_index) || [];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <TestInterface 
        passage={passage} 
        timeLimit={passage.modules?.time_limit_minutes || 35} 
        warningLimit={passage.modules?.warning_time_minutes || 2}
        questions={questions} 
      />
    </div>
  );
}

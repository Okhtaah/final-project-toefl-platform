import { createClient } from "@/utils/supabase/server";
import { updateModule, updatePassage, deleteQuestion } from "../actions";
import QuestionForm from "../QuestionForm";
import { ArrowLeft, Clock, AlignLeft, CheckSquare, GripVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CourseEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      modules (
        *,
        passages (
          *,
          questions (*)
        )
      )
    `)
    .eq("id", id)
    .single();

  if (!course) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Link href="/admin/courses" className="text-sm text-foreground/60 hover:text-primary flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </Link>
        </div>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-foreground/70">{course.description}</p>
      </div>

      <div className="flex flex-col gap-8">
        {course.modules?.map((module: any) => (
          <div key={module.id} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                Module Editor
              </h2>
            </div>
            
            <div className="p-6">
              <form action={updateModule} className="flex flex-col sm:flex-row items-end gap-4 mb-8 bg-primary/5 p-4 rounded-xl border border-primary/20">
                <input type="hidden" name="moduleId" value={module.id} />
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold mb-1 text-primary">Module Title</label>
                  <input name="title" defaultValue={module.title} className="w-full rounded-md px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black font-semibold" />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-xs font-bold mb-1 text-primary flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Timer (mins)
                  </label>
                  <input name="timeLimit" type="number" defaultValue={module.time_limit_minutes} className="w-full rounded-md px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black" />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-xs font-bold mb-1 text-orange-500 flex items-center gap-1" title="When to show the low-time warning">
                    Warning At (mins)
                  </label>
                  <input name="warningLimit" type="number" defaultValue={module.warning_time_minutes || 2} className="w-full rounded-md px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black" />
                </div>
                <button className="bg-primary text-primary-foreground font-semibold px-6 py-2 rounded-md hover:opacity-90 w-full sm:w-auto">
                  Save Module
                </button>
              </form>

              {module.passages?.map((passage: any) => (
                <div key={passage.id} className="flex flex-col xl:flex-row gap-8">
                  {/* Passage Editor */}
                  <form action={updatePassage} className="flex-1 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-gray-50/50 dark:bg-gray-900/30">
                    <input type="hidden" name="passageId" value={passage.id} />
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                      <AlignLeft className="h-5 w-5" /> Reading Passage
                    </h3>
                    <input 
                      name="title" 
                      defaultValue={passage.title} 
                      className="w-full mb-4 rounded-xl px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black font-bold"
                    />
                    <textarea 
                      name="content" 
                      defaultValue={passage.content} 
                      className="w-full h-[400px] rounded-xl px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black font-serif leading-relaxed"
                    />
                    <button className="mt-4 w-full bg-foreground text-background font-semibold py-3 rounded-xl hover:opacity-90">
                      Save Passage
                    </button>
                  </form>

                  {/* Questions Manager */}
                  <div className="flex-1 flex flex-col gap-6">
                    <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                        <CheckSquare className="h-5 w-5" /> Add Question
                      </h3>
                      <QuestionForm passageId={passage.id} />
                    </div>

                    {/* Question List */}
                    <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-gray-50/50 dark:bg-gray-900/30 flex-1 overflow-hidden flex flex-col">
                      <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                        Questions ({passage.questions?.length || 0})
                      </h3>
                      <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                        {passage.questions?.sort((a: any, b: any) => a.order_index - b.order_index).map((q: any, i: number) => (
                          <div key={q.id} className="p-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 text-sm flex gap-3 shadow-sm group">
                            <GripVertical className="h-5 w-5 text-gray-400 shrink-0 mt-1" />
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <p className="font-bold text-base">{i + 1}. {q.question_text}</p>
                                <form action={deleteQuestion}>
                                  <input type="hidden" name="questionId" value={q.id} />
                                  <button className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100" title="Delete Question">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </form>
                              </div>
                              <p className="text-xs text-foreground/60 mb-2 font-mono bg-gray-100 dark:bg-gray-800 inline-block px-2 py-0.5 rounded">Type: {q.type}</p>
                              {q.options && (
                                <ul className="list-disc pl-5 text-sm mb-2 space-y-1">
                                  {q.options.map((opt: string, idx: number) => <li key={idx}>{opt}</li>)}
                                </ul>
                              )}
                              <p className="text-sm text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 inline-block px-2 py-1 rounded-md mt-1">
                                Answer: {q.correct_answer}
                              </p>
                            </div>
                          </div>
                        ))}
                        {(!passage.questions || passage.questions.length === 0) && (
                          <div className="text-center text-foreground/50 py-8">
                            No questions added yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

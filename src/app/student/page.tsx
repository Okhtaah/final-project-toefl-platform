import { createClient } from "@/utils/supabase/server";
import { BookOpen, Headphones, PenTool, Mic, PlayCircle } from "lucide-react";
import StartTestButton from "./StartTestButton";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all published courses
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      modules (
        time_limit_minutes,
        passages (id)
      )
    `)
    .eq("is_published", true);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, <span className="text-primary">{user?.email?.split('@')[0]}</span>! 👋
        </h1>
        <p className="text-foreground/70 text-lg">
          Ready to continue your TOEFL preparation? You have 2 mock tests remaining.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Course Cards Container */}
        <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses && courses.length > 0 ? courses.map((course: any) => {
            // Find the first passage to link to
            const firstModuleWithPassage = course.modules?.find((m: any) => m.passages?.length > 0);
            const firstPassage = firstModuleWithPassage?.passages[0];
            const testHref = firstPassage ? `/student/test/${firstPassage.id}` : "#";
            const timeLimit = firstModuleWithPassage?.time_limit_minutes || 35;

            return (
              <div key={course.id} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm group hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col">
                <div className="h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative">
                  <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
                  <div className="absolute top-4 right-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    Full Course
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold mb-2">{course.title}</h3>
                  <p className="text-foreground/70 text-sm mb-6 flex-1 line-clamp-2">
                    {course.description || "Master the TOEFL with our comprehensive preparation material."}
                  </p>
                  
                  <div className="space-y-4 mt-auto">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Progress</span>
                      <span>0%</span>
                    </div>
                    <StartTestButton href={testHref} timeLimit={timeLimit} />
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-12 text-center text-foreground/50 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              No courses available yet.
            </div>
          )}
        </div>

        {/* Quick Practice Module */}
        <div className="group border border-gray-200 dark:border-gray-800 bg-white dark:bg-black rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Practice</h3>
            <p className="text-sm text-foreground/70 mb-6">Target specific skills before taking a full mock exam.</p>
            
            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-primary/10 hover:border-primary/30 transition-all group/btn">
                <Headphones className="h-4 w-4 text-primary group-hover/btn:scale-110 transition-transform" />
                <span className="text-sm font-medium">Listening Drills</span>
              </button>
              <button className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-primary/10 hover:border-primary/30 transition-all group/btn">
                <PenTool className="h-4 w-4 text-primary group-hover/btn:scale-110 transition-transform" />
                <span className="text-sm font-medium">Writing Prompts</span>
              </button>
              <button className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-primary/10 hover:border-primary/30 transition-all group/btn">
                <Mic className="h-4 w-4 text-primary group-hover/btn:scale-110 transition-transform" />
                <span className="text-sm font-medium">Speaking Tasks</span>
              </button>
            </div>
          </div>
        </div>
        
      </div>
      
    </div>
  );
}

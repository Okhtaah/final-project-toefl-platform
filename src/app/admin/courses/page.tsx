import { createClient } from "@/utils/supabase/server";
import { deleteCourse } from "./actions";
import { PlusCircle, ArrowLeft, Trash2, Edit } from "lucide-react";
import Link from "next/link";

export default async function CoursesListPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, is_published, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-sm text-foreground/60 hover:text-primary flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Manage Courses</h1>
          <p className="text-foreground/70">View and manage all your TOEFL courses.</p>
        </div>
        <Link href="/admin/courses/new" className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl hover:opacity-90 flex items-center gap-2 shadow-lg">
          <PlusCircle className="h-5 w-5" />
          Add Course
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <div key={course.id} className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-black rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${course.is_published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                  {course.is_published ? "Published" : "Draft"}
                </span>
                
                <form action={deleteCourse}>
                  <input type="hidden" name="courseId" value={course.id} />
                  <button className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Delete Course">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </form>
              </div>
              <h3 className="text-2xl font-bold mb-2">{course.title}</h3>
              <p className="text-sm text-foreground/70 line-clamp-3">{course.description || "No description provided."}</p>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
              <Link href={`/admin/courses/${course.id}`} className="w-full flex items-center justify-center gap-2 text-primary font-bold hover:opacity-80 py-2">
                <Edit className="h-4 w-4" /> Edit Course Details
              </Link>
            </div>
          </div>
        ))}

        {courses?.length === 0 && (
          <div className="col-span-full text-center text-foreground/50 py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            No courses created yet. Click "Add Course" to get started!
          </div>
        )}
      </div>
    </div>
  );
}

import { createCourse } from "../actions";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default function NewCoursePage() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Link href="/admin/courses" className="text-sm text-foreground/60 hover:text-primary flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </Link>
        </div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Create New Course
        </h1>
        <p className="text-foreground/70 mt-2">Initialize a new TOEFL course. A default reading module will be created automatically.</p>
      </div>

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
        <form action={createCourse} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">Course Title</label>
            <input 
              name="title" 
              required 
              placeholder="e.g., Ultimate TOEFL Prep" 
              className="w-full rounded-xl px-4 py-3 border border-gray-300 dark:border-gray-700 bg-gray-50 focus:bg-white dark:bg-gray-900/50 dark:focus:bg-black focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Description</label>
            <textarea 
              name="description" 
              placeholder="Provide a brief overview of what this course contains..." 
              className="w-full rounded-xl px-4 py-3 border border-gray-300 dark:border-gray-700 bg-gray-50 focus:bg-white dark:bg-gray-900/50 dark:focus:bg-black focus:ring-2 focus:ring-primary focus:outline-none transition-all h-32" 
            />
          </div>
          <button className="bg-primary text-primary-foreground font-bold text-lg px-6 py-4 rounded-xl hover:opacity-90 shadow-lg mt-4">
            Initialize Course
          </button>
        </form>
      </div>
    </div>
  );
}

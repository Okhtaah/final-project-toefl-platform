import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-center font-mono text-sm gap-8">
        <h1 className="text-4xl md:text-6xl font-bold text-center tracking-tighter">
          TOEFL <span className="text-primary">Platform</span>
        </h1>
        
        <p className="text-center text-lg text-foreground/60 max-w-[600px]">
          Master the TOEFL exam with advanced multimedia testing, synchronized audio, and timed voice recording.
        </p>

        <div className="flex gap-4 items-center mt-4">
          <Link 
            href="/auth/login" 
            className="bg-primary text-primary-foreground font-semibold rounded-md px-6 py-3 hover:opacity-90 transition-opacity shadow-lg"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/signup" 
            className="bg-inherit text-foreground border border-gray-300 dark:border-gray-700 font-semibold rounded-md px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm"
          >
            Create Account
          </Link>
        </div>
        
        <div className="fixed bottom-8">
          <ThemeToggle />
        </div>
      </div>
    </main>
  );
}

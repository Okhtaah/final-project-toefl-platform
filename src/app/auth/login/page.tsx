import Link from "next/link";
import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome Back</h1>
        <p className="text-sm text-foreground/60">
          Sign in to access your TOEFL preparation dashboard
        </p>
      </div>

      <form
        className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
        action={login}
      >
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-gray-300 dark:border-gray-700 mb-6 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-gray-300 dark:border-gray-700 mb-6 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <button className="bg-primary text-primary-foreground font-semibold rounded-md px-4 py-2 mb-2 hover:opacity-90 transition-opacity flex items-center justify-center shadow-lg">
          Sign In
        </button>

        {message && (
          <p className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-center rounded-md text-sm border border-red-200 dark:border-red-800">
            {message}
          </p>
        )}
      </form>

      <p className="text-center text-sm text-foreground/60 mt-4">
        Don't have an account?{" "}
        <Link href="/auth/signup" className="text-primary hover:underline font-semibold">
          Sign up
        </Link>
      </p>
    </div>
  );
}

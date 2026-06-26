"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-primary/20 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 scale-100 transition-all dark:scale-0 dark:hidden" />
      <Moon className="h-5 w-5 scale-0 hidden transition-all dark:scale-100 dark:block" />
    </button>
  );
}

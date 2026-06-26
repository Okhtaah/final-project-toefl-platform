"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, AlertTriangle, Clock } from "lucide-react";

export default function StartTestButton({ href, timeLimit }: { href: string, timeLimit?: number }) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  if (href === "#") {
    return (
      <button disabled className="w-full bg-gray-300 text-gray-500 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
        No Tests Available
      </button>
    );
  }

  return (
    <>
      <button 
        onClick={() => setShowModal(true)} 
        className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group-hover:scale-[1.02]"
      >
        <PlayCircle className="h-5 w-5" />
        Continue Learning
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full mb-6 mx-auto">
              <AlertTriangle className="h-8 w-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">Ready to Start?</h2>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
              <p className="text-foreground/80 text-center mb-3">
                This section operates under strict exam conditions.
              </p>
              <ul className="text-sm font-semibold flex flex-col gap-2">
                <li className="flex items-center justify-between text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg">
                  <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Time Limit</span>
                  <span>{timeLimit || 35} Minutes</span>
                </li>
                <li className="flex items-center justify-between bg-white dark:bg-black px-3 py-2 rounded-lg">
                  <span>Auto-Submit</span>
                  <span>Enabled</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 font-bold rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => router.push(href)}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 shadow-lg transition-opacity"
              >
                Start Test Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

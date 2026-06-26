"use client";

import { useState } from "react";
import { addQuestion } from "./actions";

export default function QuestionForm({ passageId }: { passageId: string }) {
  const [type, setType] = useState("mcq");

  return (
    <form action={addQuestion} className="flex flex-col gap-3">
      <input type="hidden" name="passageId" value={passageId} />
      
      <label className="text-xs font-semibold text-foreground/70 -mb-2">Question Type</label>
      <select 
        name="type" 
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="rounded-md px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-foreground"
      >
        <option value="mcq">Multiple Choice (MCQ)</option>
        <option value="fill_in_blanks">Fill in the Blanks</option>
      </select>

      <label className="text-xs font-semibold text-foreground/70 -mb-2">Question Text</label>
      <textarea 
        name="questionText" 
        placeholder="Enter the question here..." 
        required 
        className="rounded-md px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-foreground" 
      />
      
      {type === "mcq" && (
        <>
          <label className="text-xs font-semibold text-foreground/70 -mb-2">Options (comma separated)</label>
          <input 
            name="options" 
            placeholder="e.g. Apple, Banana, Orange" 
            required
            className="rounded-md px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-foreground" 
          />
        </>
      )}
      
      <label className="text-xs font-semibold text-foreground/70 -mb-2">
        {type === "mcq" ? "Correct Answer (must match one option exactly)" : "Correct Answer"}
      </label>
      <input 
        name="correctAnswer" 
        placeholder={type === "mcq" ? "e.g. Banana" : "The exact word to fill"} 
        required 
        className="rounded-md px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-foreground" 
      />
      
      <button className="bg-primary text-primary-foreground font-semibold py-2 rounded-md hover:opacity-90 mt-2">
        Add Question
      </button>
    </form>
  );
}

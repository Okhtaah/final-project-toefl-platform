"use client";

import { useState, useEffect } from "react";
import { Clock, ChevronRight, ChevronLeft, Send, AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  type: string;
  question_text: string;
  options: string[] | null;
};

type TestInterfaceProps = {
  passage: { title: string; content: string };
  timeLimit: number;
  warningLimit?: number;
  questions: Question[];
};

export default function TestInterface({ passage, timeLimit, warningLimit = 2, questions }: TestInterfaceProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }

        if (newTime === warningLimit * 60 && !warningDismissed) {
          setShowWarning(true);
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, warningLimit, warningDismissed]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    // In Step 4, we will submit this to the server for auto-scoring.
    // For now, we'll just show an alert and return home.
    alert("Test Submitted! Auto-scoring will be implemented in Step 4.");
    router.push("/student");
  };

  if (questions.length === 0) {
    return <div className="p-8 text-center">No questions available for this passage.</div>;
  }

  const question = questions[currentIndex];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Warning Overlay */}
      {showWarning && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div className="font-bold">
            Only {warningLimit} minutes left! Please wrap up your answers.
          </div>
          <button 
            onClick={() => { setShowWarning(false); setWarningDismissed(true); }}
            className="ml-4 p-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Test Header */}
      <div className="h-14 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0">
        <div className="font-bold text-lg">TOEFL Reading Section</div>
        <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-1 rounded-md ${timeLeft < 300 ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-primary/10 text-primary'}`}>
          <Clock className="h-5 w-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Split Screen Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Passage */}
        <div className="flex-1 overflow-y-auto p-8 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800">
          <h1 className="text-2xl font-bold mb-6 font-serif">{passage.title}</h1>
          <div className="prose dark:prose-invert max-w-none font-serif leading-relaxed text-lg whitespace-pre-wrap">
            {passage.content}
          </div>
        </div>

        {/* Right Side: Questions */}
        <div className="flex-1 flex flex-col bg-gray-50/30 dark:bg-gray-900/10">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">
              Question {currentIndex + 1} of {questions.length}
            </div>
            
            <h2 className="text-xl font-bold mb-8 leading-relaxed">
              {question.question_text}
            </h2>

            {/* MCQ Type */}
            {question.type === "mcq" && question.options && (
              <div className="flex flex-col gap-3">
                {question.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(question.id, option)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      answers[question.id] === option 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[question.id] === option ? 'border-primary' : 'border-gray-300 dark:border-gray-700'}`}>
                        {answers[question.id] === option && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                      </div>
                      <span className="text-lg">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Fill in Blanks Type */}
            {question.type === "fill_in_blanks" && (
              <div>
                <input 
                  type="text" 
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  placeholder="Type your exact answer here..."
                  className="w-full text-lg p-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 focus:border-primary focus:outline-none focus:ring-0 bg-white dark:bg-black transition-all shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex justify-between shrink-0">
            <button
              onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-6 py-3 font-bold rounded-xl disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" /> Back
            </button>
            
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
              >
                Next <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
              >
                Submit <Send className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

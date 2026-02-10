"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";

interface QuizItem {
  id: number;
  category: string;
  question: string;
  korean: string;
  answer: string;
  options: string[];
  explanation: string;
}

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1KFYsRXVVS-o_TDN2jifEKgG7wQbitWFQdZ4NHWUh8Ng/gviz/tq?tqx=out:csv&sheet=Sheet1";
const SCORE_API_URL = "https://script.google.com/macros/s/AKfycbxwekr4DrKOj5jGIWVzfgmaybovS4J6s9qFIPL_kd6dHv5SjkRLM2o632v9FjBJazLJ/exec";

export default function Home() {
  // App State
  const [step, setStep] = useState<"login" | "quiz" | "result">("login");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz Data State
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

  // Interaction State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Load Quiz Data
  useEffect(() => {
    const fetchQuizData = async () => {
      setLoading(true);
      try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error("Failed to fetch data");
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedData = results.data.map((row: any, index: number) => ({
              id: index + 1,
              category: row.category,
              question: row.question,
              korean: row.korean,
              answer: row.answer,
              options: row.options ? row.options.split(",").map((opt: string) => opt.trim()) : [],
              explanation: row.explanation
            })).filter((item: QuizItem) => item.question && item.answer && item.options.length > 0);

            if (parsedData.length === 0) {
              setError("No quiz data found in the spreadsheet.");
            } else {
              // Shuffle and pick 20 questions
              const shuffled = parsedData.sort(() => 0.5 - Math.random());
              setQuizItems(shuffled.slice(0, 20));
            }
            setLoading(false);
          },
          error: (err: any) => {
            console.error("CSV Parse Error:", err);
            setError("Failed to parse quiz data.");
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Failed to load quiz data from Google Sheets.");
        setLoading(false);
      }
    };

    fetchQuizData();
  }, []);

  const handleStartQuiz = () => {
    if (!userName.trim()) {
      alert("Please enter your name first!");
      return;
    }
    setStep("quiz");
  };

  const handleOptionClick = (option: string) => {
    if (selectedOption) return;

    setSelectedOption(option);
    const correct = option === quizItems[currentQuestionIndex].answer;
    setIsCorrect(correct);
    if (correct) {
      setScore(score + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    setShowExplanation(false);

    if (currentQuestionIndex < quizItems.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setStep("result");
    
    // Send score to Google Sheet via Apps Script
    try {
      await fetch(SCORE_API_URL, {
        method: "POST",
        mode: "no-cors", // Required for Google Apps Script Web App
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userName,
          score: score,
          date: new Date().toISOString()
        })
      });
      console.log("Score submitted successfully!");
    } catch (err) {
      console.error("Failed to submit score:", err);
      // Don't show error to user, just log it. The result is still shown locally.
    }
  };

  const handleRestart = () => {
    window.location.reload(); // Simple way to reset state and fetch new random questions
  };

  // Loading / Error UI
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold p-4 text-center text-xl">
      Error: {error}
    </div>
  );

  // 1. Login Screen
  if (step === "login") {
    return (
      <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-4xl bg-white p-12 rounded-3xl shadow-xl text-center space-y-10">
          <h1 className="font-extrabold text-indigo-600 mb-4" style={{ fontSize: 'clamp(2.5rem, 4vw, 5rem)' }}>
            Logic Korean
          </h1>
          <p className="text-gray-500" style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>
            Enter your name to start the quiz.
          </p>
          
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 text-center transition-all"
            style={{ fontSize: 'clamp(1.2rem, 2vw, 2rem)' }}
            onKeyDown={(e) => e.key === "Enter" && handleStartQuiz()}
          />
          
          <button
            onClick={handleStartQuiz}
            disabled={!userName.trim()}
            className="w-full bg-indigo-600 text-white py-5 px-6 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{ fontSize: 'clamp(1.2rem, 2vw, 2rem)' }}
          >
            Start Quiz →
          </button>
          
          <p className="text-gray-400 mt-6" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}>
            Total {quizItems.length} questions available.<br/>
            You will solve 20 random questions.
          </p>
        </div>
      </div>
    );
  }

  // 2. Result Screen
  if (step === "result") {
    return (
      <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-4xl bg-white p-12 rounded-3xl shadow-xl text-center space-y-10 animate-fade-in">
          <div className="mb-6" style={{ fontSize: 'clamp(4rem, 8vw, 8rem)' }}>🏆</div>
          <h2 className="font-bold text-gray-800" style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }}>
            Quiz Completed!
          </h2>
          <p className="text-gray-500" style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)' }}>
            Good job, <span className="font-bold text-indigo-600">{userName}</span>!
          </p>
          
          <div className="bg-indigo-50 p-10 rounded-2xl border-2 border-indigo-100 my-8">
            <div className="text-gray-500 uppercase tracking-widest font-bold mb-2" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1.2rem)' }}>
              Your Score
            </div>
            <div className="font-extrabold text-indigo-600" style={{ fontSize: 'clamp(3rem, 6vw, 6rem)' }}>
              {score} <span className="text-gray-400" style={{ fontSize: 'clamp(1.5rem, 3vw, 3rem)' }}>/ {quizItems.length}</span>
            </div>
          </div>
          
          <button
            onClick={handleRestart}
            className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-5 px-6 rounded-2xl font-bold hover:bg-indigo-50 transition-colors"
            style={{ fontSize: 'clamp(1.2rem, 2vw, 2rem)' }}
          >
            Try Again ↺
          </button>
        </div>
      </div>
    );
  }

  // 3. Quiz Screen (Main)
  const currentQuestion = quizItems[currentQuestionIndex];
  
  if (!currentQuestion) return <div className="p-8 text-center text-xl">Error loading question.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-5xl space-y-8 bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100 min-h-[80vh] flex flex-col justify-center">
        
        {/* Header */}
        <div className="flex justify-between items-center text-gray-500 font-medium" style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)' }}>
          <span className="font-bold text-indigo-600">{userName}</span>
          <span>{currentQuestionIndex + 1} / {quizItems.length}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
          <div 
            className="bg-indigo-600 h-3 sm:h-4 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${((currentQuestionIndex + 1) / quizItems.length) * 100}%` }}
          ></div>
        </div>

        {/* Question Area */}
        <div className="py-4 space-y-6 flex-grow flex flex-col justify-center">
          <div className="uppercase tracking-widest text-gray-400 font-bold text-center" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1.2rem)' }}>
            {currentQuestion.category}
          </div>
          <div className="text-gray-700 font-medium text-center" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
            {currentQuestion.question}
          </div>
          <div className="font-bold text-gray-800 text-center bg-indigo-50 py-10 px-4 rounded-2xl border-2 border-indigo-100 shadow-inner" style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }}>
            {currentQuestion.korean.split(/_+/).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className={`inline-block min-w-[3ch] border-b-4 px-3 text-center mx-2 transition-all duration-300 ${
                    selectedOption 
                      ? (isCorrect ? "text-green-600 border-green-500 bg-green-50 rounded-lg" : "text-red-500 border-red-500 bg-red-50 rounded-lg") 
                      : "text-indigo-500 border-indigo-300"
                  }`}>
                    {selectedOption || "?"}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(option)}
              disabled={!!selectedOption}
              className={`py-6 px-6 rounded-2xl font-bold transition-all duration-200 shadow-sm border-2 
                ${selectedOption === option 
                  ? (option === currentQuestion.answer 
                      ? "bg-green-100 border-green-500 text-green-800 scale-105 shadow-md" 
                      : "bg-red-100 border-red-500 text-red-800 scale-95 opacity-80")
                  : (selectedOption && option === currentQuestion.answer 
                      ? "bg-green-50 border-green-300 text-green-700 opacity-75 ring-2 ring-green-200" // Show correct answer
                      : "bg-white border-gray-200 text-gray-700 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1 active:scale-95")
                }
              `}
              style={{ fontSize: 'clamp(1.2rem, 2vw, 2rem)' }}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Feedback / Explanation */}
        {showExplanation && (
          <div className={`mt-6 p-6 rounded-2xl border-l-8 animate-fade-in shadow-sm ${isCorrect ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}`}>
            <h3 className={`font-bold mb-2 ${isCorrect ? "text-green-800" : "text-red-800"}`} style={{ fontSize: 'clamp(1.2rem, 2vw, 1.8rem)' }}>
              {isCorrect ? "Correct! 🎉" : "Incorrect"}
            </h3>
            <p className="text-gray-700 leading-relaxed" style={{ fontSize: 'clamp(1rem, 1.8vw, 1.5rem)' }}>
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Next Button */}
        {selectedOption && (
          <div className="mt-6 pt-2">
            <button
              onClick={handleNext}
              className="w-full bg-indigo-600 text-white py-5 px-6 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-300 animate-bounce-subtle"
              style={{ fontSize: 'clamp(1.2rem, 2vw, 2rem)' }}
            >
              {currentQuestionIndex < quizItems.length - 1 ? "Next Question →" : "Finish Quiz 🏁"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

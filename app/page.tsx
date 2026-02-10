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
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold p-4 text-center">
      Error: {error}
    </div>
  );

  // 1. Login Screen
  if (step === "login") {
    return (
      <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center space-y-6">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">Logic Korean</h1>
          <p className="text-gray-500">Enter your name to start the quiz.</p>
          
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg text-center"
            onKeyDown={(e) => e.key === "Enter" && handleStartQuiz()}
          />
          
          <button
            onClick={handleStartQuiz}
            disabled={!userName.trim()}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Quiz →
          </button>
          
          <p className="text-xs text-gray-400 mt-4">
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
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center space-y-6 animate-fade-in">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-gray-800">Quiz Completed!</h2>
          <p className="text-gray-500 text-lg">Good job, <span className="font-bold text-indigo-600">{userName}</span>!</p>
          
          <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100 my-6">
            <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">Your Score</div>
            <div className="text-5xl font-extrabold text-indigo-600">
              {score} <span className="text-2xl text-gray-400">/ {quizItems.length}</span>
            </div>
          </div>
          
          <button
            onClick={handleRestart}
            className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-3 px-4 rounded-lg font-bold hover:bg-indigo-50 transition-colors"
          >
            Try Again ↺
          </button>
        </div>
      </div>
    );
  }

  // 3. Quiz Screen (Main)
  const currentQuestion = quizItems[currentQuestionIndex];
  
  if (!currentQuestion) return <div className="p-8 text-center">Error loading question.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        
        {/* Header */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span className="font-bold text-indigo-600">{userName}</span>
          <span>{currentQuestionIndex + 1} / {quizItems.length}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentQuestionIndex + 1) / quizItems.length) * 100}%` }}
          ></div>
        </div>

        {/* Question Area */}
        <div className="py-4 space-y-4">
          <div className="text-sm uppercase tracking-wide text-gray-400 font-bold text-center">
            {currentQuestion.category}
          </div>
          <div className="text-lg text-gray-700 font-medium text-center">
            {currentQuestion.question}
          </div>
          <div className="text-2xl font-bold text-gray-800 text-center bg-indigo-50 py-6 rounded-lg border border-indigo-100 shadow-inner">
            {currentQuestion.korean.split(/_+/).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className={`inline-block min-w-[3rem] border-b-2 px-2 text-center mx-1 transition-colors ${
                    selectedOption 
                      ? (isCorrect ? "text-green-600 border-green-500 bg-green-50 rounded" : "text-red-500 border-red-500 bg-red-50 rounded") 
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
        <div className="grid grid-cols-2 gap-3">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(option)}
              disabled={!!selectedOption}
              className={`py-3 px-4 rounded-lg text-lg font-medium transition-all duration-200 shadow-sm border-2 
                ${selectedOption === option 
                  ? (option === currentQuestion.answer 
                      ? "bg-green-100 border-green-500 text-green-800 scale-105" 
                      : "bg-red-100 border-red-500 text-red-800 scale-95 opacity-80")
                  : (selectedOption && option === currentQuestion.answer 
                      ? "bg-green-50 border-green-300 text-green-700 opacity-75 ring-2 ring-green-200" // Show correct answer
                      : "bg-white border-gray-200 text-gray-700 hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5")
                }
              `}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Feedback / Explanation */}
        {showExplanation && (
          <div className={`mt-4 p-4 rounded-lg border-l-4 animate-fade-in ${isCorrect ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}`}>
            <h3 className={`font-bold mb-1 ${isCorrect ? "text-green-800" : "text-red-800"}`}>
              {isCorrect ? "Correct! 🎉" : "Incorrect"}
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Next Button */}
        {selectedOption && (
          <div className="mt-4 pt-2">
            <button
              onClick={handleNext}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 animate-bounce-subtle"
            >
              {currentQuestionIndex < quizItems.length - 1 ? "Next Question →" : "Finish Quiz 🏁"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

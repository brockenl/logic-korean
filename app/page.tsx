"use client";

import { useState, useEffect } from "react";
import quizData from "../data/quiz_data.json";

interface QuizItem {
  id: number;
  category: string;
  question: string;
  korean: string;
  answer: string;
  options: string[];
  explanation: string;
}

export default function Home() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);

  useEffect(() => {
    // Load data and shuffle if needed, for now just load directly
    setQuizItems(quizData);
  }, []);

  const currentQuestion = quizItems[currentQuestionIndex];

  const handleOptionClick = (option: string) => {
    if (selectedOption) return; // Prevent changing answer

    setSelectedOption(option);
    const correct = option === currentQuestion.answer;
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
      alert(`Quiz Finished! Your score: ${score}/${quizItems.length}`);
      setCurrentQuestionIndex(0);
      setScore(0);
    }
  };

  if (!currentQuestion) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">Logic Korean</h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
            {currentQuestion.category}
          </p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${((currentQuestionIndex + 1) / quizItems.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-right mt-1 text-gray-400">
            {currentQuestionIndex + 1} / {quizItems.length}
          </p>
        </div>

        {/* Question Area */}
        <div className="py-6 space-y-4">
          <div className="text-lg text-gray-600 font-medium text-center">
            {currentQuestion.question}
          </div>
          <div className="text-2xl font-bold text-gray-800 text-center bg-indigo-50 py-4 rounded-lg border border-indigo-100">
            {currentQuestion.korean.split("___").map((part, i) => (
              <span key={i}>
                {part}
                {i === 0 && (
                  <span className={`inline-block min-w-[3rem] border-b-2 px-1 text-center mx-1 transition-colors ${
                    selectedOption 
                      ? (isCorrect ? "text-green-600 border-green-500" : "text-red-500 border-red-500") 
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
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionClick(option)}
              disabled={!!selectedOption}
              className={`py-3 px-4 rounded-lg text-lg font-medium transition-all duration-200 shadow-sm border-2 
                ${selectedOption === option 
                  ? (option === currentQuestion.answer 
                      ? "bg-green-100 border-green-500 text-green-800" 
                      : "bg-red-100 border-red-500 text-red-800")
                  : (selectedOption && option === currentQuestion.answer 
                      ? "bg-green-50 border-green-300 text-green-700 opacity-75" // Show correct answer if wrong selected
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
          <div className={`mt-6 p-4 rounded-lg border-l-4 animate-fade-in ${isCorrect ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}`}>
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
          <div className="mt-6">
            <button
              onClick={handleNext}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Next Question →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

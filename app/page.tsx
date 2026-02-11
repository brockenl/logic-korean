"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";

// --- 데이터 타입 정의 ---
interface QuizItem {
  id: number;
  category: string;
  question: string;
  korean: string;
  answer: string;
  options: string[];
  explanation: string;
}

// --- 설정 URL ---
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1KFYsRXVVS-o_TDN2jifEKgG7wQbitWFQdZ4NHWUh8Ng/gviz/tq?tqx=out:csv&sheet=Sheet1";
const SCORE_API_URL = "https://script.google.com/macros/s/AKfycbxwekr4DrKOj5jGIWVzfgmaybovS4J6s9qFIPL_kd6dHv5SjkRLM2o632v9FjBJazLJ/exec";

export default function Home() {
  // --- 상태 관리 (State) ---
  const [step, setStep] = useState<"login" | "quiz" | "result">("login");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // --- 데이터 로드 (Effect) ---
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
              setError("No quiz data found.");
            } else {
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
        setError("Failed to load data.");
        setLoading(false);
      }
    };
    fetchQuizData();
  }, []);

  // --- 이벤트 핸들러 ---
  const handleStartQuiz = () => {
    if (!userName.trim()) return alert("Please enter your name!");
    setStep("quiz");
  };

  const handleOptionClick = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    
    const correct = option === quizItems[currentQuestionIndex].answer;
    setIsCorrect(correct);
    if (correct) setScore(score + 1);
    
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
    try {
await fetch(SCORE_API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: userName, score: score, date: new Date().toISOString() }),
        });
    } catch (error) {
        console.error("Error saving score:", error);
    }
  };

  // --- 화면 렌더링 (UI) ---
return
(
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 text-gray-900 font-sans">
      
      {loading && <p className="text-xl font-bold text-blue-600 animate-pulse">Loading Quiz...</p>}
      {error && <p className="text-red-500 font-bold">{error}</p>}

      {!loading && !error && (
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-10 border border-gray-100">
          
          {/* STEP 1: 로그인 */}
          {step === "login" && (
            <div className="flex flex-col gap-8 text-center">
              <div>
                <h1 className="text-4xl font-extrabold text-blue-600 mb-2">Logic Korean 🇰🇷</h1>
                <p className="text-gray-500">Master the logic of Korean grammar.</p>
              </div>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="border-2 border-gray-200 p-4 rounded-xl w-full text-lg focus:outline-none focus:border-blue-500 transition-colors text-center"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartQuiz()}
                />
                <button
                  onClick={handleStartQuiz}
                  className="bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all text-lg shadow-lg active:scale-95"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: 퀴즈 */}
          {step === "quiz" && quizItems.length > 0 && (
            <div className="flex flex-col gap-6">
              {/* 상단 정보 */}
              <div className="flex justify-between items-center text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-4">
                <span>Q {currentQuestionIndex + 1} / {quizItems.length}</span>
                <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Score: {score}</span>
              </div>

              {/* 문제 */}
              <div className="text-center py-2">
                <span className="text-xs font-bold text-gray-400 uppercase mb-2 block">{quizItems[currentQuestionIndex].category}</span>
                <h2 className="text-2xl font-bold mb-3 text-gray-800 leading-snug">{quizItems[currentQuestionIndex].question}</h2>
                <div className="inline-block bg-gray-100 px-4 py-2 rounded-lg text-gray-600 text-sm font-medium">
                  {quizItems[currentQuestionIndex].korean}
                </div>
              </div>

              {/* 보기 선택 */}
              <div className="grid grid-cols-1 gap-3">
                {quizItems[currentQuestionIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(option)}
                    disabled={selectedOption !== null}
                    className={`p-4 rounded-xl border-2 text-left transition-all font-bold text-lg
                      ${selectedOption === option 
                        ? (isCorrect 
                            ? "bg-green-50 border-green-500 text-green-700 shadow-md" 
                            : "bg-red-50 border-red-500 text-red-700 shadow-md")
                        : "bg-white border-gray-100 hover:border-blue-300 hover:bg-blue-50 text-gray-700"
                      }
                      ${selectedOption !== null && selectedOption !== option ? "opacity-40" : ""}
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {/* 해설 및 다음 버튼 */}
              {showExplanation && (
                <div className="animate-fade-in">
                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 text-sm mb-4">
<p className="font-bold text-blue-900 mb-1">💡 Logic Explanation</p>
                    <p className="text-blue-800 leading-relaxed">{quizItems[currentQuestionIndex].explanation}</p>
                  </div>
                  
                  <button
                    onClick={handleNext}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                  >
                    {currentQuestionIndex < quizItems.length - 1 ? "Next Question ->" : "Finish Quiz"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: 결과 */}
          {step === "result" && (
            <div className="text-center flex flex-col gap-8 py-8">
              <div className="animate-bounce text-6xl">🏆</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h1>
                <p className="text-gray-500">Great job, <span className="font-bold text-blue-600">{userName}</span>!</p>
              </div>
              
              <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
                <div className="text-sm text-blue-600 font-bold uppercase tracking-wider mb-2">Your Final Score</div>
                <div className="text-7xl font-black text-blue-600">
                  {score}
                  <span className="text-3xl text-blue-300 ml-2">/ {quizItems.length}</span>
                </div>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

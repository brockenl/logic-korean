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
    try {
      await fetch(SCORE_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          score: score,
          date: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error("Failed to submit score:", err);
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  // --- Inline CSS Styles (No Tailwind Dependency) ---
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EEF2FF', // indigo-50
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      padding: '20px',
      textAlign: 'center' as const,
    },
    card: {
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '24px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '20px',
    },
    title: {
      color: '#4F46E5', // indigo-600
      fontSize: 'clamp(2rem, 5vw, 3rem)',
      fontWeight: '800',
      marginBottom: '10px',
    },
    text: {
      color: '#6B7280', // gray-500
      fontSize: 'clamp(1rem, 2vw, 1.2rem)',
    },
    input: {
      width: '100%',
      padding: '16px',
      fontSize: '1.2rem',
      borderRadius: '12px',
      border: '2px solid #D1D5DB', // gray-300
      textAlign: 'center' as const,
      outline: 'none',
    },
    button: {
      width: '100%',
      backgroundColor: '#4F46E5', // indigo-600
      color: 'white',
      padding: '16px',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      marginTop: '10px',
      transition: 'background-color 0.2s',
    },
    buttonDisabled: {
      backgroundColor: '#A5B4FC', // indigo-300
      cursor: 'not-allowed',
    },
    optionGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      width: '100%',
    },
    optionButton: {
      padding: '20px',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      borderRadius: '16px',
      border: '2px solid #E5E7EB', // gray-200
      backgroundColor: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    correct: { backgroundColor: '#DCFCE7', borderColor: '#22C55E', color: '#15803D' }, // green
    incorrect: { backgroundColor: '#FEE2E2', borderColor: '#EF4444', color: '#B91C1C' }, // red
    koreanBox: {
      backgroundColor: '#EEF2FF',
      padding: '30px',
      borderRadius: '16px',
      fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
      fontWeight: 'bold',
      color: '#1F2937',
      width: '100%',
      border: '2px solid #E0E7FF',
    },
    progressBar: {
      width: '100%',
      height: '10px',
      backgroundColor: '#E5E7EB',
      borderRadius: '5px',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#4F46E5',
      transition: 'width 0.3s ease',
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;
  if (error) return <div style={styles.container}><span style={{color:'red'}}>{error}</span></div>;

  // 1. Login
  if (step === "login") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Logic Korean</h1>
          <p style={styles.text}>Enter your name to start.</p>
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={handleStartQuiz}
            disabled={!userName.trim()}
            style={{...styles.button, ...(userName.trim() ? {} : styles.buttonDisabled)}}
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // 2. Result
  if (step === "result") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{fontSize: '4rem'}}>🏆</div>
          <h2 style={styles.title}>Quiz Completed!</h2>
          <p style={styles.text}>Good job, <b>{userName}</b>!</p>
          <div style={{...styles.koreanBox, fontSize: '2rem'}}>
            Score: {score} / {quizItems.length}
          </div>
          <button onClick={handleRestart} style={styles.button}>Try Again</button>
        </div>
      </div>
    );
  }

  // 3. Quiz
  if (!currentQuestion) return <div style={styles.container}>Error</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={{width:'100%', display:'flex', justifyContent:'space-between', color:'#6B7280'}}>
          <b>{userName}</b>
          <span>{currentQuestionIndex + 1} / {quizItems.length}</span>
        </div>
        
        {/* Progress */}
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${((currentQuestionIndex + 1) / quizItems.length) * 100}%`}}></div>
        </div>

        {/* Question */}
        <div style={{width:'100%'}}>
          <p style={{fontSize:'0.9rem', color:'#9CA3AF', textTransform:'uppercase', fontWeight:'bold'}}>{currentQuestion.category}</p>
          <h3 style={{fontSize:'1.5rem', color:'#374151', margin:'10px 0'}}>{currentQuestion.question}</h3>
          
          <div style={styles.koreanBox}>
            {currentQuestion.korean.split(/_+/).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span style={{
                    display: 'inline-block',
                    minWidth: '50px',
                    borderBottom: '3px solid #4F46E5',
                    margin: '0 5px',
                    color: selectedOption ? (isCorrect ? '#15803D' : '#B91C1C') : '#4F46E5'
                  }}>
                    {selectedOption || "?"}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Options */}
        <div style={styles.optionGrid}>
          {currentQuestion.options.map((option, idx) => {
            let optionStyle = {...styles.optionButton};
            if (selectedOption === option) {
              optionStyle = {...optionStyle, ...(isCorrect ? styles.correct : styles.incorrect)};
            } else if (selectedOption && option === currentQuestion.answer) {
               optionStyle = {...optionStyle, ...styles.correct, opacity: 0.7};
            }
            
            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(option)}
                disabled={!!selectedOption}
                style={optionStyle}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div style={{
            backgroundColor: isCorrect ? '#F0FDF4' : '#FEF2F2',
            padding: '15px',
            borderRadius: '12px',
            borderLeft: `5px solid ${isCorrect ? '#22C55E' : '#EF4444'}`,
            textAlign: 'left',
            width: '100%'
          }}>
            <strong style={{color: isCorrect ? '#15803D' : '#B91C1C'}}>
              {isCorrect ? "Correct! 🎉" : "Incorrect"}
            </strong>
            <p style={{margin:'5px 0', fontSize:'0.95rem', color:'#374151'}}>{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Next Button */}
        {selectedOption && (
          <button onClick={handleNext} style={styles.button}>
            {currentQuestionIndex < quizItems.length - 1 ? "Next Question →" : "Finish Quiz 🏁"}
          </button>
        )}
      </div>
    </div>
  );
}

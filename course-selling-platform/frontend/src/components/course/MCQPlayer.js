import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const MCQPlayer = ({ quizData, lessonId, onQuizAttempt, isAlreadyCompleted }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // --- START: THE FIX ---
  // This effect syncs the component's internal state with the persistent global state.
  useEffect(() => {
    // If the parent says this lesson is already completed, lock the component.
    if (isAlreadyCompleted) {
      setSubmitted(true);
    } else {
      // Otherwise, reset the state for a new attempt.
      setSelectedOption(null);
      setSubmitted(false);
    }
  }, [quizData, isAlreadyCompleted]); // Re-run whenever the lesson or its status changes.
  // --- END: THE FIX ---

  const handleSubmit = () => {
    if (selectedOption === null) {
      toast.error('Please select an answer.');
      return;
    }
    setSubmitted(true); // Lock the component visually
    const isCorrect = selectedOption === quizData.correctAnswer;
    
    if (isCorrect) {
      toast.success('Correct!');
    } else {
      toast.error('Incorrect. The correct answer is highlighted.');
    }
    
    onQuizAttempt(lessonId, isCorrect); // Report the result to the parent
  };
  
  const getOptionClasses = (option) => {
    // If already completed from a previous session, show the result immediately.
    if (isAlreadyCompleted) {
      if (option === quizData.correctAnswer) return 'bg-green-200 border-green-400';
      return 'border-gray-300'; // Don't show wrong answers from past sessions
    }

    // Handle live submission feedback
    if (!submitted) return 'hover:bg-gray-100';
    if (option === quizData.correctAnswer) return 'bg-green-200 border-green-400';
    if (option === selectedOption) return 'bg-red-200 border-red-400';
    return 'border-gray-300';
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{quizData.question}</h3>
      <div className="space-y-3">
        {quizData.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !submitted && setSelectedOption(option)}
            className={`w-full text-left p-3 border rounded-md transition ${
              selectedOption === option && !submitted ? 'border-blue-500 ring-2 ring-blue-200' : ''
            } ${getOptionClasses(option)}`}
            // Disable options if already submitted OR if completed in a previous session
            disabled={submitted || isAlreadyCompleted}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="mt-6 text-right">
        {/* --- START: THE FIX --- */}
        {/* Show the submit button ONLY if the quiz has not been attempted yet */}
        {!submitted && !isAlreadyCompleted ? (
          <button onClick={handleSubmit} className="bg-blue-600 text-white font-bold py-2 px-6 rounded">
            Submit Answer
          </button>
        ) : (
          <p className="text-sm font-semibold text-gray-600 bg-gray-100 p-3 rounded-md inline-block">
            You have already attempted this quiz.
          </p>
        )}
        {/* --- END: THE FIX --- */}
      </div>
    </div>
  );
};

export default MCQPlayer;
import React, { useState } from 'react';

const LESSONS = [
  {
    id: 1,
    title: 'Alphabet - Part 1',
    letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
    description: 'Learn the first half of the manual alphabet'
  },
  {
    id: 2,
    title: 'Alphabet - Part 2',
    letters: ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    description: 'Complete the manual alphabet'
  },
  {
    id: 3,
    title: 'Essential Words',
    words: ['HELP', 'EMERGENCY', 'THANK YOU', 'PLEASE', 'SORRY', 'YES', 'NO'],
    description: 'Common phrases for daily communication'
  },
  {
    id: 4,
    title: 'Emergency Signs',
    words: ['POLICE', 'DOCTOR', 'HOSPITAL', 'AMBULANCE', 'FIRE', 'DANGER', 'SAFE'],
    description: 'Critical signs for emergency situations'
  }
];

const SignLanguageTutor = () => {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  const lesson = LESSONS[currentLesson];
  const currentItem = lesson?.letters?.[currentIndex] || lesson?.words?.[currentIndex];
  const isLetter = !!lesson?.letters;

  const getHandshape = (item) => {
    const shapes = {
      'A': '🤛', 'B': '🖐️', 'C': '👌', 'D': '☝️', 'E': '🤚', 'F': '👌', 'G': '👉', 'H': '✌️',
      'I': '🤙', 'J': '🤙', 'K': '🖖', 'L': '👍', 'M': '👌', 'N': '👌', 'O': '🤏', 'P': '🖖',
      'Q': '👇', 'R': '🤞', 'S': '✊', 'T': '✊', 'U': '☝️', 'V': '✌️', 'W': '🤟', 'X': '🤞',
      'Y': '🤙', 'Z': '👉', 'HELP': '🤝👍', 'EMERGENCY': '✊✊😟', 'THANK YOU': '🤚→👤',
      'PLEASE': '🖐️🔄', 'SORRY': '✊🔄', 'YES': '✊⬇️⬆️', 'NO': '✌️👆', 'POLICE': '🖐️⬇️',
      'DOCTOR': '✋💓', 'HOSPITAL': '🏥🤟', 'AMBULANCE': '🚑🤟', 'FIRE': '🔥🤟', 'DANGER': '⚠️🤟', 'SAFE': '✅🤟'
    };
    return shapes[item] || '🤟';
  };

  const nextItem = () => {
    const maxIndex = isLetter ? lesson.letters.length - 1 : lesson.words.length - 1;
    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setUserAnswer('');
    } else if (currentLesson < LESSONS.length - 1) {
      setCurrentLesson(currentLesson + 1);
      setCurrentIndex(0);
      setShowAnswer(false);
      setUserAnswer('');
    }
  };

  const prevItem = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
      setUserAnswer('');
    } else if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
      setCurrentIndex(0);
      setShowAnswer(false);
      setUserAnswer('');
    }
  };

  const checkAnswer = () => {
    if (userAnswer.toUpperCase().trim() === currentItem) {
      setScore(score + 1);
      setShowAnswer(true);
      setTimeout(() => {
        nextItem();
      }, 1500);
    } else {
      alert(`Incorrect! The correct sign is for "${currentItem}". Try again!`);
    }
  };

  return (
    <div className="card tutor-card">
      <div className="card-head">
        <div className="card-title">
          <span className="card-title-icon icon-teal">📖</span>
          Sign Language Tutor
        </div>
        <div className="lesson-controls">
          <button 
            className={`mode-switch ${!quizMode ? 'active' : ''}`}
            onClick={() => { setQuizMode(false); setShowAnswer(false); }}
          >
            Learn
          </button>
          <button 
            className={`mode-switch ${quizMode ? 'active' : ''}`}
            onClick={() => { setQuizMode(true); setScore(0); setCurrentIndex(0); }}
          >
            Quiz
          </button>
        </div>
      </div>

      <div className="lesson-progress">
        <span>Lesson {currentLesson + 1} of {LESSONS.length}</span>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentIndex + 1) / (isLetter ? lesson.letters.length : lesson.words.length)) * 100}%` }}
          />
        </div>
        <span>{currentIndex + 1} / {isLetter ? lesson.letters.length : lesson.words.length}</span>
      </div>

      <h3 className="lesson-title">{lesson.title}</h3>
      <p className="lesson-desc">{lesson.description}</p>

      {!quizMode ? (
        <div className="learning-view">
          <div className="sign-display-tutor">
            <div className="sign-animation-large">
              <span className="handshape-large">{getHandshape(currentItem)}</span>
              <div className="sign-practice-animation">
                <div className="hand-pulse"></div>
              </div>
            </div>
            <div className="sign-info-tutor">
              <h2 className="current-sign-item">{currentItem}</h2>
              <p className="sign-meaning">
                {isLetter 
                  ? `Letter ${currentItem} in sign language` 
                  : `The sign for "${currentItem}"`}
              </p>
              <button 
                className="reveal-btn"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                {showAnswer ? 'Hide Instruction' : 'Show How to Sign'}
              </button>
              {showAnswer && (
                <div className="sign-instruction">
                  <p>📝 To sign "{currentItem}":</p>
                  <ul>
                    <li>Form your hand as shown in the icon above</li>
                    <li>Position your hand at chest level</li>
                    <li>Make the shape clearly visible</li>
                    <li>Practice in front of a mirror</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="navigation-buttons">
            <button onClick={prevItem} className="nav-btn">← Previous</button>
            <button onClick={nextItem} className="nav-btn">Next →</button>
          </div>
        </div>
      ) : (
        <div className="quiz-view">
          <div className="quiz-header">
            <span className="quiz-score">Score: {score}</span>
          </div>
          <div className="quiz-question">
            <div className="handshape-quiz">{getHandshape(currentItem)}</div>
            <p className="quiz-prompt">What sign is this?</p>
            <input 
              type="text"
              className="quiz-input"
              placeholder="Enter your answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
            />
            <button onClick={checkAnswer} className="submit-answer">Check Answer</button>
          </div>
        </div>
      )}

      <div className="lesson-selector">
        <p>Jump to lesson:</p>
        <div className="lesson-buttons">
          {LESSONS.map((l, idx) => (
            <button
              key={idx}
              className={`lesson-jump ${currentLesson === idx ? 'active' : ''}`}
              onClick={() => {
                setCurrentLesson(idx);
                setCurrentIndex(0);
                setShowAnswer(false);
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="practice-reminder">
        <p>💪 <strong>Daily Practice Tip:</strong> Practice 5 signs every day. Use a mirror to check your hand shapes!</p>
      </div>
    </div>
  );
};

export default SignLanguageTutor;
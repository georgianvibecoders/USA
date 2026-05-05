import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, RotateCcw, Trophy, ChevronLeft, ChevronRight, Home, ArrowRight } from 'lucide-react';
import { usStates, StateData } from './states';

// Types
interface Question {
  state: StateData;
  correctAnswer: string;
  options: string[];
}

type QuizMode = 'nameToAbbr' | 'abbrToName';

export default function App() {
  const [quizMode, setQuizMode] = useState<QuizMode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  const QUESTION_COUNT = usStates.length;

  // Generate a random quiz with hard distractors
  const initializeQuiz = useCallback((mode: QuizMode) => {
    setQuizMode(mode);
    let generatedQuestions: Question[] = [];

    if (mode === 'nameToAbbr') {
      generatedQuestions = usStates.map((state) => {
        const correctAbbr = state.abbr;
        const firstLetter = correctAbbr[0];
        
        // 1. Real abbreviations that share the same first letter
        const realSameFirst = usStates
          .map(s => s.abbr)
          .filter(abbr => abbr[0] === firstLetter && abbr !== correctAbbr);
          
        // 2. Fake abbreviations derived from the state name
        const stateNameBody = state.nameEn.toUpperCase().replace(/[^A-Z]/g, '').slice(1);
        const nameLetters = Array.from(new Set(stateNameBody.split('')));
        const fakeFromName = nameLetters
          .map(letter => `${firstLetter}${letter}`)
          .filter(abbr => abbr !== correctAbbr && !realSameFirst.includes(abbr));

        // Shuffle pools
        const shuffledReal = realSameFirst.sort(() => 0.5 - Math.random());
        const shuffledFake = fakeFromName.sort(() => 0.5 - Math.random());

        let distractors: string[] = [];

        // Add up to 2 real abbreviations that start with the same letter
        distractors.push(...shuffledReal.slice(0, 2));

        // Fill the rest with fake ones derived from the state's name
        while (distractors.length < 3 && shuffledFake.length > 0) {
          distractors.push(shuffledFake.shift()!);
        }

        // If we still need more, fallback to other real ones or random letters
        if (distractors.length < 3) {
          distractors.push(...shuffledReal.slice(2));
        }
        
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        while (distractors.length < 3) {
          const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
          const candidate = `${firstLetter}${randomLetter}`;
          if (candidate !== correctAbbr && !distractors.includes(candidate)) {
            distractors.push(candidate);
          }
        }
        
        const wrongAbbrs = distractors.slice(0, 3).sort(() => 0.5 - Math.random());
        
        // Combine and shuffle options
        const options = [correctAbbr, ...wrongAbbrs].sort(() => 0.5 - Math.random());
        
        return { state, correctAnswer: correctAbbr, options };
      });
    } else {
      // abbrToName mode
      generatedQuestions = usStates.map((state) => {
        const correctName = `${state.nameGe} / ${state.nameEn}`;
        const firstLetter = state.abbr[0];
        
        const sameFirstLetterNames = usStates
          .filter(s => s.abbr !== state.abbr && s.nameEn[0].toUpperCase() === firstLetter)
          .map(s => `${s.nameGe} / ${s.nameEn}`);
          
        const otherNames = usStates
          .filter(s => s.abbr !== state.abbr && s.nameEn[0].toUpperCase() !== firstLetter)
          .map(s => `${s.nameGe} / ${s.nameEn}`);

        const shuffledSameFirst = sameFirstLetterNames.sort(() => 0.5 - Math.random());
        const shuffledOther = otherNames.sort(() => 0.5 - Math.random());
        
        let distractors: string[] = [];
        
        // Push up to 2 states that start with the same first letter for difficulty
        distractors.push(...shuffledSameFirst.slice(0, 2));
        
        // Fill the rest
        while (distractors.length < 3) {
          distractors.push(shuffledOther.shift()!);
        }
        
        const options = [correctName, ...distractors.slice(0, 3)].sort(() => 0.5 - Math.random());

        return { state, correctAnswer: correctName, options };
      });
    }

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setUserAnswers({});
    setIsFinished(false);
  }, []);

  const handleAnswerClick = (answer: string) => {
    // If already answered, ignore
    if (userAnswers[currentIndex]) return;
    
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: answer }));
    
    // Auto advance after a short delay if it's not the last question
    setTimeout(() => {
      if (currentIndex < QUESTION_COUNT - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 1000);
  };

  const handleReturnHome = () => {
    setQuizMode(null);
    setQuestions([]);
    setUserAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
  };

  if (quizMode === null) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-md w-full relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">აშშ-ის შტატები</h1>
            <p className="text-slate-500 mb-8">აირჩიეთ ქვიზის რეჟიმი</p>
            
            <div className="space-y-4">
              <button
                onClick={() => initializeQuiz('nameToAbbr')}
                className="w-full flex items-center justify-between p-5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl font-medium transition-all group active:scale-95"
              >
                <div className="text-left">
                  <div className="font-bold text-lg mb-1">სახელი ➔ აბრევიატურა</div>
                  <div className="text-sm text-indigo-600/70">გამოიცანი შტატის აბრევიატურა</div>
                </div>
                <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
              </button>
              
              <button
                onClick={() => initializeQuiz('abbrToName')}
                className="w-full flex items-center justify-between p-5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl font-medium transition-all group active:scale-95"
              >
                <div className="text-left">
                  <div className="font-bold text-lg mb-1">აბრევიატურა ➔ სახელი</div>
                  <div className="text-sm text-emerald-600/70">გამოიცანი შტატის სახელი</div>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">იტვირთება...</div>;
  }

  const currentQuestion = questions[currentIndex];
  // Check if current question has been answered
  const selectedAnswer = userAnswers[currentIndex] || null;

  // Calculate score based on userAnswers
  const score = questions.reduce((acc, q, idx) => {
    return acc + (userAnswers[idx] === q.correctAnswer ? 1 : 0);
  }, 0);

  // Number of answered questions
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
          <button 
            onClick={handleReturnHome}
            className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-2 pr-4 font-medium"
            title="მთავარი გვერდი"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">მთავარი</span>
          </button>
          <div className="text-right">
            <h1 className="text-lg font-bold text-slate-900">
              {quizMode === 'nameToAbbr' ? 'სახელი ➔ აბრ.' : 'აბრ. ➔ სახელი'}
            </h1>
          </div>
          <button 
            onClick={() => initializeQuiz(quizMode!)}
            className="p-3 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all group"
            title="ქვიზის დარესტარტება"
          >
            <RotateCcw className="w-5 h-5 group-active:-rotate-90 transition-transform" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Progress bar */}
              <div className="h-2 bg-slate-100 w-full relative">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-indigo-500"
                  initial={{ width: `${(answeredCount / QUESTION_COUNT) * 100}%` }}
                  animate={{ width: `${(answeredCount / QUESTION_COUNT) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="absolute left-0 top-0 h-full bg-indigo-500/30"
                  initial={{ width: `${(currentIndex / QUESTION_COUNT) * 100}%` }}
                  animate={{ width: `${((currentIndex + 1) / QUESTION_COUNT) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="p-8">
                <div className="flex justify-between items-center mb-6 text-sm font-medium text-slate-400">
                  <span>კითხვა {currentIndex + 1} / {QUESTION_COUNT}</span>
                  <span>პასუხები: {answeredCount}</span>
                </div>

                <h2 className="text-xl font-medium mb-8 text-center leading-relaxed">
                  {quizMode === 'nameToAbbr' ? (
                    <>რომელია <span className="font-bold text-indigo-600">{currentQuestion.state.nameGe} / {currentQuestion.state.nameEn}</span><br/> შტატის აბრევიატურა?</>
                  ) : (
                    <>რომელი შტატის აბრევიატურაა <span className="font-bold text-indigo-600 text-2xl">{currentQuestion.state.abbr}</span>?</>
                  )}
                </h2>

                <div className={`grid gap-4 ${quizMode === 'abbrToName' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {currentQuestion.options.map((option) => {
                    let buttonClass = "bg-slate-50 border-2 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200 cursor-pointer active:scale-95";
                    let icon = null;

                    if (selectedAnswer !== null) {
                      // Question has been answered, colorize options
                      buttonClass = "bg-slate-50 border-2 border-slate-100 text-slate-400 opacity-50 cursor-default";
                      
                      if (option === currentQuestion.correctAnswer) {
                        buttonClass = "bg-green-50 border-2 border-green-500 text-green-700 cursor-default";
                        icon = <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />;
                      } else if (option === selectedAnswer) {
                        buttonClass = "bg-red-50 border-2 border-red-500 text-red-700 cursor-default";
                        icon = <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
                      }
                    }

                    return (
                      <button
                        key={option}
                        disabled={selectedAnswer !== null}
                        onClick={() => handleAnswerClick(option)}
                        className={`relative rounded-xl p-4 text-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${buttonClass}`}
                      >
                        <span className={icon ? "mr-1" : ""}>{option}</span>
                        {icon && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            {icon}
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Back and Next Controls */}
                <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 font-medium disabled:opacity-30 disabled:hover:bg-transparent hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>უკან</span>
                  </button>

                  {currentIndex < QUESTION_COUNT - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.min(QUESTION_COUNT - 1, prev + 1))}
                      className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-1
                        ${selectedAnswer !== null 
                          ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100' 
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                    >
                      <span>შემდეგი</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsFinished(true)}
                      disabled={answeredCount !== QUESTION_COUNT}
                      className="px-5 py-2 bg-green-500 text-white font-medium disabled:opacity-40 disabled:hover:bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      დასრულება
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-2">ქვიზი დასრულდა!</h2>
              <p className="text-slate-500 mb-8">თქვენი შედეგი</p>
              
              <div className="text-5xl font-black text-indigo-600 mb-8">
                {score} <span className="text-2xl text-slate-400 font-medium">/ {QUESTION_COUNT}</span>
              </div>
              
              <div className="space-y-3 mt-8">
                <button
                  onClick={() => initializeQuiz(quizMode!)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>თავიდან დაწყება</span>
                </button>
                <button
                  onClick={handleReturnHome}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                  <Home className="w-5 h-5" />
                  <span>მთავარზე დაბრუნება</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


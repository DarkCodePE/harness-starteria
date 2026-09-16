import React from 'react';
import type { InitialReviewStrategicQuestion } from '../domain/types';

export function InitialReviewQuestionsCard({
  questions,
  onChange,
}: {
  questions: InitialReviewStrategicQuestion[];
  onChange: (questions: InitialReviewStrategicQuestion[]) => void;
}) {
  const updateQuestion = (id: string, answer: string, status: InitialReviewStrategicQuestion['status']) => {
    onChange(questions.map(question => question.id === id ? { ...question, answer, status } : question));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base text-slate-900" style={{ fontWeight: 800 }}>Preguntas estrategicas minimas</h2>
      <p className="mt-1 text-sm text-slate-500">Puedes responder ahora o llevarlas como pendientes a Step 0.</p>
      <div className="mt-4 space-y-4">
        {questions.slice(0, 3).map(question => (
          <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-900" style={{ fontWeight: 700 }}>{question.question}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {question.options.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateQuestion(question.id, option, 'answered')}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    question.answer === option && question.status === 'answered'
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  {option}
                </button>
              ))}
              {question.allowsUnknown && (
                <button
                  type="button"
                  onClick={() => updateQuestion(question.id, 'No lo sé aún', 'unknown')}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    question.status === 'unknown'
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200'
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  No lo sé aún
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

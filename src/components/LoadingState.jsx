import { useEffect, useState } from 'react';

const LOADING_STEPS = [
  { text: 'Reading price action...', delay: 0 },
  { text: 'Mapping market structure...', delay: 2000 },
  { text: 'Detecting key levels & order blocks...', delay: 4500 },
  { text: 'Evaluating confluence factors...', delay: 7500 },
  { text: 'Applying 5-filter signal validation...', delay: 10000 },
  { text: 'Generating signal output...', delay: 12500 },
];

export default function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    const timers = [];

    LOADING_STEPS.forEach((step, i) => {
      if (i === 0) {
        setCurrentStep(0);
        return;
      }
      const t = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, i - 1]);
        setCurrentStep(i);
      }, step.delay);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-header">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-core"></div>
        </div>
        <span className="loading-title">ANALYZING CHART</span>
      </div>

      <div className="loading-steps">
        {LOADING_STEPS.map((step, i) => {
          const isCompleted = completedSteps.includes(i);
          const isCurrent = currentStep === i;
          const isPending = !isCompleted && !isCurrent;

          return (
            <div
              key={i}
              className={`loading-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''} ${isPending ? 'pending' : ''}`}
            >
              <div className="step-indicator">
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : isCurrent ? (
                  <div className="step-dot-active"></div>
                ) : (
                  <div className="step-dot-pending"></div>
                )}
              </div>
              <span className="step-text">{step.text}</span>
            </div>
          );
        })}
      </div>

      <div className="loading-bar-wrapper">
        <div className="loading-bar">
          <div
            className="loading-bar-fill"
            style={{
              width: `${Math.min(100, ((currentStep + 1) / LOADING_STEPS.length) * 100)}%`,
            }}
          ></div>
        </div>
        <span className="loading-pct">
          {Math.min(100, Math.round(((currentStep + 1) / LOADING_STEPS.length) * 100))}%
        </span>
      </div>

      <p className="loading-disclaimer">
        APEX applies institutional-grade filters — this may take up to 15 seconds
      </p>
    </div>
  );
}

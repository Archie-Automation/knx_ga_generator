import { ReactNode } from 'react';

interface StepperProps {
  steps: { id: string; label: string; completed?: boolean; hasInfo?: boolean; exportExports?: boolean[]; disabled?: boolean }[];
  activeId: string;
  onSelect?: (id: string) => void;
}

export const Stepper = ({ steps, activeId, onSelect }: StepperProps) => (
  <div className="stepper">
    {steps.map((step, idx) => {
      const active = step.id === activeId;
      const disabled = step.disabled;
      return (
        <button
          type="button"
          key={step.id}
          className={`step ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && onSelect?.(step.id)}
          disabled={disabled}
        >
          <span className="pill">{idx + 1}</span>
          <span>{step.label}</span>
          {/* Export indicators: show 2 dashes/checkmarks for export step - always show when exportExports is defined */}
          {step.exportExports !== undefined && step.exportExports.length === 2 && (
            <span style={{ marginLeft: '8px', display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
              {step.exportExports.map((exported, exportIdx) => (
                <span
                  key={exportIdx}
                  style={{
                    color: exported ? 'var(--color-success)' : 'var(--color-text)',
                    fontSize: '16px',
                    fontWeight: exported ? 'bold' : 'normal',
                    lineHeight: '1',
                    display: 'inline-block',
                    minWidth: '18px',
                    textAlign: 'center',
                    opacity: exported ? 1 : 0.7
                  }}
                >
                  {exported ? '✓' : '–'}
                </span>
              ))}
            </span>
          )}
          {/* For non-export steps: show info icon, checkmark, or dash */}
          {step.exportExports === undefined && (
            step.hasInfo ? (
              <span style={{ marginLeft: '8px', color: 'var(--color-primary)', fontSize: '14px' }}>ℹ</span>
            ) : step.completed ? (
              <span style={{ marginLeft: '8px', color: 'var(--color-success)', fontSize: '14px' }}>✓</span>
            ) : (
              // Show dash for steps 2, 3, 4 when not completed (skip step 1 template which shows checkmark by default)
              // Step 4 (overview) shows dash when hasInfo is false/undefined
              idx > 0 && idx < 5 && (
                <span style={{ marginLeft: '8px', color: 'var(--color-text)', fontSize: '14px', opacity: 0.7 }}>–</span>
              )
            )
          )}
        </button>
      );
    })}
  </div>
);



































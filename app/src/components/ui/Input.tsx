import { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '../../utils/helpers';
import { ChevronDown } from 'lucide-react';

export interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function FieldShell({ label, hint, error, children, className, id }: FieldShellProps) {
  const hintId = id ? `${id}-hint` : undefined;
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="block text-body-sm font-semibold text-ink mb-1.5 font-display">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p id={hintId} className="mt-1.5 text-caption text-text-muted">{hint}</p>}
      {error && (
        <p id={id ? `${id}-error` : undefined} className="mt-1.5 text-body-sm text-danger font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const controlBase =
  'w-full h-10 px-3.5 bg-bg-elevated border-[1.5px] border-ink rounded-sm text-text placeholder:text-text-muted/70 ' +
  'transition-shadow duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'disabled:bg-bg-hover disabled:text-text-muted disabled:cursor-not-allowed';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...props },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} id={id ?? (typeof props.name === 'string' ? props.name : undefined)}>
      <input
        ref={ref}
        id={id ?? (typeof props.name === 'string' ? props.name : undefined)}
        className={cn(controlBase, error && 'border-danger ring-1 ring-danger', className)}
        {...props}
      />
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, rows = 4, id, ...props },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} id={id ?? (typeof props.name === 'string' ? props.name : undefined)}>
      <textarea
        ref={ref}
        id={id ?? (typeof props.name === 'string' ? props.name : undefined)}
        rows={rows}
        className={cn(controlBase, 'h-auto py-2.5 min-h-24 resize-y leading-relaxed', error && 'border-danger ring-1 ring-danger', className)}
        {...props}
      />
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, placeholder, options, className, id, children, ...props },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} id={id ?? (typeof props.name === 'string' ? props.name : undefined)}>
      <div className="relative">
        <select
          ref={ref}
          id={id ?? (typeof props.name === 'string' ? props.name : undefined)}
          className={cn(controlBase, 'appearance-none pr-9 cursor-pointer', error && 'border-danger ring-1 ring-danger', className)}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
      </div>
    </FieldShell>
  );
});

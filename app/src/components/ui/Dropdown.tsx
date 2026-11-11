import { type ReactNode, useState, useRef, useEffect, useCallback, cloneElement } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/helpers';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string, item: DropdownItem) => void;
  align?: 'left' | 'right';
  disabled?: boolean;
}

export function Dropdown({ trigger, items, onSelect, align = 'right', disabled = false }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled && !item.divider) {
      onSelect(item.value, item);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleTriggerKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="relative inline-block" onKeyDown={handleTriggerKeyDown}>
        {typeof trigger === 'object' && trigger !== null && 'props' in trigger
          ? cloneElement(trigger as ReactElement, {
              ref: triggerRef,
              'aria-haspopup': 'true',
              'aria-expanded': false,
              disabled,
              onKeyDown: handleTriggerKeyDown,
              onClick: disabled ? undefined : () => setIsOpen(true),
            } as never)
          : (
            <button
              ref={triggerRef}
              type="button"
              className="btn-secondary"
              disabled={disabled}
              aria-haspopup="true"
              aria-expanded={false}
              onClick={() => !disabled && setIsOpen(true)}
              onKeyDown={handleTriggerKeyDown}
            >
              {trigger}
            </button>
          )}
      </div>
    );
  }

  const portalContent = (
    <div
      ref={dropdownRef}
      className="fixed z-50 min-w-[180px] bg-bg-elevated border-[1.5px] border-ink rounded-lg card-signal animate-fade-in scrollbar-thin max-h-60 overflow-y-auto"
      role="menu"
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <hr key={`divider-${index}`} className="my-1 border-border" role="separator" />;
        }
        return (
          <button
            key={item.value}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => handleItemClick(item)}
            className={cn(
              'w-full px-3 py-2 text-left text-body transition-colors',
              'focus-visible:ring-2 focus-visible:ring-accent focus:bg-bg-hover',
              item.danger ? 'text-danger hover:bg-danger-soft' : 'text-text hover:bg-bg-hover',
              item.disabled && 'opacity-50 pointer-events-none'
            )}
            tabIndex={-1}
          >
            <div className="flex items-center gap-2">
              {item.icon && <span className="w-4 h-4 flex-shrink-0" aria-hidden="true">{item.icon}</span>}
              <span className="flex-1 truncate">{item.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative inline-block" onKeyDown={handleTriggerKeyDown}>
      {typeof trigger === 'object' && trigger !== null && 'props' in trigger
        ? cloneElement(trigger as ReactElement, {
            ref: triggerRef,
            'aria-haspopup': 'true',
            'aria-expanded': true,
            disabled,
            onKeyDown: handleTriggerKeyDown,
            onClick: disabled ? undefined : () => setIsOpen(false),
          } as never)
        : (
          <button
            ref={triggerRef}
            type="button"
            className="btn-secondary"
            disabled={disabled}
            aria-haspopup="true"
            aria-expanded={true}
            onClick={() => !disabled && setIsOpen(false)}
            onKeyDown={handleTriggerKeyDown}
          >
            {trigger}
          </button>
        )}
      {typeof window !== 'undefined' && createPortal(portalContent, document.body)}
    </div>
  );
}

export interface SelectDropdownProps {
  value: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function SelectDropdown({
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative inline-block w-full" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full h-10 px-3 pr-10 bg-bg-elevated border-[1.5px] border-ink rounded-sm text-text appearance-none cursor-pointer',
          'disabled:bg-bg-hover disabled:text-text-muted disabled:cursor-not-allowed',
          className
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <span className={cn('truncate block', !selectedOption && !value && 'text-text-muted')}>
          {selectedOption?.label || placeholder || 'Select…'}
        </span>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none transition-transform"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-bg-elevated border-[1.5px] border-ink rounded-md card-signal card-signal-hover animate-fade-in scrollbar-thin max-h-60 overflow-y-auto"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-body transition-colors',
                'focus-visible:ring-2 focus-visible:ring-accent focus:bg-bg-hover',
                option.value === value ? 'bg-accent text-loud-ink' : 'text-text hover:bg-bg-hover',
                option.disabled && 'opacity-50 pointer-events-none'
              )}
              tabIndex={-1}
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate">{option.label}</span>
                {option.value === value && <Check className="w-4 h-4 flex-shrink-0 text-accent" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

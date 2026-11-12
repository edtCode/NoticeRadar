import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { AlertCircle, Check, Loader2, MapPin, PlusCircle, Search } from 'lucide-react';
import { FieldShell, Input, Select } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useDebouncedValue } from '../../hooks/useDebounce';
import { useInstitutionSearch, useRequestInstitution } from '../../hooks/useAuthService';
import { useAddToast } from '../../stores/uiStore';
import { DEBOUNCE_DELAY } from '../../constants';
import { cn } from '../../utils/helpers';
import type { InstitutionSearchResult } from '../../types';

const INSTITUTION_TYPES = [
  { value: 'COLLEGE', label: 'College' },
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'INSTITUTE', label: 'Institute' },
  { value: 'OTHER', label: 'Other' },
];

const locationLabel = (institution: Pick<InstitutionSearchResult, 'city' | 'state'>) =>
  [institution.city, institution.state].filter(Boolean).join(', ');

export interface InstitutionAutocompleteProps {
  /** Selected institution UUID. Empty string means nothing is selected. */
  value: string;
  /** Official name of the currently selected institution, used to fill the input. */
  initialName?: string;
  onChange: (institution: InstitutionSearchResult | null) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** When true, offers a "Can't find your institution?" request form (requires a session). */
  allowRequest?: boolean;
  id?: string;
}

export function InstitutionAutocomplete({
  value,
  initialName,
  onChange,
  label = 'Institution',
  hint,
  placeholder = 'Start typing your college or university',
  error,
  disabled = false,
  allowRequest = false,
  id,
}: InstitutionAutocompleteProps) {
  const generatedId = useId();
  const inputId = id ?? `institution-${generatedId}`;
  const listboxId = `${inputId}-listbox`;

  const [input, setInput] = useState(initialName ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ name: '', city: '', state: '', institutionType: 'COLLEGE' });
  const [requestError, setRequestError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // Typing clears the selected UUID but must not wipe the text the user just typed.
  const typingRef = useRef(false);
  const selectedNameRef = useRef(initialName ?? '');

  const addToast = useAddToast();
  const requestMutation = useRequestInstitution();

  const debouncedQuery = useDebouncedValue(input.trim(), DEBOUNCE_DELAY);
  const searchQuery = useInstitutionSearch(debouncedQuery, open && !disabled);
  const results = searchQuery.data ?? [];

  useEffect(() => {
    if (typingRef.current) {
      typingRef.current = false;
      return;
    }

    if (!value) {
      selectedNameRef.current = '';
      setInput('');
      return;
    }

    if (initialName && initialName !== selectedNameRef.current) {
      selectedNameRef.current = initialName;
      setInput(initialName);
    }
  }, [value, initialName]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery, searchQuery.data]);

  useEffect(() => {
    if (activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, close]);

  const selectInstitution = (institution: InstitutionSearchResult) => {
    typingRef.current = false;
    selectedNameRef.current = institution.name;
    setInput(institution.name);
    onChange(institution);
    close();
  };

  const clearSelection = () => {
    typingRef.current = false;
    selectedNameRef.current = '';
    setInput('');
    onChange(null);
    close();
  };

  const handleInputChange = (next: string) => {
    typingRef.current = true;
    setInput(next);
    setOpen(true);

    if (value) {
      // Free text no longer matches a catalogue record — drop the stale UUID.
      onChange(null);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (results.length === 0 ? -1 : Math.min(index + 1, results.length - 1)));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
      return;
    }

    if (event.key === 'Enter') {
      if (open && activeIndex >= 0 && results[activeIndex]) {
        event.preventDefault();
        selectInstitution(results[activeIndex]);
      }
      return;
    }

    if (event.key === 'Escape') {
      close();
      return;
    }

    if (event.key === 'Tab') {
      close();
    }
  };

  const openRequestForm = () => {
    setRequestForm({
      name: input.trim(),
      city: '',
      state: '',
      institutionType: 'COLLEGE',
    });
    setRequestError(null);
    setRequestOpen(true);
  };

  const submitRequest = async () => {
    if (requestForm.name.trim().length < 2) {
      setRequestError('Enter the full institution name.');
      return;
    }

    try {
      await requestMutation.mutateAsync({
        name: requestForm.name.trim(),
        city: requestForm.city.trim() || undefined,
        state: requestForm.state.trim() || undefined,
        institutionType: requestForm.institutionType,
      });
      setRequestOpen(false);
      addToast({
        type: 'success',
        title: 'Request submitted',
        message: 'An admin will review this institution before it appears in search.',
      });
    } catch (requestFailure) {
      const message = requestFailure instanceof Error ? requestFailure.message : 'Please try again.';
      setRequestError(message);
    }
  };

  const selectedName = selectedNameRef.current;
  const showResults = open;
  const hasQuery = debouncedQuery.length >= 2;
  const isLoading = searchQuery.isFetching && hasQuery;
  const isError = searchQuery.isError && hasQuery;
  const isEmpty = hasQuery && !isLoading && !isError && results.length === 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <FieldShell label={label} hint={hint} error={error} id={inputId}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
          <input
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={showResults}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined}
            aria-invalid={error ? true : undefined}
            autoComplete="off"
            disabled={disabled}
            value={input}
            placeholder={placeholder}
            onChange={(event) => handleInputChange(event.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full h-10 pl-9 pr-10 bg-bg-elevated border-[1.5px] border-ink rounded-sm text-text placeholder:text-text-muted/70',
              'transition-shadow duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              'disabled:bg-bg-hover disabled:text-text-muted disabled:cursor-not-allowed',
              error && 'border-danger ring-1 ring-danger'
            )}
          />
          {isLoading ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-text-muted" aria-hidden="true" />
          ) : value ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-success" aria-label="Institution selected">
              <Check className="w-4 h-4" aria-hidden="true" />
            </span>
          ) : null}
        </div>
      </FieldShell>

      {showResults && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Institution results"
          className="absolute z-50 w-full mt-1 bg-bg-elevated border-[1.5px] border-ink rounded-md card-signal animate-fade-in scrollbar-thin max-h-64 overflow-y-auto"
        >
          {!hasQuery ? (
            <p className="px-3 py-3 text-body-sm text-text-muted">Type at least 2 characters to search.</p>
          ) : isLoading ? (
            <p className="px-3 py-3 text-body-sm text-text-muted flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Searching institutions…
            </p>
          ) : isError ? (
            <div className="px-3 py-3 flex items-start gap-2" role="alert">
              <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-body-sm text-danger">Could not search institutions.</p>
                <button
                  type="button"
                  onClick={() => searchQuery.refetch()}
                  className="text-body-sm text-accent font-medium hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : isEmpty ? (
            <p className="px-3 py-3 text-body-sm text-text-muted">No institutions match “{debouncedQuery}”.</p>
          ) : (
            results.map((institution, index) => {
              const location = locationLabel(institution);
              return (
                <button
                  key={institution.id}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  id={`${inputId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={institution.id === value}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectInstitution(institution)}
                  className={cn(
                    'w-full px-3 py-2.5 text-left transition-colors border-b border-border/60 last:border-b-0',
                    index === activeIndex ? 'bg-bg-hover' : 'bg-transparent'
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-body font-medium text-text truncate">{institution.name}</span>
                    {institution.id === value && <Check className="w-4 h-4 flex-shrink-0 text-accent" aria-hidden="true" />}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-text-muted">
                    {location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" aria-hidden="true" /> {location}
                      </span>
                    ) : (
                      <span>Location not listed</span>
                    )}
                    {institution.institution_type && <span>· {institution.institution_type}</span>}
                  </span>
                </button>
              );
            })
          )}

          {allowRequest && (
            <button
              type="button"
              onClick={openRequestForm}
              className="w-full px-3 py-2.5 text-left text-body-sm font-medium text-accent hover:bg-bg-hover transition-colors border-t border-border inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" /> Can&apos;t find your institution?
            </button>
          )}
        </div>
      )}

      {value && selectedName && (
        <button
          type="button"
          onClick={clearSelection}
          className="mt-1 text-caption text-text-muted hover:text-text underline"
        >
          Choose a different institution
        </button>
      )}

      {allowRequest && (
        <Modal isOpen={requestOpen} onClose={() => setRequestOpen(false)} title="Request an institution" size="md">
          <div className="space-y-4">
            <p className="text-body-sm text-text-muted">
              Tell us which institution is missing. An admin verifies it before it is added — it will not appear in
              search automatically.
            </p>

            <Input
              label="Institution name"
              value={requestForm.name}
              onChange={(event) => setRequestForm((form) => ({ ...form, name: event.target.value }))}
              placeholder="e.g. National Institute of Technology"
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="City"
                value={requestForm.city}
                onChange={(event) => setRequestForm((form) => ({ ...form, city: event.target.value }))}
                placeholder="e.g. Trichy"
              />
              <Input
                label="State"
                value={requestForm.state}
                onChange={(event) => setRequestForm((form) => ({ ...form, state: event.target.value }))}
                placeholder="e.g. Tamil Nadu"
              />
            </div>

            <Select
              label="Institution type"
              value={requestForm.institutionType}
              onChange={(event) => setRequestForm((form) => ({ ...form, institutionType: event.target.value }))}
              options={INSTITUTION_TYPES}
            />

            {requestError && (
              <p className="text-body-sm text-danger" role="alert">
                {requestError}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" className="btn-ghost h-10 px-4" onClick={() => setRequestOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary h-10 px-4 disabled:opacity-50 disabled:pointer-events-none"
                onClick={submitRequest}
                disabled={requestMutation.isPending}
              >
                {requestMutation.isPending ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

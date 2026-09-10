import { useState } from 'react';
import { trackAuditStarted } from '../lib/geo_track';
import { toAuditableUrl } from '../lib/urlInput';

interface AuditFormProps {
  /** "console" is the homepage CI-run world; default keeps the incumbent look. */
  variant?: 'default' | 'console';
}

export default function AuditForm({ variant = 'default' }: AuditFormProps) {
  const [url, setUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = url.trim();
    if (!trimmed) {
      setErrorMsg('Enter a URL to audit.');
      return;
    }

    // toAuditableUrl supplies the scheme, so a bare "example.com" — what the
    // placeholder shows — reaches the report page as a full URL.
    const normalized = toAuditableUrl(trimmed);
    if (!normalized) {
      setErrorMsg('Enter a valid website address, for example example.com.');
      return;
    }

    trackAuditStarted();
    setIsLoading(true);
    window.location.href = `/report/audit?url=${encodeURIComponent(normalized)}`;
  };

  if (variant === 'console') {
    return (
      <div className="space-y-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <label htmlFor="audit-url" className="sr-only">
            Website URL to audit
          </label>
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[4px] border border-ink/25 bg-white pl-4 transition-shadow focus-within:border-pass-deep focus-within:ring-2 focus-within:ring-pass/30">
            <span aria-hidden="true" className="hidden font-mono text-[13px] font-medium text-ink-mute md:inline whitespace-nowrap select-none">
              geo audit --url
            </span>
            <input
              id="audit-url"
              type="text"
              inputMode="url"
              required
              placeholder="example.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              disabled={isLoading}
              className="w-full min-w-0 flex-1 bg-transparent py-3.5 pr-4 font-mono text-[15px] text-ink caret-pass-deep placeholder:text-ink-mute/70 focus:outline-none disabled:opacity-60"
              aria-describedby={errorMsg ? 'audit-error' : undefined}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex shrink-0 items-center justify-center gap-2 rounded-[4px] bg-pass-deep px-7 py-3.5 font-mono text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-pass disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running…
              </>
            ) : (
              <>
                Run audit
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                  <path d="M3 1.5 9.5 6 3 10.5V1.5Z" />
                </svg>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div
            id="audit-error"
            role="alert"
            className="flex items-start gap-3 rounded-[4px] border border-fail/30 bg-fail-wash px-4 py-3 text-sm text-fail"
          >
            <span aria-hidden="true" className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] mt-0.5">
              err
            </span>
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="audit-url" className="sr-only">
          Website URL to audit
        </label>
        <input
          id="audit-url"
          type="text"
          inputMode="url"
          required
          placeholder="https://example.com"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (errorMsg) setErrorMsg('');
          }}
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-2xl border border-border bg-bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-teal focus:border-transparent transition-shadow disabled:opacity-60"
          aria-describedby={errorMsg ? 'audit-error' : undefined}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 rounded-2xl bg-accent-teal text-white font-medium text-sm hover:bg-accent-teal-dark transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Running…
            </>
          ) : (
            'Run Audit'
          )}
        </button>
      </form>

      {errorMsg && (
        <div
          id="audit-error"
          role="alert"
          className="p-4 rounded-2xl border border-accent-danger/20 bg-accent-danger/5 text-accent-danger text-sm"
        >
          {errorMsg}
        </div>
      )}
    </div>
  );
}

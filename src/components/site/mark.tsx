export function Mark({ className }: { className?: string }) {
  return (
    <svg
      className={className ? `sk-mark ${className}` : "sk-mark"}
      viewBox="0 0 26 30"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M13 1.6 24.2 5.7v9.6c0 6.6-4.8 11.5-11.2 13.1C6.6 26.8 1.8 21.9 1.8 15.3V5.7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M13 8.4c2.9 3.2 4.5 5.4 4.5 7.7a4.5 4.5 0 0 1-9 0c0-2.3 1.6-4.5 4.5-7.7z"
        fill="currentColor"
      />
    </svg>
  );
}

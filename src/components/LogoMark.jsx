// Minimal monoline water-drop mark. The outline uses currentColor so it adapts to
// context (white on the dark hero navbar, teal/ink on light surfaces); the dot is
// the brand green. Set the color via the parent's text color or an inline style.
export default function LogoMark({ className = '', ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className} {...props}>
      <path
        d="M12 2.8C12 2.8 5.8 9.4 5.8 14.6a6.2 6.2 0 1 0 12.4 0C18.2 9.4 12 2.8 12 2.8Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14.8" r="2.1" fill="#00A878" />
    </svg>
  );
}

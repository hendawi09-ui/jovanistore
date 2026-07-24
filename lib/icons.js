export const icons = {
  shirt: <path d="M8 4 4 8l3 3 1-1v10h8V10l1 1 3-3-4-4-2 2h-4L8 4z" />,
  dress: (
    <>
      <path d="M9 3h6l1 4-2 1 3 12H9L12 8l-2-1 1-4z" />
      <path d="M9 7l-4 3M15 7l4 3" />
    </>
  ),
  jacket: <path d="M9 3 6 5 3 9l3 2v10h4v-6h4v6h4V11l3-2-3-4-3-2-2 2h-2L9 3z" />,
  kid: (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M8 8h8l1 5-3 1v6H10v-6l-3-1 1-5z" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l1 12H5L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  belt: (
    <>
      <rect x="3" y="10" width="18" height="4" rx="1" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  scarf: <path d="M4 6c4 3 12 3 16 0M4 6c1 6 1 12 3 14M20 6c-1 6-1 12-3 14" />,
  pants: <path d="M7 3h10l1 8-2 10h-3l-1-8-1 8H8L6 11l1-8z" />,
};

export function IconSvg({ name, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="1.8"
    >
      {icons[name] || icons.shirt}
    </svg>
  );
}

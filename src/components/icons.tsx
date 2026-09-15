import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function TelegramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.94 4.6 18.9 19.2c-.23 1.02-.84 1.27-1.7.79l-4.7-3.47-2.27 2.19c-.25.25-.46.46-.95.46l.34-4.8 8.73-7.9c.38-.34-.08-.53-.59-.19L6.98 13.1 2.3 11.63c-1.02-.32-1.04-1.02.21-1.51l18.3-7.06c.85-.31 1.59.2 1.13 1.54z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3.5" />
      <path d="M22 20v-2a4 4 0 0 0-3-3.87M16.5 3.6a4 4 0 0 1 0 6.8" />
    </svg>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M20 12v9H4v-9M2 8h20v4H2zM12 21V8M12 8H7.5a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8ZM12 8h4.5a2.5 2.5 0 1 0 0-5C13 3 12 8 12 8Z" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M2 3h3l2.7 12h10.1l2.2-8H6" />
      <circle cx="9" cy="19" r="1.6" />
      <circle cx="18" cy="19" r="1.6" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="m12 2 3 6.6 7 .9-5.2 4.8 1.4 7L12 17.9 5.8 21.3l1.4-7L2 9.5l7-.9z" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden="true" {...props}>
      <path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
      <path d="M18 15.5 18.8 17.5 20.8 18.3 18.8 19.1 18 21.1 17.2 19.1 15.2 18.3 17.2 17.5z" />
    </svg>
  );
}

/** Mapa nome -> icone, usado pelas categorias cadastradas no admin. */
const CATEGORY_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  smartphone: (p) => (
    <svg {...base} aria-hidden="true" {...p}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  ),
  lightbulb: (p) => (
    <svg {...base} aria-hidden="true" {...p}>
      <path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 1.9V15h5.2v-.2c0-.7.3-1.4.9-1.9A6 6 0 0 0 12 2Z" />
    </svg>
  ),
  sparkles: SparklesIcon,
  shirt: (p) => (
    <svg {...base} aria-hidden="true" {...p}>
      <path d="M15 3l5 3-2 4-2-1v12H8V9L6 10 4 6l5-3a3 3 0 0 0 6 0Z" />
    </svg>
  ),
  "chef-hat": (p) => (
    <svg {...base} aria-hidden="true" {...p}>
      <path d="M6 18h12v3H6zM6 18V13a4.5 4.5 0 1 1 1.8-8.6 4.5 4.5 0 0 1 8.4 0A4.5 4.5 0 1 1 18 13v5" />
    </svg>
  ),
  dumbbell: (p) => (
    <svg {...base} aria-hidden="true" {...p}>
      <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" />
    </svg>
  ),
  gamepad: (p) => (
    <svg {...base} aria-hidden="true" {...p}>
      <path d="M7 12h4M9 10v4M15.5 11.5h.01M18 13.5h.01" />
      <rect x="2" y="7" width="20" height="11" rx="4" />
    </svg>
  ),
  sofa: (p) => (
    <svg {...base} aria-hidden="true" {...p}>
      <path d="M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M2 12h20v6H2zM6 18v2M18 18v2" />
    </svg>
  ),
};

export function CategoryIcon({
  name,
  ...props
}: Omit<IconProps, "name"> & { name?: string | null }) {
  const Icon = (name && CATEGORY_ICONS[name]) || TagIcon;
  return <Icon {...props} />;
}

import Link from "next/link";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  size?: "sm" | "md";
  /** Ouvre dans un nouvel onglet (liens externes). */
  external?: boolean;
  className?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 focus-visible:outline-2";

const variants = {
  primary:
    "bg-accent text-bg-deep hover:bg-accent-soft hover:shadow-glow active:scale-[0.98]",
  outline:
    "border border-line text-ink hover:border-accent/60 hover:text-accent-soft active:scale-[0.98]",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
};

export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  external = false,
  className = "",
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

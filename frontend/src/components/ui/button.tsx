import * as React from "react";

type ButtonVariant = "default" | "outline";
type ButtonSize = "default" | "sm";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[linear-gradient(135deg,#048DFE_0%,#036DEB_52%,#0054C5_100%)] text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(4,109,235,0.18)] hover:opacity-95",
  outline:
    "border border-line bg-white text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-accentSoft",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "min-h-11 rounded-xl ps-5 pe-5 py-3 text-sm",
  sm: "min-h-10 rounded-xl ps-4 pe-4 py-2.5 text-sm",
};

export function Button({
  asChild = false,
  className,
  children,
  size = "default",
  type = "button",
  variant = "default",
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#048DFE]/35 disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (asChild && React.isValidElement(children)) {
    const child = React.Children.only(children) as React.ReactElement<{
      className?: string;
    }>;

    return React.cloneElement(child, {
      ...props,
      className: cn(classes, child.props.className),
    });
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}

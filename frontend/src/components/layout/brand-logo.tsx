import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  src?: string | null;
  alt?: string;
  fallbackText?: string;
};

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function BrandLogo({
  href,
  className,
  imageClassName,
  priority = false,
  src,
  alt = "Hostinvo",
  fallbackText,
}: BrandLogoProps) {
  const imageSrc = src ?? "/hostinvo-logo.png";

  const logo = (
    imageSrc.startsWith("/") ? (
      <Image
        src={imageSrc}
        alt={alt}
        width={1340}
        height={467}
        priority={priority}
        className={joinClasses("h-auto w-full", imageClassName)}
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt={alt}
        className={joinClasses("h-auto w-full", imageClassName)}
      />
    )
  );

  const content = fallbackText ? (
    <div className="flex items-center gap-3">
      <div className="min-w-0">{logo}</div>
      <span className="truncate text-sm font-semibold text-current">{fallbackText}</span>
    </div>
  ) : (
    logo
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={className} aria-label={alt}>
      {content}
    </Link>
  );
}

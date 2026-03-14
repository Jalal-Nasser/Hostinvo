import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function BrandLogo({
  href,
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  const logo = (
    <Image
      src="/hostinvo-logo.png"
      alt="Hostinvo"
      width={1340}
      height={467}
      priority={priority}
      className={joinClasses("h-auto w-full", imageClassName)}
    />
  );

  if (!href) {
    return <div className={className}>{logo}</div>;
  }

  return (
    <Link href={href} className={className} aria-label="Hostinvo">
      {logo}
    </Link>
  );
}

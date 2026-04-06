import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailView } from "@/components/auth/verify-email-view";

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { status?: string; email?: string };
}) {
  setRequestLocale(params.locale);
  const t = await getTranslations("Auth");

  return (
    <AuthShell
      currentPath="/auth/verify-email"
      title={t("verifyEmailTitle")}
      description={t("verifyEmailDescription")}
      locale={params.locale}
    >
      <VerifyEmailView
        status={searchParams.status ?? null}
        email={searchParams.email ?? null}
      />
    </AuthShell>
  );
}

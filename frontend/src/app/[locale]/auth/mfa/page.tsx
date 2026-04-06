import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/components/auth/auth-shell";
import { MfaChallengeForm } from "@/components/auth/mfa-challenge-form";

export default async function MfaPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Auth");

  return (
    <AuthShell
      currentPath="/auth/mfa"
      description={t("mfaSetupDescription")}
      locale={params.locale}
      title={t("mfaSetupTitle")}
    >
      <MfaChallengeForm />
    </AuthShell>
  );
}

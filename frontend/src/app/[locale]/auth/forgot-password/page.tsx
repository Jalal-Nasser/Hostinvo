import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Auth");

  return (
    <AuthShell
      description={t("forgotPasswordDescription")}
      locale={params.locale}
      title={t("forgotPasswordTitle")}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

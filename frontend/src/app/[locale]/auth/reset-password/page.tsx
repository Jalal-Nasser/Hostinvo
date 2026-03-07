import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: Readonly<{
  params: { locale: string };
  searchParams: { email?: string; token?: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Auth");

  return (
    <AuthShell
      description={t("resetPasswordDescription")}
      locale={params.locale}
      title={t("resetPasswordTitle")}
    >
      <ResetPasswordForm
        initialEmail={searchParams.email}
        token={searchParams.token}
      />
    </AuthShell>
  );
}

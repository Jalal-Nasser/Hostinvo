import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  params,
}: Readonly<{
  params: { locale: string };
}>) {
  setRequestLocale(params.locale);

  const t = await getTranslations("Auth");

  return (
    <AuthShell
      currentPath="/auth/login"
      description={t("loginDescription")}
      locale={params.locale}
      title={t("loginTitle")}
    >
      <LoginForm />
    </AuthShell>
  );
}

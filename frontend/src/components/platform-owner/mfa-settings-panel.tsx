"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import {
  fetchMfaStatus,
  beginMfaSetup,
  confirmMfaSetup,
  regenerateMfaRecoveryCodes,
  disableTotp,
  type MfaAuthenticatedStatus,
  beginPasskeyRegistration,
  fetchPasskeys,
  finishPasskeyRegistration,
  removePasskey,
  renamePasskey,
  type PasskeyListResponse,
} from "@/lib/auth-security";
import { serializeCredential, toCreationOptions } from "@/lib/webauthn";

// ---------------------------------------------------------------------------
// Style constants (mirrored from auth components)
// ---------------------------------------------------------------------------

const fieldClass =
  "w-full rounded-[1rem] border border-[#cfe0f4] bg-[#faf9f5] px-4 py-3.5 text-sm text-[#0a1628] shadow-[0_10px_26px_rgba(10,55,120,0.04)] outline-none transition placeholder:text-[#8ea6c3] focus:border-[#048dfe] focus:bg-[#faf9f5] focus:ring-4 focus:ring-[rgba(4,141,254,0.12)]";

const primaryBtn =
  "inline-flex items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#048DFE_0%,#036DEB_52%,#0054C5_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(4,109,235,0.2)] transition hover:translate-y-[-1px] hover:shadow-[0_14px_32px_rgba(4,109,235,0.3)] disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtn =
  "inline-flex items-center justify-center rounded-[1rem] border border-[#cfe0f4] bg-white px-5 py-3 text-sm font-semibold text-[#033466] transition hover:bg-[#f0f7ff] disabled:cursor-not-allowed disabled:opacity-60";

const dangerBtn =
  "inline-flex items-center justify-center rounded-[1rem] border border-[#ffd5d2] bg-[#fff4f3] px-5 py-3 text-sm font-semibold text-[#b7382d] transition hover:bg-[#ffe8e6] disabled:cursor-not-allowed disabled:opacity-60";

const cardClass =
  "rounded-2xl border border-[#e5eaf2] bg-white p-6 shadow-[0_2px_12px_rgba(10,55,120,0.04)]";

const codeGridClass =
  "grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-[1rem] border border-[#dbe7f5] bg-[#f8fbff] p-4 font-mono text-sm text-[#0a1628]";

const warningBanner =
  "rounded-[1rem] border border-[#fde4b3] bg-[#fff9ec] px-4 py-3 text-sm text-[#9a6500]";

const errorBanner =
  "rounded-[1rem] border border-[#ffd5d2] bg-[#fff4f3] px-4 py-3 text-sm text-[#b7382d]";

// ---------------------------------------------------------------------------
// View-state discriminated union
// ---------------------------------------------------------------------------

type ViewState =
  | { kind: "loading" }
  | { kind: "unenrolled" }
  | { kind: "setup_qr"; secret: string; otpAuthUrl: string }
  | { kind: "setup_codes"; codes: string[] }
  | { kind: "enrolled"; mfa: MfaAuthenticatedStatus }
  | { kind: "regen_confirm" }
  | { kind: "regen_codes"; codes: string[] }
  | { kind: "disable_confirm" }
  | { kind: "error"; message: string };

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div className="flex items-center justify-center py-14">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#cfe0f4] border-t-[#048dfe]" />
    </div>
  );
}

function BtnSpinner() {
  return (
    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.4)] border-t-white" />
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#048dfe] text-[11px] font-bold leading-none text-white">
      {n}
    </span>
  );
}

function ShieldOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7 text-[#8ea6c3]"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7 text-[#1f7a46]"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
      aria-hidden="true"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MfaSettingsPanel({ locale }: { locale: string }) {
  // locale is available for future locale-aware QR endpoint integration
  void locale;

  const [isPending, startTransition] = useTransition();
  const [isPasskeyPending, startPasskeyTransition] = useTransition();
  const [view, setView] = useState<ViewState>({ kind: "loading" });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyListResponse["items"]>([]);
  const [passkeyLabel, setPasskeyLabel] = useState("");
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(true);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [removePassword, setRemovePassword] = useState("");

  // -------------------------------------------------------------------------
  // Status fetch (shared by mount + cancel/done actions)
  // -------------------------------------------------------------------------

  function loadStatus() {
    setSubmitError(null);
    setView({ kind: "loading" });
    startTransition(async () => {
      const result = await fetchMfaStatus();

      if (result.data?.state === "authenticated") {
        const mfa = result.data.mfa;
        if (mfa.enrolled) {
          setView({ kind: "enrolled", mfa });
        } else {
          setView({ kind: "unenrolled" });
        }
        return;
      }

      setView({
        kind: "error",
        message: result.error ?? "Unable to load MFA status.",
      });
    });
  }

  function loadPasskeys() {
    setPasskeyError(null);
    setPasskeyLoading(true);
    startPasskeyTransition(async () => {
      const result = await fetchPasskeys();

      if (result.data?.items) {
        setPasskeys(result.data.items);
        setPasskeyLoading(false);
        return;
      }

      setPasskeyError(result.error ?? "Unable to load passkeys.");
      setPasskeys([]);
      setPasskeyLoading(false);
    });
  }

  useEffect(() => {
    setPasskeySupported(typeof window !== "undefined" && "PublicKeyCredential" in window);
  }, []);

  useEffect(() => {
    loadStatus();
    loadPasskeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Action handlers
  // -------------------------------------------------------------------------

  function handleBeginSetup() {
    setSubmitError(null);
    startTransition(async () => {
      const result = await beginMfaSetup();

      if (result.data?.setup) {
        setView({
          kind: "setup_qr",
          secret: result.data.setup.secret,
          otpAuthUrl: result.data.setup.otp_auth_url,
        });
        return;
      }

      setSubmitError(result.error ?? "Unable to start MFA setup.");
    });
  }

  function handleConfirmSetup(formData: FormData) {
    setSubmitError(null);
    const code = String(formData.get("code") ?? "").trim();

    startTransition(async () => {
      const result = await confirmMfaSetup({ code });

      if (result.data?.recovery_codes) {
        setView({ kind: "setup_codes", codes: result.data.recovery_codes });
        return;
      }

      setSubmitError(result.error ?? "Unable to confirm MFA setup.");
    });
  }

  function handleRegenSubmit(formData: FormData) {
    setSubmitError(null);
    const current_password = String(formData.get("current_password") ?? "");

    startTransition(async () => {
      const result = await regenerateMfaRecoveryCodes({ current_password });

      if (result.data?.recovery_codes) {
        setView({ kind: "regen_codes", codes: result.data.recovery_codes });
        return;
      }

      setSubmitError(result.error ?? "Unable to regenerate recovery codes.");
    });
  }

  function handleDisableSubmit(formData: FormData) {
    setSubmitError(null);
    const current_password = String(formData.get("current_password") ?? "");

    startTransition(async () => {
      const result = await disableTotp({ current_password });

      if (!result.error) {
        setView({ kind: "unenrolled" });
        return;
      }

      setSubmitError(result.error ?? "Unable to disable MFA.");
    });
  }

  function formatPasskeyDate(value?: string | null) {
    if (!value) return "Not used yet";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }

  function handleAddPasskey() {
    setPasskeyError(null);
    startPasskeyTransition(async () => {
      if (!passkeySupported) {
        setPasskeyError("Passkeys are not supported in this browser.");
        return;
      }

      const options = await beginPasskeyRegistration();
      if (!options.data) {
        setPasskeyError(options.error ?? "Unable to start passkey registration.");
        return;
      }

      try {
        const creationOptions = toCreationOptions(options.data);
        const credential = (await navigator.credentials.create({
          publicKey: creationOptions,
        })) as PublicKeyCredential | null;

        if (!credential) {
          setPasskeyError("Passkey prompt cancelled.");
          return;
        }

        const result = await finishPasskeyRegistration({
          credential: serializeCredential(credential),
          label: passkeyLabel.trim() || undefined,
        });

        if (!result.data) {
          setPasskeyError(result.error ?? "Unable to register passkey.");
          return;
        }

        setPasskeyLabel("");
        setEditingId(null);
        setRemovingId(null);
        loadPasskeys();
      } catch {
        setPasskeyError("Unable to register passkey.");
      }
    });
  }

  function handleRenameSubmit(id: number, formData: FormData) {
    setPasskeyError(null);
    const label = String(formData.get("label") ?? "").trim();

    if (!label) {
      setPasskeyError("Passkey name is required.");
      return;
    }

    startPasskeyTransition(async () => {
      const result = await renamePasskey({ id, label });

      if (result.error) {
        setPasskeyError(result.error ?? "Unable to rename passkey.");
        return;
      }

      setEditingId(null);
      setEditingLabel("");
      loadPasskeys();
    });
  }

  function handleRemoveSubmit(id: number, formData: FormData) {
    setPasskeyError(null);
    const current_password = String(formData.get("current_password") ?? "");

    startPasskeyTransition(async () => {
      const result = await removePasskey({ id, current_password });

      if (result.error) {
        setPasskeyError(result.error ?? "Unable to remove passkey.");
        return;
      }

      setRemovingId(null);
      setRemovePassword("");
      loadPasskeys();
    });
  }

  // -------------------------------------------------------------------------
  // Render: Loading
  // -------------------------------------------------------------------------

  const passkeyPanel = (
    <div className="glass-card p-6 md:p-8">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1.5">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#0a1628]">
              Passkeys
            </h2>
            <p className="text-sm leading-6 text-[#4e6782]">
              Register device-bound passkeys as an alternate MFA method for super admin access.
            </p>
          </div>
        </div>

        {!passkeySupported ? (
          <div className={warningBanner}>
            Passkeys are not supported in this browser or environment.
          </div>
        ) : null}

        <div className="grid gap-3">
          <label className="text-sm font-semibold text-[#123055]">
            Passkey label
          </label>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={passkeyLabel}
              onChange={(event) => setPasskeyLabel(event.target.value)}
              placeholder="Office MacBook, YubiKey, etc."
              className={fieldClass}
            />
            <button
              type="button"
              onClick={handleAddPasskey}
              disabled={!passkeySupported || isPasskeyPending}
              className={primaryBtn}
            >
              {isPasskeyPending ? "Registering..." : "Add passkey"}
            </button>
          </div>
        </div>

        {passkeyError ? (
          <div className={errorBanner}>
            <div className="flex items-start gap-2">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#b7382d]" />
              <span>{passkeyError}</span>
            </div>
          </div>
        ) : null}

        {passkeyLoading ? (
          <div className="text-sm text-[#4e6782]">Loading passkeysâ€¦</div>
        ) : passkeys.length === 0 ? (
          <div className="rounded-[1rem] border border-[#e5eaf2] bg-[#f8fbff] px-4 py-3 text-sm text-[#4e6782]">
            No passkeys registered yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {passkeys.map((item) => (
              <div
                key={item.id}
                className="rounded-[1rem] border border-[#e5eaf2] bg-white p-4 shadow-[0_4px_14px_rgba(10,55,120,0.05)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-semibold text-[#0a1628]">
                      {item.label}
                    </p>
                    <p className="text-xs text-[#5f7ca5]">
                      Added {formatPasskeyDate(item.created_at)}
                    </p>
                    <p className="text-xs text-[#5f7ca5]">
                      Last used {formatPasskeyDate(item.last_used_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={secondaryBtn}
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingLabel(item.label);
                        setRemovingId(null);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className={dangerBtn}
                      onClick={() => {
                        setRemovingId(item.id);
                        setRemovePassword("");
                        setEditingId(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {editingId === item.id ? (
                  <form
                    action={(formData) => handleRenameSubmit(item.id, formData)}
                    className="mt-4 grid gap-3"
                  >
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7ca5]">
                        New label
                      </label>
                      <input
                        name="label"
                        type="text"
                        value={editingLabel}
                        onChange={(event) => setEditingLabel(event.target.value)}
                        className={fieldClass}
                        required
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="submit" className={primaryBtn}>
                        Save label
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-[#5f7ca5] transition hover:text-[#033466]"
                        onClick={() => {
                          setEditingId(null);
                          setEditingLabel("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}

                {removingId === item.id ? (
                  <form
                    action={(formData) => handleRemoveSubmit(item.id, formData)}
                    className="mt-4 grid gap-3"
                  >
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7ca5]">
                        Confirm password to remove
                      </label>
                      <input
                        name="current_password"
                        type="password"
                        value={removePassword}
                        onChange={(event) => setRemovePassword(event.target.value)}
                        className={fieldClass}
                        required
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="submit" className={dangerBtn}>
                        Remove passkey
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-[#5f7ca5] transition hover:text-[#033466]"
                        onClick={() => {
                          setRemovingId(null);
                          setRemovePassword("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const withPasskeys = (panel: ReactNode) => (
    <div className="grid gap-6">
      {panel}
      {passkeyPanel}
    </div>
  );

  if (view.kind === "loading") {
    return withPasskeys(
      <div className="glass-card p-6 md:p-8">
        <Spinner />
      </div>,
    );
  }

  // -------------------------------------------------------------------------
  // Render: Error
  // -------------------------------------------------------------------------

  if (view.kind === "error") {
    return withPasskeys(
      <div className="glass-card p-6 md:p-8">
        <div className="grid gap-4">
          <div className={errorBanner}>
            <div className="flex items-start gap-2">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#b7382d]" />
              <span>{view.message}</span>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={loadStatus}
              disabled={isPending}
              className={secondaryBtn}
            >
              {isPending ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#cfe0f4] border-t-[#036deb]" />
                  Retrying…
                </>
              ) : (
                "Retry"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Unenrolled
  // -------------------------------------------------------------------------

  if (view.kind === "unenrolled") {
    return withPasskeys(
      <div className="glass-card p-6 md:p-8">
        <div className="grid gap-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f3f7fb] shadow-[0_2px_8px_rgba(10,55,120,0.06)]">
              <ShieldOffIcon />
            </div>
            <div className="grid gap-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#0a1628]">
                  Two-Factor Authentication
                </h2>
                <span className="inline-flex items-center rounded-full border border-[#ffd5d2] bg-[#fff4f3] px-2.5 py-0.5 text-[11px] font-semibold text-[#b7382d]">
                  Not enabled
                </span>
              </div>
              <p className="text-sm leading-7 text-[#4e6782]">
                Add an extra layer of security to your super admin account. You will be
                prompted for a 6-digit code from your authenticator app each time you sign in.
              </p>
            </div>
          </div>

          {submitError ? (
            <div className={errorBanner}>
              <div className="flex items-start gap-2">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#b7382d]" />
                <span>{submitError}</span>
              </div>
            </div>
          ) : null}

          <div>
            <button
              type="button"
              onClick={handleBeginSetup}
              disabled={isPending}
              className={primaryBtn}
            >
              {isPending ? (
                <>
                  <BtnSpinner />
                  Starting setup…
                </>
              ) : (
                "Enable two-factor authentication"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Setup QR
  // -------------------------------------------------------------------------

  if (view.kind === "setup_qr") {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      view.otpAuthUrl,
    )}`;

    return withPasskeys(
      <div className="glass-card p-6 md:p-8">
        <div className="grid gap-6">
          {/* Heading */}
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#0a1628]">
              Set up two-factor authentication
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[#4e6782]">
              Link your authenticator app by following the steps below.
            </p>
          </div>

          <form action={handleConfirmSetup} className="grid gap-6">
            {/* Numbered steps */}
            <ol className="grid gap-3">
              {[
                "Download an authenticator app such as Google Authenticator, Authy, or 1Password.",
                "Scan the QR code below with your app, or manually enter the setup key.",
                "Enter the 6-digit verification code generated by your app to activate.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <StepBadge n={i + 1} />
                  <span className="text-[15px] leading-6 text-[#4e6782]">{step}</span>
                </li>
              ))}
            </ol>

            {/* QR code + manual key */}
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-[1rem] border border-[#dbe7f5] bg-white p-3 shadow-[0_4px_16px_rgba(10,55,120,0.06)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeUrl}
                  alt="QR code for authenticator app setup"
                  width={200}
                  height={200}
                  className="block"
                />
              </div>

              <div className="w-full">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7ca5]">
                  Setup key
                </p>
                <div className="mt-1.5 cursor-text select-all break-all rounded-[1rem] border border-[#dbe7f5] bg-[#f8fbff] px-4 py-2.5 font-mono text-sm text-[#0a1628]">
                  {view.secret}
                </div>
              </div>
            </div>

            {/* Verification code input */}
            <div className="grid gap-2">
              <label
                htmlFor="setup-code"
                className="text-sm font-semibold text-[#123055]"
              >
                Verification code
              </label>
              <input
                id="setup-code"
                type="text"
                name="code"
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                className={fieldClass}
                required
              />
            </div>

            {submitError ? (
              <div className={errorBanner}>
                <div className="flex items-start gap-2">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#b7382d]" />
                  <span>{submitError}</span>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" disabled={isPending} className={primaryBtn}>
                {isPending ? (
                  <>
                    <BtnSpinner />
                    Activating…
                  </>
                ) : (
                  "Activate two-factor auth"
                )}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setSubmitError(null);
                  setView({ kind: "unenrolled" });
                }}
                className="text-sm font-medium text-[#5f7ca5] transition hover:text-[#033466] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Setup codes (one-time display)
  // -------------------------------------------------------------------------

  if (view.kind === "setup_codes") {
    return withPasskeys(
      <div className="glass-card p-6 md:p-8">
        <div className="grid gap-6">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#0a1628]">
              Save your recovery codes
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[#4e6782]">
              Recovery codes let you access your account if you ever lose your authenticator
              device. Keep them somewhere safe — each code can only be used once.
            </p>
          </div>

          <div className={warningBanner}>
            <div className="flex items-start gap-2">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#9a6500]" />
              <span>
                Save these codes now — you won&apos;t be able to view them again.
              </span>
            </div>
          </div>

          <div className={codeGridClass}>
            {view.codes.map((code) => (
              <div key={code} className="select-all py-0.5">
                {code}
              </div>
            ))}
          </div>

          <div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setSubmitError(null);
                loadStatus();
              }}
              className={primaryBtn}
            >
              {isPending ? (
                <>
                  <BtnSpinner />
                  Loading…
                </>
              ) : (
                "I've saved my recovery codes"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Enrolled
  // -------------------------------------------------------------------------

  if (view.kind === "enrolled") {
    const codesRemaining = view.mfa.recovery_codes_remaining;
    const codesEmpty = codesRemaining === 0;
    const codesLow = !codesEmpty && codesRemaining <= 2;

    return withPasskeys(
      <div className="glass-card p-6 md:p-8">
        <div className="grid gap-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f2fbf6] shadow-[0_2px_8px_rgba(31,122,70,0.08)]">
              <ShieldCheckIcon />
            </div>
            <div className="grid gap-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#0a1628]">
                  Two-Factor Authentication
                </h2>
                <span className="inline-flex items-center rounded-full border border-[#ccebd8] bg-[#f2fbf6] px-2.5 py-0.5 text-[11px] font-semibold text-[#1f7a46]">
                  Enabled
                </span>
              </div>
              <p className="text-sm leading-6 text-[#4e6782]">
                Your super admin account is protected with two-factor authentication.
              </p>
            </div>
          </div>

          {/* Recovery codes status card */}
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <KeyIcon className="h-4 w-4 text-[#5f7ca5]" />
                <span className="text-sm font-semibold text-[#123055]">
                  Recovery codes remaining
                </span>
              </div>
              <span
                className={`text-sm font-bold tabular-nums ${
                  codesEmpty
                    ? "text-[#b7382d]"
                    : codesLow
                      ? "text-[#9a6500]"
                      : "text-[#1f7a46]"
                }`}
              >
                {codesRemaining}
              </span>
            </div>

            {codesEmpty ? (
              <div className={`mt-4 ${errorBanner}`}>
                <div className="flex items-start gap-2">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#b7382d]" />
                  <span>
                    You have no recovery codes left. Regenerate them now to avoid being
                    locked out of your account.
                  </span>
                </div>
              </div>
            ) : codesLow ? (
              <div className={`mt-4 ${warningBanner}`}>
                <div className="flex items-start gap-2">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#9a6500]" />
                  <span>
                    You only have {codesRemaining} recovery{" "}
                    {codesRemaining === 1 ? "code" : "codes"} left. Consider regenerating
                    them soon.
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setSubmitError(null);
                setView({ kind: "regen_confirm" });
              }}
              className={secondaryBtn}
            >
              Regenerate recovery codes
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmitError(null);
                setView({ kind: "disable_confirm" });
              }}
              className={dangerBtn}
            >
              Disable MFA
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Regen confirm (password prompt)
  // -------------------------------------------------------------------------

  if (view.kind === "regen_confirm") {
    return withPasskeys(
      <div className="glass-card p-6 md:p-8">
        <div className="grid gap-6">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#0a1628]">
              Regenerate Recovery Codes
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[#4e6782]">
              This will invalidate your existing codes. Enter your password to continue.
            </p>
          </div>

          <form action={handleRegenSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label
                htmlFor="regen-password"
                className="text-sm font-semibold text-[#123055]"
              >
                Current password
              </label>
              <input
                id="regen-password"
                type="password"
                name="current_password"
                placeholder="Enter your current password"
                autoComplete="current-password"
                className={fieldClass}
                required
              />
            </div>

            {submitError ? (
              <div className={errorBanner}>
                <div className="flex items-start gap-2">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#b7382d]" />
                  <span>{submitError}</span>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" disabled={isPending} className={primaryBtn}>
                {isPending ? (
                  <>
                    <BtnSpinner />
                    Regenerating…
                  </>
                ) : (
                  "Regenerate codes"
                )}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setSubmitError(null);
                  loadStatus();
                }}
                className="text-sm font-medium text-[#5f7ca5] transition hover:text-[#033466] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Regen codes (new codes display)
  // -------------------------------------------------------------------------

  if (view.kind === "regen_codes") {
    return withPasskeys(
      <div className="glass-card p-6 md:p-8">
        <div className="grid gap-6">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#0a1628]">
              New recovery codes
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[#4e6782]">
              Store these codes somewhere safe. Each code can only be used once to access
              your account.
            </p>
          </div>

          <div className={warningBanner}>
            <div className="flex items-start gap-2">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#9a6500]" />
              <span>Your previous recovery codes have been invalidated.</span>
            </div>
          </div>

          <div className={codeGridClass}>
            {view.codes.map((code) => (
              <div key={code} className="select-all py-0.5">
                {code}
              </div>
            ))}
          </div>

          <div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setSubmitError(null);
                loadStatus();
              }}
              className={primaryBtn}
            >
              {isPending ? (
                <>
                  <BtnSpinner />
                  Loading…
                </>
              ) : (
                "Done"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Disable confirm (password prompt)
  // -------------------------------------------------------------------------

  if (view.kind === "disable_confirm") {
    return withPasskeys(
      <div className="glass-card p-6 md:p-8">
        <div className="grid gap-6">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#0a1628]">
              Disable two-factor authentication
            </h2>
          </div>

          <div className={errorBanner}>
            <div className="flex items-start gap-2">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#b7382d]" />
              <span>
                Disabling MFA will remove the authentication requirement for your account.
                This is a security risk.
              </span>
            </div>
          </div>

          <form action={handleDisableSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label
                htmlFor="disable-password"
                className="text-sm font-semibold text-[#123055]"
              >
                Current password
              </label>
              <input
                id="disable-password"
                type="password"
                name="current_password"
                placeholder="Enter your current password"
                autoComplete="current-password"
                className={fieldClass}
                required
              />
            </div>

            {submitError ? (
              <div className={errorBanner}>
                <div className="flex items-start gap-2">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#b7382d]" />
                  <span>{submitError}</span>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" disabled={isPending} className={dangerBtn}>
                {isPending ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-[rgba(183,56,45,0.3)] border-t-[#b7382d]" />
                    Disabling…
                  </>
                ) : (
                  "Disable MFA"
                )}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setSubmitError(null);
                  loadStatus();
                }}
                className="text-sm font-medium text-[#5f7ca5] transition hover:text-[#033466] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}

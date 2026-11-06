import { isPreviewVerificationCode } from './onboardingPreview';

export const resendSecondsRemaining = (deadline: number, now: number) => Math.max(0, Math.ceil((deadline - now) / 1000));

/** The prototype has one explicit code; duplicate autofill events cannot sign in twice. */
export const createPreviewCodeAttempt = () => {
  let inFlight = false;
  return { async submit(code: string, signIn: () => Promise<void>): Promise<'invalid' | 'ignored' | 'success' | 'failed'> {
    if (inFlight) return 'ignored';
    if (!isPreviewVerificationCode(code)) return 'invalid';
    inFlight = true;
    try { await signIn(); return 'success'; }
    catch { inFlight = false; return 'failed'; }
  } };
};

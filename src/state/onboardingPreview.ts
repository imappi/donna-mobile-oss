export const FINLAND_CALLING_CODE = '+358';
export const PREVIEW_VERIFICATION_CODE = '111111';
export const PREVIEW_SESSION_CREDENTIALS = {
  email: 'onboarding@preview.test',
  password: 'finland-preview'
} as const;

const NATIONAL_DIGITS = 9;

export const finnishNationalDigits = (input: string): string => {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('358')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, NATIONAL_DIGITS);
};

export const formatFinnishPhoneInput = (input: string): string => {
  const digits = finnishNationalDigits(input);
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5)]
    .filter(Boolean)
    .join(' ');
};

export const normalizeFinnishPhone = (input: string): string | null => {
  const digits = finnishNationalDigits(input);
  return digits.length === NATIONAL_DIGITS ? `${FINLAND_CALLING_CODE}${digits}` : null;
};

export const maskFinnishPhone = (phone: string): string => {
  const digits = finnishNationalDigits(phone);
  if (digits.length !== NATIONAL_DIGITS) return FINLAND_CALLING_CODE;
  return `${FINLAND_CALLING_CODE} ${digits.slice(0, 2)} ••• ••${digits.slice(-2)}`;
};

export const isPreviewVerificationCode = (input: string): boolean =>
  input.replace(/\D/g, '') === PREVIEW_VERIFICATION_CODE;

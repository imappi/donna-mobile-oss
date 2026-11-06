import assert from 'node:assert/strict';
import test from 'node:test';
import {
  finnishNationalDigits,
  formatFinnishPhoneInput,
  isPreviewVerificationCode,
  maskFinnishPhone,
  normalizeFinnishPhone
} from './onboardingPreview';

test('Finnish phone entry accepts local and international forms and normalizes one E.164 value', () => {
  assert.equal(finnishNationalDigits('040 123 4567'), '401234567');
  assert.equal(formatFinnishPhoneInput('+358 40 123 4567'), '40 123 4567');
  assert.equal(normalizeFinnishPhone('040 123 4567'), '+358401234567');
  assert.equal(normalizeFinnishPhone('40 123'), null);
});

test('the preview masks the destination and accepts only the agreed six-digit code', () => {
  assert.equal(maskFinnishPhone('+358401234567'), '+358 40 ••• ••67');
  assert.equal(isPreviewVerificationCode('111 111'), true);
  assert.equal(isPreviewVerificationCode('111112'), false);
});

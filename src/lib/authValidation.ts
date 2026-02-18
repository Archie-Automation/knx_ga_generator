export interface ValidationResult {
  valid: boolean;
  message?: string;
  messageKey?: string; // i18n key for translation
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, messageKey: 'authEmailRequired' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, messageKey: 'authEmailInvalid' };
  }
  return { valid: true };
}

export function validatePassword(password: string, isSignUp = false): ValidationResult {
  if (!password) {
    return { valid: false, messageKey: 'authPasswordRequired' };
  }
  if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      messageKey: 'authPasswordMinLength',
      message: String(MIN_PASSWORD_LENGTH),
    };
  }
  return { valid: true };
}

export function validatePasswordConfirm(password: string, passwordConfirm: string): ValidationResult {
  if (password !== passwordConfirm) {
    return { valid: false, messageKey: 'authPasswordMismatch' };
  }
  return { valid: true };
}

export function validateAuthForm(
  email: string,
  password: string,
  isSignUp = false,
  passwordConfirm?: string
): { email: ValidationResult; password: ValidationResult; passwordConfirm?: ValidationResult } {
  const result: { email: ValidationResult; password: ValidationResult; passwordConfirm?: ValidationResult } = {
    email: validateEmail(email),
    password: validatePassword(password, isSignUp),
  };
  if (isSignUp && passwordConfirm !== undefined) {
    result.passwordConfirm = validatePasswordConfirm(password, passwordConfirm);
  }
  return result;
}

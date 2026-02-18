import { useState, useRef, useEffect } from 'react';
import pkg from '../../package.json';
import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';
import { DarkModeToggle, useDarkMode } from './DarkModeToggle';
import { supabase } from '../lib/supabase';
import { validateAuthForm } from '../lib/authValidation';
import { compressImage } from '../lib/imageUtils';
import type { CompanyInfo } from '../types/common';

type AuthMode = 'signin' | 'signup' | 'forgot';

export const Login = () => {
  const { username, setUsername, saveDisplayName, saveUserCompanyInfo, saveUserLogo, authPendingPasswordReset, setAuthPendingPasswordReset } = useAppStore();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordConfirmError, setPasswordConfirmError] = useState<string | null>(null);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({});
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [signUpSuccessVerifyEmail, setSignUpSuccessVerifyEmail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useDarkMode();
  const { t } = useTranslation();

  const logoPath = isDark ? '/logo_dark.png' : '/logo_light.png';

  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

  const clearFieldErrors = () => {
    setDisplayNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setPasswordConfirmError(null);
    setError(null);
    setSignUpSuccessVerifyEmail(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFieldErrors();
    const validation = validateAuthForm(email, '', false);
    if (!validation.email.valid) {
      setEmailError(validation.email.messageKey ? t(validation.email.messageKey) : validation.email.message ?? null);
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin + window.location.pathname,
      });
      if (resetError) throw resetError;
      setError(null);
      alert(t('recoverPasswordSuccess') || 'Controleer uw e-mail voor de link om een nieuw wachtwoord in te stellen.');
      setMode('signin');
    } catch (err: unknown) {
      const rawMessage = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
      setError(rawMessage || t('authError') || 'Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFieldErrors();
    const validation = validateAuthForm('', password, true, passwordConfirm);
    if (!validation.password.valid) {
      const msg = validation.password.messageKey === 'authPasswordMinLength' && validation.password.message
        ? t(validation.password.messageKey, { n: validation.password.message })
        : validation.password.messageKey ? t(validation.password.messageKey) : validation.password.message;
      setPasswordError(msg ?? null);
      return;
    }
    if (validation.passwordConfirm && !validation.passwordConfirm.valid) {
      setPasswordConfirmError(validation.passwordConfirm.messageKey ? t(validation.passwordConfirm.messageKey) : validation.passwordConfirm.message ?? null);
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setAuthPendingPasswordReset(false);
      setPassword('');
      setPasswordConfirm('');
      alert(t('setNewPasswordSuccess') || 'Uw wachtwoord is gewijzigd. Log nu in met uw nieuwe wachtwoord.');
    } catch (err: unknown) {
      const rawMessage = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
      const isPasswordSameAsOld = /new password should be different|password should be different/i.test(rawMessage);
      const message = isPasswordSameAsOld
        ? (t('authPasswordSameAsOld') || 'Het nieuwe wachtwoord moet verschillen van het oude wachtwoord.')
        : (rawMessage || t('authError') || 'Er is iets misgegaan. Probeer het opnieuw.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Alleen afbeeldingsbestanden zijn toegestaan');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Bestand is te groot. Maximum 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        try {
          const compressed = await compressImage(dataUrl, 0.8);
          setLogoDataUrl(compressed);
        } catch {
          setLogoDataUrl(dataUrl);
        }
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFieldErrors();

    const isSignUp = mode === 'signup';

    if (isSignUp && !displayName.trim()) {
      setDisplayNameError(t('displayNameRequired') || 'Naam is verplicht');
      return;
    }

    const validation = validateAuthForm(email, password, isSignUp, isSignUp ? passwordConfirm : undefined);

    if (!validation.email.valid) {
      const msg = validation.email.messageKey ? t(validation.email.messageKey) : validation.email.message;
      setEmailError(msg ?? null);
      return;
    }
    if (!validation.password.valid) {
      const msg = validation.password.messageKey === 'authPasswordMinLength' && validation.password.message
        ? t(validation.password.messageKey, { n: validation.password.message })
        : validation.password.messageKey ? t(validation.password.messageKey) : validation.password.message;
      setPasswordError(msg ?? null);
      return;
    }
    if (validation.passwordConfirm && !validation.passwordConfirm.valid) {
      setPasswordConfirmError(validation.passwordConfirm.messageKey ? t(validation.passwordConfirm.messageKey) : validation.passwordConfirm.message ?? null);
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const redirectUrl = typeof window !== 'undefined'
          ? window.location.origin + window.location.pathname + window.location.hash
          : undefined;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: redirectUrl ? { emailRedirectTo: redirectUrl } : undefined,
        });
        if (signUpError) throw signUpError;
        const userEmail = data.user?.email ?? email.trim();
        if (data.session) {
          setUsername(userEmail);
          if (displayName.trim()) saveDisplayName(userEmail, displayName.trim());
          if (Object.values(companyInfo).some(Boolean)) saveUserCompanyInfo(userEmail, companyInfo);
          if (logoDataUrl) saveUserLogo(userEmail, logoDataUrl);
        } else if (data.user) {
          if (displayName.trim()) saveDisplayName(userEmail, displayName.trim());
          if (Object.values(companyInfo).some(Boolean)) saveUserCompanyInfo(userEmail, companyInfo);
          if (logoDataUrl) saveUserLogo(userEmail, logoDataUrl);
          setSignUpSuccessVerifyEmail(true);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) throw signInError;
        if (data.user) {
          setUsername(data.user.email ?? email.trim());
        }
      }
    } catch (err: unknown) {
      const rawMessage = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : '';
      const isRateLimit = /rate limit|rate_limit/i.test(rawMessage);
      const isInvalidCredentials = /invalid login credentials|invalid_credentials/i.test(rawMessage);
      const isEmailNotConfirmed = /email not confirmed/i.test(rawMessage);
      const message = isRateLimit
        ? (t('authEmailRateLimit') || 'Supabase stuurt maximaal 2 e-mails per uur.')
        : isInvalidCredentials
        ? (t('authInvalidCredentials') || 'Ongeldige inloggegevens. Controleer uw e-mail en wachtwoord.')
        : isEmailNotConfirmed
        ? (t('authEmailNotConfirmed') || 'Uw e-mailadres is nog niet bevestigd. Controleer uw inbox voor de bevestigingslink.')
        : (rawMessage || t('authError') || 'Er is iets misgegaan. Probeer het opnieuw.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (username && !authPendingPasswordReset) {
    return null;
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    boxSizing: 'border-box' as const,
    backgroundColor: isDark ? '#857f78' : '#faf9f6',
    color: isDark ? '#f5f3f0' : '#0f172a',
    outline: 'none',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: 'var(--color-bg)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '8px',
        }}
      >
        <DarkModeToggle />
        <LanguageSelector />
      </div>
      <div
        className="card no-hover"
        style={{ width: '100%', maxWidth: '500px', padding: '32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '24px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                padding: '8px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                borderRadius: '20px',
                boxShadow: '0 4px 16px var(--color-shadow), 0 1px 3px rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <img
                src={logoPath}
                alt="Archie Logo"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = isDark ? '/logo_light.png' : '/logo_dark.png';
                }}
                className="login-logo"
                style={{
                  height: '80px',
                  width: 'auto',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  display: 'block',
                }}
              />
            </div>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', color: 'var(--color-text)' }}>
            {t('appTitle') || 'KNX Groepsadressen generator'}
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            {authPendingPasswordReset
              ? (t('setNewPassword') || 'Nieuw wachtwoord instellen')
              : mode === 'forgot'
              ? (t('forgotPassword') || 'Wachtwoord vergeten?')
              : mode === 'signin'
              ? (t('loginSubtitle') || 'Log in met uw e-mail en wachtwoord')
              : (t('signUpSubtitle') || 'Maak een account aan met e-mail en wachtwoord')}
          </p>
        </div>

        {authPendingPasswordReset ? (
          <form onSubmit={handleSetNewPassword} autoComplete="off">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(220, 53, 69, 0.1)', color: 'var(--color-danger)', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}
              <div>
                <label className="login-label" style={{ display: 'block', marginBottom: '8px', fontSize: '1rem', color: isDark ? '#f5f3f0' : '#0f172a', fontWeight: 600 }}>
                  {t('password') || 'Wachtwoord'} *
                </label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }} placeholder={t('passwordPlaceholderMin') || 'Min. 8 tekens'} style={{ ...inputStyle, paddingRight: 44, borderColor: passwordError ? 'var(--color-danger)' : undefined }} className="login-input" disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? (t('hidePassword') || 'Verbergen') : (t('showPassword') || 'Tonen')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-secondary)' }} tabIndex={-1}>
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {passwordError && <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginTop: '4px', display: 'block' }}>{passwordError}</span>}
              </div>
              <div>
                <label className="login-label" style={{ display: 'block', marginBottom: '8px', fontSize: '1rem', color: isDark ? '#f5f3f0' : '#0f172a', fontWeight: 600 }}>
                  {t('passwordConfirm') || 'Bevestig wachtwoord'} *
                </label>
                <div style={{ position: 'relative' }}>
                  <input type={showPasswordConfirm ? 'text' : 'password'} autoComplete="new-password" value={passwordConfirm} onChange={(e) => { setPasswordConfirm(e.target.value); setPasswordConfirmError(null); }} placeholder={t('passwordPlaceholderMin') || 'Min. 8 tekens'} style={{ ...inputStyle, paddingRight: 44, borderColor: passwordConfirmError ? 'var(--color-danger)' : undefined }} className="login-input" disabled={loading} />
                  <button type="button" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} title={showPasswordConfirm ? (t('hidePassword') || 'Verbergen') : (t('showPassword') || 'Tonen')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-secondary)' }} tabIndex={-1}>
                    {showPasswordConfirm ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {passwordConfirmError && <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginTop: '4px', display: 'block' }}>{passwordConfirmError}</span>}
              </div>
              <button type="submit" disabled={loading || !password || !passwordConfirm} className="button primary" style={{ width: '100%', borderRadius: '10px', padding: '12px' }}>
                {loading ? (t('loading') || 'Bezig...') : (t('save') || 'Opslaan')}
              </button>
            </div>
          </form>
        ) : mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} autoComplete="off">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(220, 53, 69, 0.1)', color: 'var(--color-danger)', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}
              <div>
                <label className="login-label" style={{ display: 'block', marginBottom: '8px', fontSize: '1rem', color: isDark ? '#f5f3f0' : '#0f172a', fontWeight: 600 }}>
                  {t('email') || 'E-mail'}
                </label>
                <input type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(null); }} placeholder={t('emailPlaceholder') || 'voorbeeld@email.nl'} style={{ ...inputStyle, borderColor: emailError ? 'var(--color-danger)' : undefined }} className="login-input" disabled={loading} />
                {emailError && <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginTop: '4px', display: 'block' }}>{emailError}</span>}
              </div>
              <button type="submit" disabled={loading} className="button primary" style={{ width: '100%', borderRadius: '10px', padding: '12px' }}>
                {loading ? (t('loading') || 'Bezig...') : (t('recoverPassword') || 'Stuur resetlink')}
              </button>
              <button type="button" className="button ghost" style={{ fontSize: '0.9rem' }} onClick={() => { setMode('signin'); setEmail(''); setPassword(''); clearFieldErrors(); }}>
                {t('alreadyHaveAccount') || 'Al een account? Log in'}
              </button>
            </div>
          </form>
        ) : (
        <form onSubmit={handleSubmit} autoComplete="off">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {signUpSuccessVerifyEmail && (
              <div
                role="alert"
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  color: 'var(--color-success, #16a34a)',
                  fontSize: '0.95rem',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <strong>{t('signUpSuccessTitle') || 'Account aangemaakt'}</strong>
                <p style={{ margin: '8px 0 0 0', fontWeight: 'normal' }}>
                  {t('signUpConfirmEmail') || 'Controleer uw e-mail en klik op de bevestigingslink om uw account te activeren.'}
                </p>
              </div>
            )}
            {error && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(220, 53, 69, 0.1)',
                  color: 'var(--color-danger)',
                  fontSize: '0.9rem',
                }}
              >
                {error}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label
                  className="login-label"
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '1rem',
                    color: isDark ? '#f5f3f0' : '#0f172a',
                    fontWeight: 600,
                  }}
                >
                  {t('displayName') || 'Naam'} *
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setDisplayNameError(null);
                  }}
                  placeholder={t('displayNamePlaceholder') || 'Voer uw naam in'}
                  style={{
                    ...inputStyle,
                    borderColor: displayNameError ? 'var(--color-danger)' : undefined,
                  }}
                  className="login-input"
                  disabled={loading}
                />
                {displayNameError && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginTop: '4px', display: 'block' }}>
                    {displayNameError}
                  </span>
                )}
              </div>
            )}

            <div>
              <label
                className="login-label"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '1rem',
                  color: isDark ? '#f5f3f0' : '#0f172a',
                  fontWeight: 600,
                }}
              >
                {t('email') || 'E-mail'}
              </label>
              <input
                type="email"
                autoComplete={mode === 'signin' ? 'off' : 'email'}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                placeholder={t('emailPlaceholder') || 'voorbeeld@email.nl'}
                style={{
                  ...inputStyle,
                  borderColor: emailError ? 'var(--color-danger)' : undefined,
                }}
                className="login-input"
                disabled={loading}
              />
              {emailError && (
                <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginTop: '4px', display: 'block' }}>
                  {emailError}
                </span>
              )}
            </div>

            <div>
              <label
                className="login-label"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '1rem',
                  color: isDark ? '#f5f3f0' : '#0f172a',
                  fontWeight: 600,
                }}
              >
                {t('password') || 'Wachtwoord'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'off' : (mode === 'signup' ? 'new-password' : 'current-password')}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder={mode === 'signup' ? (t('passwordPlaceholderMin') || 'Min. 8 tekens') : ''}
                  style={{
                    ...inputStyle,
                    paddingRight: 44,
                    borderColor: passwordError ? 'var(--color-danger)' : undefined,
                  }}
                  className="login-input"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? (t('hidePassword') || 'Verbergen') : (t('showPassword') || 'Tonen')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-secondary)' }} tabIndex={-1}>
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {passwordError && (
                <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginTop: '4px', display: 'block' }}>
                  {passwordError}
                </span>
              )}
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="login-label" style={{ display: 'block', marginBottom: '8px', fontSize: '1rem', color: isDark ? '#f5f3f0' : '#0f172a', fontWeight: 600 }}>
                    {t('passwordConfirm') || 'Bevestig wachtwoord'} *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={passwordConfirm}
                      onChange={(e) => { setPasswordConfirm(e.target.value); setPasswordConfirmError(null); }}
                      placeholder={t('passwordPlaceholderMin') || 'Min. 8 tekens'}
                      style={{ ...inputStyle, paddingRight: 44, borderColor: passwordConfirmError ? 'var(--color-danger)' : undefined }}
                      className="login-input"
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} title={showPasswordConfirm ? (t('hidePassword') || 'Verbergen') : (t('showPassword') || 'Tonen')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-secondary)' }} tabIndex={-1}>
                      {showPasswordConfirm ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {passwordConfirmError && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginTop: '4px', display: 'block' }}>
                      {passwordConfirmError}
                    </span>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
                  <button type="button" className="button ghost" style={{ fontSize: '0.9rem', marginBottom: 12 }} onClick={() => setShowCompanyInfo(!showCompanyInfo)}>
                    {showCompanyInfo ? '−' : '+'} {t('companyInfoOptional') || 'Bedrijfsgegevens (optioneel)'}
                  </button>
                  {showCompanyInfo && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <input type="text" value={companyInfo.companyName || ''} onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })} placeholder={t('companyName') || 'Bedrijfsnaam'} style={inputStyle} className="login-input" disabled={loading} />
                      <input type="text" value={companyInfo.address || ''} onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })} placeholder={t('address') || 'Adres'} style={inputStyle} className="login-input" disabled={loading} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" value={companyInfo.postalCode || ''} onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })} placeholder={t('postalCode') || 'Postcode'} style={{ ...inputStyle, flex: 1 }} className="login-input" disabled={loading} />
                        <input type="text" value={companyInfo.city || ''} onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })} placeholder={t('city') || 'Plaats'} style={{ ...inputStyle, flex: 2 }} className="login-input" disabled={loading} />
                      </div>
                      <input type="text" value={companyInfo.phone || ''} onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })} placeholder={t('phone') || 'Telefoon'} style={inputStyle} className="login-input" disabled={loading} />
                      <input type="email" value={companyInfo.email || ''} onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })} placeholder={t('email') || 'E-mail'} style={inputStyle} className="login-input" disabled={loading} />
                      <input type="text" value={companyInfo.website || ''} onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })} placeholder={t('website') || 'Website'} style={inputStyle} className="login-input" disabled={loading} />
                      <div>
                        <label className="login-label" style={{ display: 'block', marginBottom: 8, fontSize: '0.95rem', fontWeight: 600 }}>{t('uploadLogo') || 'Logo uploaden'}</label>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                        <button type="button" className="button secondary" onClick={() => fileInputRef.current?.click()} style={{ fontSize: '0.9rem', padding: '8px 16px' }} disabled={loading}>
                          {logoDataUrl ? (t('changeLogo') || 'Wijzig logo') : (t('selectLogo') || 'Selecteer logo')}
                        </button>
                        {logoDataUrl && <img src={logoDataUrl} alt="Logo" style={{ maxHeight: 60, maxWidth: 120, objectFit: 'contain', marginTop: 8, borderRadius: 8 }} />}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'signup' && (!displayName.trim() || !passwordConfirm))}
              className="button primary"
              style={{ width: '100%', borderRadius: '10px', padding: '12px' }}
            >
              {loading
                ? (t('loading') || 'Bezig...')
                : mode === 'signin'
                  ? (t('signIn') || 'Inloggen')
                  : (t('signUp') || 'Account aanmaken')}
            </button>

            {mode === 'signin' && (
              <div style={{ textAlign: 'center' }}>
                <button type="button" className="button ghost" style={{ fontSize: '0.9rem' }} onClick={() => { setMode('forgot'); clearFieldErrors(); }}>
                  {t('forgotPassword') || 'Wachtwoord vergeten?'}
                </button>
              </div>
            )}

            <div style={{ textAlign: 'center', paddingTop: '8px' }}>
              <button
                type="button"
                className="button ghost"
                style={{ fontSize: '0.9rem' }}
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  if (mode === 'signup') {
                    setEmail('');
                    setPassword('');
                  }
                  setDisplayName('');
                  setPasswordConfirm('');
                  setShowCompanyInfo(false);
                  setCompanyInfo({});
                  setLogoDataUrl('');
                  setSignUpSuccessVerifyEmail(false);
                  clearFieldErrors();
                }}
              >
                {mode === 'signin'
                  ? (t('noAccountYet') || 'Nog geen account? Registreren')
                  : (t('alreadyHaveAccount') || 'Al een account? Inloggen')}
              </button>
              {mode === 'signin' && (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {t('accountRequiredInfo') || 'Een account is vereist om uw licentie te activeren en uw instellingen te bewaren.'}
                </p>
              )}
            </div>
          </div>
        </form>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <span>Copyright by Archie Automation</span>
        <span>v {pkg.version}</span>
      </div>
    </div>
  );
};

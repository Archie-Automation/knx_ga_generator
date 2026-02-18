import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';
import type { CompanyInfo } from '../types/common';
import { validateEmail } from '../lib/authValidation';
import { compressImage } from '../lib/imageUtils';
import { LicenseAndDevices } from './LicenseAndDevices';

export const UserManager = () => {
  const { username, deleteUser, renameUser, updateUserEmailInSupabase, signOutAuth, saveUserLogo, getUserLogo, getDisplayName, saveDisplayName, saveUserCompanyInfo, getUserCompanyInfo } = useAppStore();
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [currentUserEmailInput, setCurrentUserEmailInput] = useState('');
  const [editingCompanyFor, setEditingCompanyFor] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'license' | 'company' | 'logo' | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync display name and email input when username changes
  useEffect(() => {
    if (username) {
      setDisplayNameInput(getDisplayName(username) || '');
      setCurrentUserEmailInput(username);
    } else {
      setDisplayNameInput('');
      setCurrentUserEmailInput('');
    }
  }, [username, refreshKey, getDisplayName]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const displayNameChanged = displayNameInput !== (getDisplayName(username) || '');
  const emailChanged = currentUserEmailInput.trim().toLowerCase() !== (username || '').toLowerCase();

  const handleDeleteUser = async (userToDelete: string) => {
    // Show confirmation dialog with translation
    const confirmMessage = t('confirmDeleteUser')?.replace('{name}', userToDelete) || 
      `Weet u zeker dat u gebruiker "${userToDelete}" wilt verwijderen? Let op: al uw sjablonen en projecten worden verwijderd.`;
    
    if (confirm(confirmMessage)) {
      const isCurrentUser = userToDelete === username;
      const success = deleteUser(userToDelete);
      
      if (success) {
        if (isCurrentUser) {
          await signOutAuth();
        }
        setRefreshKey(prev => prev + 1);
      } else {
        alert(t('userDeleteError') || 'Fout bij verwijderen gebruiker');
      }
    }
  };

  const handleLogoUpload = (user: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Alleen afbeeldingsbestanden zijn toegestaan');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Bestand is te groot. Maximum grootte is 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        try {
          // Optionally compress the image before saving
          const compressedDataUrl = await compressImage(dataUrl, 0.8); // 80% quality
          saveUserLogo(user, compressedDataUrl);
          setRefreshKey(prev => prev + 1); // Force re-render to update UI
        } catch (err) {
          console.error('Error saving logo:', err);
          // Try saving original if compression fails
          try {
            saveUserLogo(user, dataUrl);
            setRefreshKey(prev => prev + 1); // Force re-render to update UI
          } catch (saveErr) {
            // Error already shown by saveUserLogo
          }
        }
      }
    };
    reader.onerror = () => {
      alert('Fout bij lezen van bestand');
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = (user: string) => {
    if (confirm('Weet u zeker dat u het logo wilt verwijderen?')) {
      saveUserLogo(user, ''); // Save empty string to remove
      setRefreshKey(prev => prev + 1); // Force re-render to update UI
      setActiveSection(null);
    }
  };

  const handleOpenCompanyInfo = (user: string) => {
    const existingInfo = getUserCompanyInfo(user);
    setCompanyInfo(existingInfo || {});
    setEditingCompanyFor(user);
  };

  const toggleSection = (section: 'license' | 'company' | 'logo') => {
    setActiveSection((prev) => (prev === section ? null : section));
    if (section === 'company' && username) {
      handleOpenCompanyInfo(username);
    } else {
      setEditingCompanyFor(null);
    }
  };

  const handleSaveCompanyInfo = (user: string) => {
    saveUserCompanyInfo(user, companyInfo);
    setEditingCompanyFor(null);
    setActiveSection(null);
  };

  const handleCancelCompanyInfo = () => {
    setEditingCompanyFor(null);
    setCompanyInfo({});
    setActiveSection(null);
  };

  const handleSaveDisplayName = () => {
    if (!username) return;
    saveDisplayName(username, displayNameInput);
    setRefreshKey(prev => prev + 1);
  };

  const handleSaveCurrentUserEmail = async () => {
    if (!username) return;
    const newEmail = currentUserEmailInput.trim().toLowerCase();
    if (newEmail === username) return;
    const emailValidation = validateEmail(newEmail);
    if (!emailValidation.valid) {
      alert(emailValidation.messageKey ? t(emailValidation.messageKey) : t('authEmailInvalid'));
      return;
    }
    const result = await updateUserEmailInSupabase(newEmail);
    if (result.error) {
      alert(result.error.message);
      return;
    }
    renameUser(username, newEmail);
    await signOutAuth();
    alert(t('emailUpdateConfirmSent') || 'Er is een bevestigingsmail verzonden naar het nieuwe e-mailadres. Klik op de link om de wijziging te bevestigen.');
  };

  return (
    <div className="card">
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>{t('user') || 'Gebruiker'}</h3>
      </div>
      <div>
        {username && (
          <div className="card" style={{ marginBottom: 24, padding: '20px', backgroundColor: 'var(--color-primary-bg)', border: '2px solid var(--color-primary)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--color-text)' }}>
              {t('currentUser') || 'Huidige gebruiker'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>
                  {t('displayName') || 'Naam'}
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder={t('displayNamePlaceholder') || 'Voer uw naam in'}
                    className="input"
                    style={{ flex: 1, minWidth: 180, fontSize: '14px', padding: '8px 12px' }}
                    maxLength={50}
                    onKeyDown={(e) => e.key === 'Enter' && displayNameChanged && handleSaveDisplayName()}
                  />
                  {displayNameChanged && (
                    <button onClick={handleSaveDisplayName} className="button primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                      {t('save') || 'Opslaan'}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>
                  {t('email') || 'E-mail'}
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    value={currentUserEmailInput}
                    onChange={(e) => setCurrentUserEmailInput(e.target.value)}
                    placeholder={t('emailPlaceholder') || 'voorbeeld@email.nl'}
                    className="input"
                    style={{ flex: 1, minWidth: 180, fontSize: '14px', padding: '8px 12px' }}
                    maxLength={100}
                  />
                  {emailChanged && (
                    <button
                      onClick={handleSaveCurrentUserEmail}
                      className="button primary"
                      style={{ fontSize: '13px', padding: '8px 16px' }}
                    >
                      {t('save') || 'Opslaan'}
                    </button>
                  )}
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  {t('emailChangeConfirmInfo') || 'Bij wijziging ontvangt u een bevestigingsmail op het NIEUWE adres. Klik die link om te bevestigen.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => toggleSection('license')}
                    className={`button ${activeSection === 'license' ? 'primary' : 'secondary'}`}
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                  >
                    {t('licenseAndDevicesTitle') || 'Licentie & Apparaten'}
                  </button>
                  <button
                    onClick={() => toggleSection('company')}
                    className={`button ${activeSection === 'company' ? 'primary' : 'secondary'}`}
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                  >
                    {t('companyInfo') || 'Bedrijfsgegevens'}
                  </button>
                  <button
                    onClick={() => toggleSection('logo')}
                    className={`button ${activeSection === 'logo' ? 'primary' : 'secondary'}`}
                    style={{ fontSize: '14px', padding: '10px 20px' }}
                  >
                    {getUserLogo(username) ? (t('changeLogo') || 'Wijzig logo') : (t('uploadLogo') || 'Upload logo')}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(username)}
                    className="button ghost"
                    style={{ fontSize: '14px', padding: '10px 20px', color: 'var(--color-danger)' }}
                  >
                    {t('delete') || 'Verwijderen'}
                  </button>
                </div>
                {activeSection === 'logo' && (
                  <div className="card" style={{ marginTop: 0, backgroundColor: 'var(--color-bg-secondary)' }}>
                    <h4 style={{ marginTop: 0, marginBottom: 12 }}>{t('logo') || 'Logo'}</h4>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(username, e)}
                      style={{ display: 'none' }}
                    />
                    <div className="flex" style={{ gap: 8, flexDirection: 'column' }}>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="button secondary"
                        style={{ fontSize: '14px', padding: '10px 20px' }}
                      >
                        {t('selectLogo') || 'Selecteer logo'}
                      </button>
                      {getUserLogo(username) && (
                        <div className="flex" style={{ gap: 12, alignItems: 'center' }}>
                          <img
                            src={getUserLogo(username) || undefined}
                            alt="Logo"
                            style={{ maxHeight: 60, maxWidth: 150, objectFit: 'contain' }}
                          />
                          <button
                            onClick={() => handleRemoveLogo(username)}
                            className="button ghost"
                            style={{ fontSize: '13px', padding: '8px 16px', color: 'var(--color-danger)' }}
                          >
                            {t('removeLogo') || 'Verwijder logo'}
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => setActiveSection(null)}
                        className="button ghost"
                        style={{ fontSize: '13px', padding: '8px 16px' }}
                      >
                        {t('cancel') || 'Annuleren'}
                      </button>
                    </div>
                  </div>
                )}
                {activeSection === 'company' && editingCompanyFor === username && (
                  <div className="card" style={{ marginTop: 0, backgroundColor: 'var(--color-bg-secondary)' }}>
                    <h4 style={{ marginTop: 0, marginBottom: 16 }}>{t('companyInfo') || 'Bedrijfsgegevens'}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <input
                        type="text"
                        value={companyInfo.companyName || ''}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                        placeholder={t('companyName') || 'Bedrijfsnaam'}
                        className="input"
                        style={{ fontSize: '14px', padding: '10px 14px' }}
                      />
                      <input
                        type="text"
                        value={companyInfo.address || ''}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                        placeholder={t('address') || 'Adres'}
                        className="input"
                        style={{ fontSize: '14px', padding: '10px 14px' }}
                      />
                      <div className="flex" style={{ gap: 8 }}>
                        <input
                          type="text"
                          value={companyInfo.postalCode || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })}
                          placeholder={t('postalCode') || 'Postcode'}
                          className="input"
                          style={{ flex: 1, fontSize: '14px', padding: '10px 14px' }}
                        />
                        <input
                          type="text"
                          value={companyInfo.city || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                          placeholder={t('city') || 'Plaats'}
                          className="input"
                          style={{ flex: 2, fontSize: '14px', padding: '10px 14px' }}
                        />
                      </div>
                      <input
                        type="text"
                        value={companyInfo.phone || ''}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                        placeholder={t('phone') || 'Telefoon'}
                        className="input"
                        style={{ fontSize: '14px', padding: '10px 14px' }}
                      />
                      <input
                        type="email"
                        value={companyInfo.email || ''}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                        placeholder={t('email') || 'E-mail'}
                        className="input"
                        style={{ fontSize: '14px', padding: '10px 14px' }}
                      />
                      <input
                        type="text"
                        value={companyInfo.website || ''}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                        placeholder={t('website') || 'Website'}
                        className="input"
                        style={{ fontSize: '14px', padding: '10px 14px' }}
                      />
                      <div className="flex" style={{ gap: 8, marginTop: 8 }}>
                        <button
                          onClick={() => handleSaveCompanyInfo(username)}
                          className="button primary"
                          style={{ flex: 1, fontSize: '14px', padding: '10px 20px' }}
                        >
                          {t('save') || 'Opslaan'}
                        </button>
                        <button
                          onClick={handleCancelCompanyInfo}
                          className="button secondary"
                          style={{ fontSize: '14px', padding: '10px 20px' }}
                        >
                          {t('cancel') || 'Annuleren'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {activeSection === 'license' && (
                  <div className="card" style={{ marginTop: 0, backgroundColor: 'var(--color-bg-secondary)' }}>
                    <h4 style={{ marginTop: 0, marginBottom: 16 }}>{t('licenseAndDevicesTitle') || 'Licentie & Apparaten'}</h4>
                    <LicenseAndDevices />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {!username && (
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {t('noUserLoggedIn') || 'Er is niemand ingelogd'}
          </p>
        )}
      </div>
    </div>
  );
};

import { useMemo, useState } from 'react';
import { generateGroupAddresses, convertToHierarchicalOverview } from '../generator';
import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../i18n/useTranslation'; // Keep for lang access temporarily

export const Overview = () => {
  const { devices, template, setStep, nameOptions, setNameOptions } = useAppStore();
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [expandedMainGroups, setExpandedMainGroups] = useState<Set<number>>(new Set());
  const [expandedMiddleGroups, setExpandedMiddleGroups] = useState<Set<string>>(new Set());

  const allDevices = useMemo(() => {
    const result: any[] = [];
    Object.values(devices).forEach((deviceList) => {
      result.push(...deviceList);
    });
    return result;
  }, [devices]);

  const rows = useMemo(() => {
    if (!template) return [];
    return generateGroupAddresses(template, allDevices, lang, nameOptions);
  }, [template, allDevices, lang, nameOptions]);

  const hierarchicalOverview = useMemo(() => {
    if (!template || rows.length === 0) return null;
    return convertToHierarchicalOverview(rows, template, lang, allDevices);
  }, [template, rows, lang, allDevices]);

  // Check if all 4 main functions are set to "not used" (enabled === 'none')
  // If so, user can only go back to Template, not to devices
  const allCategoriesNotUsed = useMemo(() => {
    if (!template?.teachByExampleConfig?.categories) return false;
    const config = template.teachByExampleConfig;
    const allCategories = ['switching', 'dimming', 'shading', 'hvac'] as const;
    return allCategories.every(cat => {
      const categoryConfig = config.categories?.[cat];
      if (!categoryConfig) return false; // Category must be present
      const configs = Array.isArray(categoryConfig) ? categoryConfig : [categoryConfig];
      return configs.every(cfg => cfg.enabled === 'none');
    });
  }, [template]);


  return (
    <div className="card">
      <div className="flex-between">
        <h3>{t('overviewTitle')}</h3>
      </div>
      {rows.length > 0 && (
        <>
          <div className="flex" style={{ marginBottom: 8, padding: 12, backgroundColor: 'var(--color-bg-secondary)', borderRadius: 4, gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="small" style={{ fontWeight: 'bold' }}>{t('nameOptionsTitle')}</span>
            <label className="flex" style={{ alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={nameOptions.showRoomAddress}
                onChange={(e) => setNameOptions({ ...nameOptions, showRoomAddress: e.target.checked })}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span className="small">{t('nameOptionsRoomAddress')}</span>
            </label>
            <label className="flex" style={{ alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={nameOptions.showSwitchCode}
                onChange={(e) => setNameOptions({ ...nameOptions, showSwitchCode: e.target.checked })}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span className="small">{t('nameOptionsSwitchCode')}</span>
            </label>
            <label className="flex" style={{ alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={nameOptions.showObjectName}
                onChange={(e) => setNameOptions({ ...nameOptions, showObjectName: e.target.checked })}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span className="small">{t('nameOptionsObjectName')}</span>
            </label>
          </div>
          {!nameOptions.showRoomAddress && (
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: 'var(--color-bg-secondary)', borderRadius: 4 }}>
              <span className="small" style={{ color: 'var(--color-text)' }}>
                {t('nameOptionsRoomAddressWarning')}
              </span>
            </div>
          )}
        </>
      )}
      {rows.length === 0 ? (
        <div className="small danger">{t('noGAsFound')}</div>
      ) : hierarchicalOverview ? (
        <>
          <div className="small" style={{ marginBottom: 8 }}>
            {rows.length} {t('gasGenerated')}
          </div>
          <div style={{ maxHeight: 600, overflow: 'auto', border: '1px solid #e2e8f0', padding: 12 }}>
            {hierarchicalOverview.mainGroups.map((mainGroup) => {
              const isMainExpanded = expandedMainGroups.has(mainGroup.main);
              const toggleMain = () => {
                const newSet = new Set(expandedMainGroups);
                if (isMainExpanded) {
                  newSet.delete(mainGroup.main);
                } else {
                  newSet.add(mainGroup.main);
                }
                setExpandedMainGroups(newSet);
              };

              return (
                <div key={mainGroup.main} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 8,
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                    onClick={toggleMain}
                  >
                    <span style={{ width: 20, textAlign: 'center' }}>
                      {isMainExpanded ? '▼' : '▶'}
                    </span>
                    <span>{mainGroup.main} - {mainGroup.name.charAt(0).toUpperCase() + mainGroup.name.slice(1)}</span>
                  </div>
                  {isMainExpanded && (
                    <div style={{ marginLeft: 28, marginTop: 8 }}>
                      {mainGroup.middleGroups.map((middleGroup) => {
                        const middleKey = `${mainGroup.main}-${middleGroup.middle}`;
                        const isMiddleExpanded = expandedMiddleGroups.has(middleKey);
                        const toggleMiddle = () => {
                          const newSet = new Set(expandedMiddleGroups);
                          if (isMiddleExpanded) {
                            newSet.delete(middleKey);
                          } else {
                            newSet.add(middleKey);
                          }
                          setExpandedMiddleGroups(newSet);
                        };

                        return (
                          <div key={middleKey} style={{ marginBottom: 8 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: 6,
                                backgroundColor: 'var(--color-bg-tertiary)',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                              onClick={toggleMiddle}
                            >
                              <span style={{ width: 20, textAlign: 'center' }}>
                                {isMiddleExpanded ? '▼' : '▶'}
                              </span>
                              <span>{mainGroup.main}/{middleGroup.middle} - {middleGroup.name.charAt(0).toUpperCase() + middleGroup.name.slice(1)}</span>
                            </div>
                            {isMiddleExpanded && (
                              <div style={{ marginLeft: 28, marginTop: 4 }}>
                                <table className="table" style={{ fontSize: '0.9em' }}>
                                  <thead>
                                    <tr>
                                      <th>{t('groupAddress')}</th>
                                      <th>{t('name')}</th>
                                      <th>{t('datapointType')}</th>
                                      <th>{t('comment')}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {middleGroup.addresses.map((addr) => (
                                      <tr key={addr.groupAddress + addr.name}>
                                        <td>{addr.groupAddress}</td>
                                        <td>{addr.name}</td>
                                        <td>{addr.datapointType}</td>
                                        <td>{addr.comment || ''}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex" style={{ marginTop: 16, gap: 8, justifyContent: 'flex-start' }}>
            {allCategoriesNotUsed ? (
              <button className="button ghost" onClick={() => setStep('template')}>
                {t('back')}: {t('stepTemplate')}
              </button>
            ) : (
              <button className="button ghost" onClick={() => setStep('configure')}>
                {t('backToDevices')}
              </button>
            )}
            <button className="button primary" onClick={() => setStep('export')}>
              {t('nextExport')}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="small" style={{ marginBottom: 8 }}>
            {rows.length} {t('gasGenerated')}
          </div>
          <div style={{ maxHeight: 360, overflow: 'auto', border: '1px solid #e2e8f0' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('groupAddress')}</th>
                  <th>{t('name')}</th>
                  <th>{t('datapointType')}</th>
                  <th>{t('comment')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.groupAddress + row.name}>
                    <td>{row.groupAddress}</td>
                    <td>{row.name}</td>
                    <td>{row.datapointType}</td>
                    <td>{row.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex" style={{ marginTop: 16, gap: 8, justifyContent: 'flex-start' }}>
            {allCategoriesNotUsed ? (
              <button className="button ghost" onClick={() => setStep('template')}>
                {t('back')}: {t('stepTemplate')}
              </button>
            ) : (
              <button className="button ghost" onClick={() => setStep('configure')}>
                {t('backToDevices')}
              </button>
            )}
            <button className="button primary" onClick={() => setStep('export')}>
              {t('nextExport')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};


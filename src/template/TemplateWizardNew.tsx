import { useState } from 'react';
import { 
  WizardTemplateConfig, 
  WizardAddressingMode, 
  WizardSwitchConfig,
  WizardDimmerConfig,
  WizardBlindConfig,
  WizardHvacConfig,
  DimmerInheritMode,
  ExtraObjectsStrategy
} from '../types/common';
import { useTranslation } from 'react-i18next';

interface WizardStepProps {
  config: Partial<WizardTemplateConfig>;
  onUpdate: (updates: Partial<WizardTemplateConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Step 1: Algemene instellingen
const GeneralSettingsStep = ({ config, onUpdate, onNext }: WizardStepProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="card">
      <h3>Template Wizard - Algemene instellingen</h3>
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <label className="grid">
          <span className="label">Template naam</span>
          <input
            className="input"
            value={config.templateName || ''}
            onChange={(e) => onUpdate({ templateName: e.target.value })}
            placeholder="Mijn template"
          />
        </label>
        <label className="grid">
          <span className="label">Start kanaalnummer</span>
          <input
            className="input"
            type="number"
            min={1}
            max={255}
            value={config.startChannelNumber || 1}
            onChange={(e) => onUpdate({ startChannelNumber: Number(e.target.value) })}
          />
        </label>
      </div>
      <label className="grid" style={{ marginTop: 12 }}>
        <span className="label">Default verdiepingen (optioneel, komma-gescheiden)</span>
        <input
          className="input"
          value={config.defaultFloors?.join(',') || ''}
          onChange={(e) => {
            const floors = e.target.value
              .split(',')
              .map(f => parseInt(f.trim(), 10))
              .filter(f => !isNaN(f));
            onUpdate({ defaultFloors: floors.length > 0 ? floors : undefined });
          }}
          placeholder="1, 2, 3"
        />
        <span className="small">Laat leeg als verdiepingen per device worden ingevuld</span>
      </label>
      <div className="flex" style={{ marginTop: 16 }}>
        <button className="button primary" onClick={onNext} disabled={!config.templateName}>
          {t('nextConfigureCategory').replace('{category}', t('switch'))}
        </button>
      </div>
    </div>
  );
};

// Step 2: Schakelen configuratie
const SwitchConfigStep = ({ config, onUpdate, onNext, onBack }: WizardStepProps) => {
  const { t } = useTranslation();
  const switchConfig = config.schakelen || { mode: 'A' as WizardAddressingMode };
  
  const [mode, setMode] = useState<WizardAddressingMode>(switchConfig.mode || 'A');
  
  const updateSwitchConfig = (updates: Partial<WizardSwitchConfig>) => {
    onUpdate({
      schakelen: {
        ...switchConfig,
        ...updates
      }
    });
  };
  
  const getPreviewAddress = (): string => {
    if (mode === 'A') {
      const func = switchConfig.functionNumber || 3;
      const onoff = switchConfig.typeGroups?.onoff || 1;
      const sub = switchConfig.startSub || 1;
      return `${func}/${onoff}/${sub + 4} (Aan/Uit), ${func}/${switchConfig.typeGroups?.status || 2}/${sub + 4} (Status)`;
    } else if (mode === 'B') {
      const floor = typeof switchConfig.floor === 'number' ? switchConfig.floor : 3;
      const func = switchConfig.functionNumber || 1;
      const sub = switchConfig.startSub || 1;
      const statusSub = switchConfig.statusStrategy === '+1' ? sub + 1 : sub;
      return `${floor}/${func}/${sub + 4} (Aan/Uit), ${floor}/${func}/${statusSub + 4} (Status)`;
    } else if (mode === 'C') {
      const floor = typeof switchConfig.floor === 'number' ? switchConfig.floor : 3;
      const func = switchConfig.functionNumber || 1;
      const sub = switchConfig.startSub || 1;
      const offset = switchConfig.statusOffset || 100;
      return `${floor}/${func}/${sub + 4} (Aan/Uit), ${floor}/${func}/${sub + 4 + offset} (Status)`;
    }
    return '';
  };
  
  return (
    <div className="card">
      <h3>{t('configureCategory').replace('{category}', t('switch'))}</h3>
      
      <div style={{ marginTop: 16 }}>
        <span className="label">{t('whichStructureDoYouUse')}</span>
        <div className="grid" style={{ marginTop: 8 }}>
          <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="switch-mode"
              value="A"
              checked={mode === 'A'}
              onChange={(e) => {
                setMode('A');
                updateSwitchConfig({ mode: 'A' });
              }}
            />
            <span>MODE A – Functie / Type / Device (default)</span>
          </label>
          <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="switch-mode"
              value="B"
              checked={mode === 'B'}
              onChange={(e) => {
                setMode('B');
                updateSwitchConfig({ mode: 'B' });
              }}
            />
            <span>MODE B – Verdieping / Functie / Device</span>
          </label>
          <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="switch-mode"
              value="C"
              checked={mode === 'C'}
              onChange={(e) => {
                setMode('C');
                updateSwitchConfig({ mode: 'C' });
              }}
            />
            <span>MODE C – Verdieping / Functie / Device + Status offset</span>
          </label>
        </div>
      </div>
      
      {mode === 'A' && (
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <label className="grid">
            <span className="small">Functie groepsnummer</span>
            <input
              className="input"
              type="number"
              min={0}
              max={31}
              value={switchConfig.functionNumber || 3}
              onChange={(e) => updateSwitchConfig({ functionNumber: Number(e.target.value) })}
            />
          </label>
          <label className="grid">
            <span className="small">Middengroep Aan/Uit</span>
            <input
              className="input"
              type="number"
              min={0}
              max={7}
              value={switchConfig.typeGroups?.onoff || 1}
              onChange={(e) => updateSwitchConfig({
                typeGroups: {
                  ...switchConfig.typeGroups,
                  onoff: Number(e.target.value)
                }
              })}
            />
          </label>
          <label className="grid">
            <span className="small">Middengroep Status</span>
            <input
              className="input"
              type="number"
              min={0}
              max={7}
              value={switchConfig.typeGroups?.status || 2}
              onChange={(e) => updateSwitchConfig({
                typeGroups: {
                  ...switchConfig.typeGroups,
                  status: Number(e.target.value)
                }
              })}
            />
          </label>
          <label className="grid">
            <span className="small">Start subgroep</span>
            <input
              className="input"
              type="number"
              min={1}
              max={255}
              value={switchConfig.startSub || 1}
              onChange={(e) => updateSwitchConfig({ startSub: Number(e.target.value) })}
            />
          </label>
        </div>
      )}
      
      {(mode === 'B' || mode === 'C') && (
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <label className="grid">
            <span className="small">Verdieping</span>
            <select
              className="select"
              value={typeof switchConfig.floor === 'number' ? String(switchConfig.floor) : 'variable'}
              onChange={(e) => updateSwitchConfig({
                floor: e.target.value === 'variable' ? 'variable' : Number(e.target.value)
              })}
            >
              <option value="variable">Variabel (per device)</option>
              {[0, 1, 2, 3, 4, 5].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="grid">
            <span className="small">Functie groepsnummer</span>
            <input
              className="input"
              type="number"
              min={0}
              max={31}
              value={switchConfig.functionNumber || 1}
              onChange={(e) => updateSwitchConfig({ functionNumber: Number(e.target.value) })}
            />
          </label>
          <label className="grid">
            <span className="small">Start subgroep</span>
            <input
              className="input"
              type="number"
              min={1}
              max={255}
              value={switchConfig.startSub || 1}
              onChange={(e) => updateSwitchConfig({ startSub: Number(e.target.value) })}
            />
          </label>
          {mode === 'B' && (
            <label className="grid">
              <span className="small">Status strategie</span>
              <select
                className="select"
                value={switchConfig.statusStrategy || '+1'}
                onChange={(e) => updateSwitchConfig({ statusStrategy: e.target.value as '+1' | 'separate' })}
              >
                <option value="+1">+1 (volgende subgroep)</option>
                <option value="separate">Aparte middengroep</option>
              </select>
            </label>
          )}
          {mode === 'C' && (
            <label className="grid">
              <span className="small">Status offset</span>
              <input
                className="input"
                type="number"
                min={1}
                max={255}
                value={switchConfig.statusOffset || 100}
                onChange={(e) => updateSwitchConfig({ statusOffset: Number(e.target.value) })}
              />
            </label>
          )}
        </div>
      )}
      
      <div className="card" style={{ marginTop: 16, backgroundColor: 'var(--color-bg)' }}>
        <strong>Live voorbeeld (device "Eettafel"):</strong>
        <div className="small" style={{ marginTop: 4 }}>
          {getPreviewAddress()}
        </div>
      </div>
      
      <div className="flex" style={{ marginTop: 16 }}>
        <button className="button secondary" onClick={onBack}>
          {t('back')}
        </button>
        <button className="button primary" onClick={onNext}>
          {t('nextConfigureCategory').replace('{category}', t('dimmer'))}
        </button>
      </div>
    </div>
  );
};

// Main wizard component
interface TemplateWizardNewProps {
  onSave?: (config: WizardTemplateConfig) => void;
}

export const TemplateWizardNew = ({ onSave }: TemplateWizardNewProps) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<Partial<WizardTemplateConfig>>({
    templateName: '',
    startChannelNumber: 1
  });
  
  const updateConfig = (updates: Partial<WizardTemplateConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };
  
  const nextStep = () => {
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };
  
  const handleFinalSave = () => {
    if (onSave && config.templateName) {
      onSave(config as WizardTemplateConfig);
    }
  };
  
  return (
    <div>
      {step === 1 && (
        <GeneralSettingsStep
          config={config}
          onUpdate={updateConfig}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {step === 2 && (
        <SwitchConfigStep
          config={config}
          onUpdate={updateConfig}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {/* TODO: Add more steps for Dimmen, Jaloezie, HVAC */}
      {step === 3 && (
        <DimmerConfigStep
          config={config}
          onUpdate={updateConfig}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {step === 4 && (
        <BlindConfigStep
          config={config}
          onUpdate={updateConfig}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {step === 5 && (
        <HvacConfigStep
          config={config}
          onUpdate={updateConfig}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {step === 6 && (
        <ReviewStep
          config={config}
          onUpdate={updateConfig}
          onBack={prevStep}
          onSave={handleFinalSave}
        />
      )}
    </div>
  );
};

// Step 3: Dimmen configuratie
const DimmerConfigStep = ({ config, onUpdate, onNext, onBack }: WizardStepProps) => {
  const { t } = useTranslation();
  const dimmerConfig = config.dimmen || {
    inheritFromSwitching: true,
    inheritMode: 'exact' as DimmerInheritMode,
    alwaysCreateAddresses: true,
    hiddenName: '---'
  };
  
  const [inheritFromSwitching, setInheritFromSwitching] = useState(dimmerConfig.inheritFromSwitching ?? true);
  const [inheritMode, setInheritMode] = useState<DimmerInheritMode>(dimmerConfig.inheritMode || 'exact');
  
  const updateDimmerConfig = (updates: Partial<WizardDimmerConfig>) => {
    onUpdate({
      dimmen: {
        ...dimmerConfig,
        ...updates
      }
    });
  };
  
  return (
    <div className="card">
      <h3>{t('configureCategory').replace('{category}', t('dimmer'))}</h3>
      
      <div style={{ marginTop: 16 }}>
        <span className="label">Wil je voor Dimmen dezelfde groepsadressenstructuur gebruiken als bij Schakelen?</span>
        <div className="grid" style={{ marginTop: 8 }}>
          <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="dimmer-inherit"
              checked={inheritFromSwitching && inheritMode === 'exact'}
              onChange={() => {
                setInheritFromSwitching(true);
                setInheritMode('exact');
                updateDimmerConfig({
                  inheritFromSwitching: true,
                  inheritMode: 'exact',
                  alwaysCreateAddresses: true,
                  hiddenName: '---'
                });
              }}
            />
            <span>Ja – exact dezelfde structuur (adressen met naam "---")</span>
          </label>
          <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="dimmer-inherit"
              checked={inheritFromSwitching && inheritMode === 'extended'}
              onChange={() => {
                setInheritFromSwitching(true);
                setInheritMode('extended');
                updateDimmerConfig({
                  inheritFromSwitching: true,
                  inheritMode: 'extended',
                  alwaysCreateAddresses: true,
                  hiddenName: '---'
                });
              }}
            />
            <span>Ja – dezelfde structuur + extra dim-objecten</span>
          </label>
          <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="dimmer-inherit"
              checked={!inheritFromSwitching}
              onChange={() => {
                setInheritFromSwitching(false);
                updateDimmerConfig({
                  inheritFromSwitching: false,
                  inheritMode: 'none',
                  mode: 'A'
                });
              }}
            />
            <span>Nee – eigen structuur</span>
          </label>
        </div>
      </div>
      
      {inheritFromSwitching && inheritMode === 'extended' && (
        <div className="card" style={{ marginTop: 16, backgroundColor: 'var(--color-bg)' }}>
          <span className="label">Welke dim-objecten wil je toevoegen?</span>
          <div className="grid" style={{ marginTop: 8 }}>
            <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={dimmerConfig.extraObjects?.enabledObjects?.includes('dim waarde') ?? true}
                onChange={(e) => {
                  const current = dimmerConfig.extraObjects?.enabledObjects || [];
                  const updated = e.target.checked
                    ? [...current, 'dim waarde']
                    : current.filter(o => o !== 'dim waarde');
                  updateDimmerConfig({
                    extraObjects: {
                      ...dimmerConfig.extraObjects,
                      enabledObjects: updated,
                      strategy: dimmerConfig.extraObjects?.strategy || 'increment'
                    }
                  });
                }}
              />
              <span>Dim waarde</span>
            </label>
            <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={dimmerConfig.extraObjects?.enabledObjects?.includes('dim status') ?? true}
                onChange={(e) => {
                  const current = dimmerConfig.extraObjects?.enabledObjects || [];
                  const updated = e.target.checked
                    ? [...current, 'dim status']
                    : current.filter(o => o !== 'dim status');
                  updateDimmerConfig({
                    extraObjects: {
                      ...dimmerConfig.extraObjects,
                      enabledObjects: updated,
                      strategy: dimmerConfig.extraObjects?.strategy || 'increment'
                    }
                  });
                }}
              />
              <span>Dim status</span>
            </label>
            <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={dimmerConfig.extraObjects?.enabledObjects?.includes('relatief dimmen') ?? false}
                onChange={(e) => {
                  const current = dimmerConfig.extraObjects?.enabledObjects || [];
                  const updated = e.target.checked
                    ? [...current, 'relatief dimmen']
                    : current.filter(o => o !== 'relatief dimmen');
                  updateDimmerConfig({
                    extraObjects: {
                      ...dimmerConfig.extraObjects,
                      enabledObjects: updated,
                      strategy: dimmerConfig.extraObjects?.strategy || 'increment'
                    }
                  });
                }}
              />
              <span>Relatief dimmen</span>
            </label>
          </div>
          
          <div style={{ marginTop: 16 }}>
            <span className="label">Hoe worden deze berekend?</span>
            <div className="grid" style={{ marginTop: 8 }}>
              <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
                <input
                  type="radio"
                  name="extra-strategy"
                  value="increment"
                  checked={dimmerConfig.extraObjects?.strategy === 'increment'}
                  onChange={(e) => updateDimmerConfig({
                    extraObjects: {
                      ...dimmerConfig.extraObjects,
                      strategy: 'increment'
                    }
                  })}
                />
                <span>+1 opvolgend</span>
              </label>
              <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
                <input
                  type="radio"
                  name="extra-strategy"
                  value="offset"
                  checked={dimmerConfig.extraObjects?.strategy === 'offset'}
                  onChange={(e) => updateDimmerConfig({
                    extraObjects: {
                      ...dimmerConfig.extraObjects,
                      strategy: 'offset',
                      offset: dimmerConfig.extraObjects?.offset || 200
                    }
                  })}
                />
                <span>Offset (bijv. +200)</span>
                {dimmerConfig.extraObjects?.strategy === 'offset' && (
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={255}
                    value={dimmerConfig.extraObjects?.offset || 200}
                    onChange={(e) => updateDimmerConfig({
                      extraObjects: {
                        ...dimmerConfig.extraObjects,
                        offset: Number(e.target.value)
                      }
                    })}
                    style={{ width: 100, marginLeft: 8 }}
                  />
                )}
              </label>
              <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
                <input
                  type="radio"
                  name="extra-strategy"
                  value="middlegroup"
                  checked={dimmerConfig.extraObjects?.strategy === 'middlegroup'}
                  onChange={(e) => updateDimmerConfig({
                    extraObjects: {
                      ...dimmerConfig.extraObjects,
                      strategy: 'middlegroup',
                      middlegroup: dimmerConfig.extraObjects?.middlegroup || 3
                    }
                  })}
                />
                <span>Eigen middengroep (bijv. 3)</span>
                {dimmerConfig.extraObjects?.strategy === 'middlegroup' && (
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={7}
                    value={dimmerConfig.extraObjects?.middlegroup || 3}
                    onChange={(e) => updateDimmerConfig({
                      extraObjects: {
                        ...dimmerConfig.extraObjects,
                        middlegroup: Number(e.target.value)
                      }
                    })}
                    style={{ width: 100, marginLeft: 8 }}
                  />
                )}
              </label>
            </div>
          </div>
        </div>
      )}
      
      {!inheritFromSwitching && (
        <div className="card" style={{ marginTop: 16, backgroundColor: 'var(--color-bg)' }}>
          <span className="label">Eigen structuur (zelfde vragen als bij Schakelen)</span>
          {/* TODO: Reuse SwitchConfigStep logic for own structure */}
        </div>
      )}
      
      <div className="flex" style={{ marginTop: 16 }}>
        <button className="button secondary" onClick={onBack}>
          {t('back')}
        </button>
        <button className="button primary" onClick={onNext}>
          {t('nextConfigureCategory').replace('{category}', t('blind'))}
        </button>
      </div>
    </div>
  );
};

// Step 4: Jaloezie/Rolluik configuratie
const BlindConfigStep = ({ config, onUpdate, onNext, onBack }: WizardStepProps) => {
  const { t } = useTranslation();
  const blindConfig = config.jaloezie || { mode: 'A' as WizardAddressingMode };
  
  const [mode, setMode] = useState<WizardAddressingMode>(blindConfig.mode || 'A');
  
  const updateBlindConfig = (updates: Partial<WizardBlindConfig>) => {
    onUpdate({
      jaloezie: {
        ...blindConfig,
        ...updates
      }
    });
  };
  
  const getPreviewAddress = (): string => {
    if (mode === 'A') {
      const func = blindConfig.functionNumber || 3;
      const updown = blindConfig.typeGroups?.updown || 1;
      const stop = blindConfig.typeGroups?.stop || 2;
      const position = blindConfig.typeGroups?.position || 3;
      const status = blindConfig.typeGroups?.status || 4;
      const sub = blindConfig.startSub || 1;
      return `${func}/${updown}/${sub + 4} (Op/Neer), ${func}/${stop}/${sub + 4} (Stop), ${func}/${position}/${sub + 4} (Positie), ${func}/${status}/${sub + 4} (Status)`;
    } else if (mode === 'B') {
      const floor = typeof blindConfig.floor === 'number' ? blindConfig.floor : 3;
      const func = blindConfig.functionNumber || 1;
      const sub = blindConfig.startSub || 1;
      return `${floor}/${func}/${sub + 4} (Op/Neer), ${floor}/${func}/${sub + 5} (Stop), ${floor}/${func}/${sub + 6} (Positie), ${floor}/${func}/${sub + 7} (Status)`;
    } else if (mode === 'C') {
      const floor = typeof blindConfig.floor === 'number' ? blindConfig.floor : 3;
      const func = blindConfig.functionNumber || 1;
      const sub = blindConfig.startSub || 1;
      const offset = blindConfig.statusOffset || 100;
      return `${floor}/${func}/${sub + 4} (Op/Neer), ${floor}/${func}/${sub + 4 + offset} (Status)`;
    }
    return '';
  };
  
  return (
    <div className="card">
      <h3>{t('configureCategory').replace('{category}', t('blind'))}</h3>
      
      <div style={{ marginTop: 16 }}>
        <span className="label">{t('whichStructureDoYouUse')}</span>
        <div className="grid" style={{ marginTop: 8 }}>
          <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="blind-mode"
              value="A"
              checked={mode === 'A'}
              onChange={(e) => {
                setMode('A');
                updateBlindConfig({ mode: 'A' });
              }}
            />
            <span>MODE A – Functie / Type / Device</span>
          </label>
          <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="blind-mode"
              value="B"
              checked={mode === 'B'}
              onChange={(e) => {
                setMode('B');
                updateBlindConfig({ mode: 'B' });
              }}
            />
            <span>MODE B – Verdieping / Functie / Device</span>
          </label>
          <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="blind-mode"
              value="C"
              checked={mode === 'C'}
              onChange={(e) => {
                setMode('C');
                updateBlindConfig({ mode: 'C' });
              }}
            />
            <span>MODE C – Verdieping / Functie / Device + Status offset</span>
          </label>
        </div>
      </div>
      
      {mode === 'A' && (
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <label className="grid">
            <span className="small">Functie groepsnummer</span>
            <input
              className="input"
              type="number"
              min={0}
              max={31}
              value={blindConfig.functionNumber || 3}
              onChange={(e) => updateBlindConfig({ functionNumber: Number(e.target.value) })}
            />
          </label>
          <label className="grid">
            <span className="small">Middengroep Op/Neer</span>
            <input
              className="input"
              type="number"
              min={0}
              max={7}
              value={blindConfig.typeGroups?.updown || 1}
              onChange={(e) => updateBlindConfig({
                typeGroups: {
                  ...blindConfig.typeGroups,
                  updown: Number(e.target.value)
                }
              })}
            />
          </label>
          <label className="grid">
            <span className="small">Middengroep Stop</span>
            <input
              className="input"
              type="number"
              min={0}
              max={7}
              value={blindConfig.typeGroups?.stop || 2}
              onChange={(e) => updateBlindConfig({
                typeGroups: {
                  ...blindConfig.typeGroups,
                  stop: Number(e.target.value)
                }
              })}
            />
          </label>
          <label className="grid">
            <span className="small">Middengroep Positie</span>
            <input
              className="input"
              type="number"
              min={0}
              max={7}
              value={blindConfig.typeGroups?.position || 3}
              onChange={(e) => updateBlindConfig({
                typeGroups: {
                  ...blindConfig.typeGroups,
                  position: Number(e.target.value)
                }
              })}
            />
          </label>
          <label className="grid">
            <span className="small">Middengroep Status</span>
            <input
              className="input"
              type="number"
              min={0}
              max={7}
              value={blindConfig.typeGroups?.status || 4}
              onChange={(e) => updateBlindConfig({
                typeGroups: {
                  ...blindConfig.typeGroups,
                  status: Number(e.target.value)
                }
              })}
            />
          </label>
          <label className="grid">
            <span className="small">Start subgroep</span>
            <input
              className="input"
              type="number"
              min={1}
              max={255}
              value={blindConfig.startSub || 1}
              onChange={(e) => updateBlindConfig({ startSub: Number(e.target.value) })}
            />
          </label>
        </div>
      )}
      
      {(mode === 'B' || mode === 'C') && (
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <label className="grid">
            <span className="small">Verdieping</span>
            <select
              className="select"
              value={typeof blindConfig.floor === 'number' ? String(blindConfig.floor) : 'variable'}
              onChange={(e) => updateBlindConfig({
                floor: e.target.value === 'variable' ? 'variable' : Number(e.target.value)
              })}
            >
              <option value="variable">Variabel (per device)</option>
              {[0, 1, 2, 3, 4, 5].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="grid">
            <span className="small">Functie groepsnummer</span>
            <input
              className="input"
              type="number"
              min={0}
              max={31}
              value={blindConfig.functionNumber || 1}
              onChange={(e) => updateBlindConfig({ functionNumber: Number(e.target.value) })}
            />
          </label>
          <label className="grid">
            <span className="small">Start subgroep</span>
            <input
              className="input"
              type="number"
              min={1}
              max={255}
              value={blindConfig.startSub || 1}
              onChange={(e) => updateBlindConfig({ startSub: Number(e.target.value) })}
            />
          </label>
          {mode === 'B' && (
            <label className="grid">
              <span className="small">Status strategie</span>
              <select
                className="select"
                value={blindConfig.statusStrategy || '+1'}
                onChange={(e) => updateBlindConfig({ statusStrategy: e.target.value as '+1' | 'separate' })}
              >
                <option value="+1">+1 (volgende subgroep)</option>
                <option value="separate">Aparte middengroep</option>
              </select>
            </label>
          )}
          {mode === 'C' && (
            <label className="grid">
              <span className="small">Status offset</span>
              <input
                className="input"
                type="number"
                min={1}
                max={255}
                value={blindConfig.statusOffset || 100}
                onChange={(e) => updateBlindConfig({ statusOffset: Number(e.target.value) })}
              />
            </label>
          )}
        </div>
      )}
      
      <div className="card" style={{ marginTop: 16, backgroundColor: 'var(--color-bg)' }}>
        <strong>Live voorbeeld (device "Zonwering"):</strong>
        <div className="small" style={{ marginTop: 4 }}>
          {getPreviewAddress()}
        </div>
      </div>
      
      <div className="flex" style={{ marginTop: 16 }}>
        <button className="button secondary" onClick={onBack}>
          {t('back')}
        </button>
        <button className="button primary" onClick={onNext}>
          {t('nextConfigureCategory').replace('{category}', t('hvac'))}
        </button>
      </div>
    </div>
  );
};

// Step 5: Klimaat/HVAC configuratie
const HvacConfigStep = ({ config, onUpdate, onNext, onBack }: WizardStepProps) => {
  const { t } = useTranslation();
  const hvacConfig = config.hvac || { 
    mode: 'B' as WizardAddressingMode,
    zones: [],
    zoneObjects: ['setpoint', 'actual temp', 'mode', 'fan speed', 'status']
  };
  
  const [mode, setMode] = useState<WizardAddressingMode>(hvacConfig.mode || 'B');
  const [zones, setZones] = useState<Array<{ name: string; roomAddress?: string }>>(hvacConfig.zones || []);
  const [zoneObjects, setZoneObjects] = useState<string[]>(hvacConfig.zoneObjects || ['setpoint', 'actual temp', 'mode', 'fan speed', 'status']);
  
  const updateHvacConfig = (updates: Partial<WizardHvacConfig>) => {
    onUpdate({
      hvac: {
        ...hvacConfig,
        ...updates
      }
    });
  };
  
  const addZone = () => {
    const newZones = [...zones, { name: `Zone ${zones.length + 1}` }];
    setZones(newZones);
    updateHvacConfig({ zones: newZones });
  };
  
  const updateZone = (index: number, updates: Partial<{ name: string; roomAddress?: string }>) => {
    const newZones = [...zones];
    newZones[index] = { ...newZones[index], ...updates };
    setZones(newZones);
    updateHvacConfig({ zones: newZones });
  };
  
  const removeZone = (index: number) => {
    const newZones = zones.filter((_, i) => i !== index);
    setZones(newZones);
    updateHvacConfig({ zones: newZones });
  };
  
  const getPreviewAddress = (zoneName: string = 'Woonkamer'): string => {
    if (mode === 'A') {
      const func = hvacConfig.functionNumber || 4;
      const sub = hvacConfig.startSub || 1;
      return `${func}/1/${sub} (${zoneName} Setpoint), ${func}/1/${sub + 100} (${zoneName} Status)`;
    } else if (mode === 'B') {
      const floor = typeof hvacConfig.floor === 'number' ? hvacConfig.floor : 3;
      const func = hvacConfig.functionNumber || 4;
      const sub = hvacConfig.startSub || 1;
      return `${floor}/${func}/${sub} (${zoneName} Setpoint), ${floor}/${func}/${sub + 1} (${zoneName} Status)`;
    } else if (mode === 'C') {
      const floor = typeof hvacConfig.floor === 'number' ? hvacConfig.floor : 3;
      const func = hvacConfig.functionNumber || 4;
      const sub = hvacConfig.startSub || 1;
      const offset = hvacConfig.statusOffset || 100;
      return `${floor}/${func}/${sub} (${zoneName} Setpoint), ${floor}/${func}/${sub + offset} (${zoneName} Status)`;
    }
    return '';
  };
  
  return (
    <div className="card">
      <h3>{t('configureCategory').replace('{category}', t('hvac'))}</h3>
      
      <div style={{ marginTop: 16 }}>
        <span className="label">{t('whichStructureDoYouUse')}</span>
        <div className="grid" style={{ marginTop: 8 }}>
          <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="hvac-mode"
              value="A"
              checked={mode === 'A'}
              onChange={(e) => {
                setMode('A');
                updateHvacConfig({ mode: 'A' });
              }}
            />
            <span>MODE A – Functie / Type / Device</span>
          </label>
          <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="hvac-mode"
              value="B"
              checked={mode === 'B'}
              onChange={(e) => {
                setMode('B');
                updateHvacConfig({ mode: 'B' });
              }}
            />
            <span>MODE B – Verdieping / Functie / Device</span>
          </label>
          <label className="flex" style={{ alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="hvac-mode"
              value="C"
              checked={mode === 'C'}
              onChange={(e) => {
                setMode('C');
                updateHvacConfig({ mode: 'C' });
              }}
            />
            <span>MODE C – Verdieping / Functie / Device + Status offset</span>
          </label>
        </div>
      </div>
      
      {(mode === 'B' || mode === 'C') && (
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <label className="grid">
            <span className="small">Verdieping</span>
            <select
              className="select"
              value={typeof hvacConfig.floor === 'number' ? String(hvacConfig.floor) : 'variable'}
              onChange={(e) => updateHvacConfig({
                floor: e.target.value === 'variable' ? 'variable' : Number(e.target.value)
              })}
            >
              <option value="variable">Variabel (per zone)</option>
              {[0, 1, 2, 3, 4, 5].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="grid">
            <span className="small">Functie groepsnummer</span>
            <input
              className="input"
              type="number"
              min={0}
              max={31}
              value={hvacConfig.functionNumber || 4}
              onChange={(e) => updateHvacConfig({ functionNumber: Number(e.target.value) })}
            />
          </label>
          <label className="grid">
            <span className="small">Start subgroep</span>
            <input
              className="input"
              type="number"
              min={1}
              max={255}
              value={hvacConfig.startSub || 1}
              onChange={(e) => updateHvacConfig({ startSub: Number(e.target.value) })}
            />
          </label>
          {mode === 'B' && (
            <label className="grid">
              <span className="small">Status strategie</span>
              <select
                className="select"
                value={hvacConfig.statusStrategy || '+1'}
                onChange={(e) => updateHvacConfig({ statusStrategy: e.target.value as '+1' | 'separate' })}
              >
                <option value="+1">+1 (volgende subgroep)</option>
                <option value="separate">Aparte middengroep</option>
              </select>
            </label>
          )}
          {mode === 'C' && (
            <label className="grid">
              <span className="small">Status offset</span>
              <input
                className="input"
                type="number"
                min={1}
                max={255}
                value={hvacConfig.statusOffset || 100}
                onChange={(e) => updateHvacConfig({ statusOffset: Number(e.target.value) })}
              />
            </label>
          )}
        </div>
      )}
      
      <div className="card" style={{ marginTop: 16, backgroundColor: 'var(--color-bg)' }}>
        <span className="label">Welke objecten per zone genereren?</span>
        <div className="grid" style={{ marginTop: 8 }}>
          {['setpoint', 'actual temp', 'mode', 'fan speed', 'status'].map(obj => (
            <label key={obj} className="flex" style={{ alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={zoneObjects.includes(obj)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...zoneObjects, obj]
                    : zoneObjects.filter(o => o !== obj);
                  setZoneObjects(updated);
                  updateHvacConfig({ zoneObjects: updated });
                }}
              />
              <span>{obj === 'actual temp' ? 'Gemeten temperatuur' : obj === 'fan speed' ? 'Ventilator snelheid' : obj}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="card" style={{ marginTop: 16, backgroundColor: 'var(--color-bg)' }}>
        <div className="flex-between">
          <span className="label">Zones</span>
          <button className="button ghost" onClick={addZone}>
            + Zone toevoegen
          </button>
        </div>
        {zones.length === 0 ? (
          <div className="small" style={{ marginTop: 8, fontStyle: 'italic' }}>
            Geen zones toegevoegd. Zones kunnen later in de device configuratie worden toegevoegd.
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            {zones.map((zone, index) => (
              <div key={index} className="card" style={{ marginTop: 8 }}>
                <div className="grid grid-2">
                  <label className="grid">
                    <span className="small">Zone naam</span>
                    <input
                      className="input"
                      value={zone.name}
                      onChange={(e) => updateZone(index, { name: e.target.value })}
                    />
                  </label>
                  <label className="grid">
                    <span className="small">Verdieping.Ruimte (optioneel)</span>
                    <input
                      className="input"
                      value={zone.roomAddress || ''}
                      onChange={(e) => updateZone(index, { roomAddress: e.target.value || undefined })}
                      placeholder="3.1"
                    />
                  </label>
                </div>
                <button
                  className="button ghost"
                  onClick={() => removeZone(index)}
                  style={{ marginTop: 8, color: 'var(--color-danger)' }}
                >
                  Verwijder zone
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="card" style={{ marginTop: 16, backgroundColor: 'var(--color-bg)' }}>
        <strong>Live voorbeeld:</strong>
        {zones.length > 0 ? (
          zones.map((zone, index) => (
            <div key={index} className="small" style={{ marginTop: 4 }}>
              Zone: {zone.name} → {getPreviewAddress(zone.name)}
            </div>
          ))
        ) : (
          <div className="small" style={{ marginTop: 4 }}>
            Zone: Woonkamer → {getPreviewAddress('Woonkamer')}
          </div>
        )}
      </div>
      
      <div className="flex" style={{ marginTop: 16 }}>
        <button className="button secondary" onClick={onBack}>
          {t('back')}
        </button>
        <button className="button primary" onClick={onNext}>
          Volgende: Overzicht
        </button>
      </div>
    </div>
  );
};

// Step 6: Review en opslaan
interface ReviewStepProps extends WizardStepProps {
  onSave?: () => void;
}

const ReviewStep = ({ config, onUpdate, onBack, onSave }: ReviewStepProps) => {
  const { t } = useTranslation();
  
  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };
  
  return (
    <div className="card">
      <h3>Overzicht en Opslaan</h3>
      
      <div style={{ marginTop: 16 }}>
        <h4>Template: {config.templateName}</h4>
        <div className="small" style={{ marginTop: 8 }}>
          Start kanaalnummer: {config.startChannelNumber || 1}
        </div>
        {config.defaultFloors && config.defaultFloors.length > 0 && (
          <div className="small">
            Default verdiepingen: {config.defaultFloors.join(', ')}
          </div>
        )}
      </div>
      
      <div className="card" style={{ marginTop: 16, backgroundColor: 'var(--color-bg)' }}>
        <h4>Schakelen</h4>
        {config.schakelen && (
          <div className="small">
            Mode: {config.schakelen.mode}
            {config.schakelen.functionNumber && `, Functie: ${config.schakelen.functionNumber}`}
            {config.schakelen.startSub && `, Start: ${config.schakelen.startSub}`}
          </div>
        )}
      </div>
      
      <div className="card" style={{ marginTop: 16, backgroundColor: 'var(--color-bg)' }}>
        <h4>Dimmen</h4>
        {config.dimmen && (
          <div className="small">
            Erft van Schakelen: {config.dimmen.inheritFromSwitching ? 'Ja' : 'Nee'}
            {config.dimmen.inheritMode && ` (${config.dimmen.inheritMode})`}
            {!config.dimmen.inheritFromSwitching && config.dimmen.mode && `, Mode: ${config.dimmen.mode}`}
          </div>
        )}
      </div>
      
      <div className="card" style={{ marginTop: 16, backgroundColor: 'var(--color-bg)' }}>
        <h4>Jaloezie</h4>
        {config.jaloezie && (
          <div className="small">
            Mode: {config.jaloezie.mode}
            {config.jaloezie.functionNumber && `, Functie: ${config.jaloezie.functionNumber}`}
          </div>
        )}
      </div>
      
      <div className="card" style={{ marginTop: 16, backgroundColor: 'var(--color-bg)' }}>
        <h4>Klimaat</h4>
        {config.hvac && (
          <div className="small">
            Mode: {config.hvac.mode}
            {config.hvac.functionNumber && `, Functie: ${config.hvac.functionNumber}`}
            {config.hvac.zones && config.hvac.zones.length > 0 && `, Zones: ${config.hvac.zones.length}`}
          </div>
        )}
      </div>
      
      <div className="flex" style={{ marginTop: 16 }}>
        <button className="button secondary" onClick={onBack}>
          {t('back')}
        </button>
        <button className="button primary" onClick={handleSave}>
          Opslaan en Template Activeren
        </button>
      </div>
    </div>
  );
};

























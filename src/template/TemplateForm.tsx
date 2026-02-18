import { useEffect, useState } from 'react';
import { TemplateConfig } from '../types/common';
import { defaultAddressTemplate, defaultNameTemplate, useAppStore } from '../store';
import { useTranslation } from 'react-i18next';

const nowIso = () => new Date().toISOString();

export const TemplateForm = () => {
  const { template, setTemplate, setStep } = useAppStore();
  const { t } = useTranslation();
  const [name, setName] = useState(template?.name ?? 'Project template');
  const [pattern, setPattern] = useState(
    template?.nameTemplate.pattern ?? defaultNameTemplate.pattern
  );
  const [datapoint, setDatapoint] = useState(
    template?.addressTemplate.datapointType ?? defaultAddressTemplate.datapointType
  );
  const [comment, setComment] = useState(
    template?.addressTemplate.commentTemplate ?? defaultAddressTemplate.commentTemplate
  );
  const [structure, setStructure] = useState(
    template?.addressTemplate.addressStructure ?? defaultAddressTemplate.addressStructure
  );

  useEffect(() => {
    if (template) return;
    const first: TemplateConfig = {
      name: 'Project template',
      nameTemplate: {
        ...defaultNameTemplate,
        defaultOrder: [...defaultNameTemplate.defaultOrder]
      },
      addressTemplate: defaultAddressTemplate,
      createdAt: nowIso()
    };
    setTemplate(first);
  }, [template, setTemplate]);

  const save = () => {
    const cfg: TemplateConfig = {
      name,
      nameTemplate: {
        pattern,
        defaultOrder: [...defaultNameTemplate.defaultOrder]
      },
      addressTemplate: {
        ...defaultAddressTemplate,
        addressStructure: structure,
        datapointType: datapoint,
        commentTemplate: comment
      },
      createdAt: nowIso()
    };
    setTemplate(cfg);
    setStep('configure');
  };

  return (
    <div className="card">
      <div className="flex-between">
        <h3>1) {t('templateBuilder')}</h3>
        <span className="pill">{t('save')}</span>
      </div>
      <div className="grid grid-2">
        <label className="grid">
          <span className="label">{t('templateName')}</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('templateName')}
          />
        </label>
        <label className="grid">
          <span className="label">{t('addressStructure')}</span>
          <select
            className="select"
            value={structure}
            onChange={(e) => setStructure(e.target.value as 'two-level' | 'three-level')}
          >
            <option value="two-level">{t('twoLevel')}</option>
            <option value="three-level">{t('threeLevel')}</option>
          </select>
        </label>
      </div>
      <label className="grid" style={{ marginTop: 10 }}>
        <span className="label">{t('namePattern')}</span>
        <input
          className="input"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder={t('namePatternInfo')}
        />
        <span className="small">
          Tokens: &lt;floor&gt;, &lt;roomNumber&gt;, &lt;roomName&gt;, &lt;fixture&gt;, &lt;function&gt;
        </span>
      </label>
      <div className="grid grid-2" style={{ marginTop: 10 }}>
        <label className="grid">
          <span className="label">{t('datapointType')}</span>
          <input
            className="input"
            value={datapoint}
            onChange={(e) => setDatapoint(e.target.value)}
          />
        </label>
        <label className="grid">
          <span className="label">{t('commentPattern')}</span>
          <input
            className="input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('commentPatternHint')}
          />
          <span className="small">Tokens: &lt;physical&gt;, &lt;channel&gt;</span>
        </label>
      </div>
      <div className="flex" style={{ marginTop: 12 }}>
        <button className="button secondary" onClick={() => setStep('devices')}>
          {t('back')}
        </button>
        <button className="button primary" onClick={save}>
          {t('saveAndContinue')}
        </button>
      </div>
    </div>
  );
};


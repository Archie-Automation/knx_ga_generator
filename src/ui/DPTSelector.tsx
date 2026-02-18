import { useState, useMemo, useEffect, useRef } from 'react';
import { DPT_LIST } from '../i18n/dpt-list';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../i18n/useTranslation'; // Keep for lang access temporarily

interface DPTSelectorProps {
  value: string;
  onChange: (dpt: string) => void;
  placeholder?: string;
  allowedDPTs?: string[]; // Optional list of allowed DPT codes (e.g., ['DPT5.001', 'DPT1.001'])
}

export const DPTSelector = ({ value, onChange, placeholder, allowedDPTs }: DPTSelectorProps) => {
  const { lang } = useLanguage();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const placeholderText = placeholder || t('selectDPT');

  const filteredDPTs = useMemo(() => {
    // First filter by allowedDPTs if provided
    let availableDPTs = DPT_LIST;
    if (allowedDPTs && allowedDPTs.length > 0) {
      availableDPTs = DPT_LIST.filter(dpt => allowedDPTs.includes(dpt.code));
    }
    
    // Then filter by search term if provided
    if (!search.trim()) return availableDPTs;
    const lowerSearch = search.toLowerCase();
    return availableDPTs.filter(
      (dpt) =>
        dpt.code.toLowerCase().includes(lowerSearch) ||
        dpt.name[lang].toLowerCase().includes(lowerSearch)
    );
  }, [search, lang, allowedDPTs]);

  const selectedDPT = DPT_LIST.find((d) => d.code === value);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearch('');
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      // Use setTimeout to avoid immediate closing when opening
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleDPTSelect = (dptCode: string) => {
    onChange(dptCode);
    setIsOpen(false);
    setSearch('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSearch(e.target.value);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        className="input"
        type="text"
        value={selectedDPT ? `${selectedDPT.code} – ${selectedDPT.name[lang]}` : value}
        placeholder={placeholderText}
        readOnly
        onClick={handleInputClick}
        style={{ cursor: 'pointer', padding: '4px 8px' }}
      />
      {isOpen && (
        <div
          ref={dropdownRef}
          className="card"
          onClick={handleDropdownClick}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 10000,
            maxHeight: '300px',
            overflow: 'auto',
            marginTop: 4,
            padding: 0,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <input
            className="input"
            type="text"
            placeholder={t('searchDPT')}
            value={search}
            onChange={handleSearchChange}
            onClick={handleDropdownClick}
            style={{ margin: 8, width: 'calc(100% - 16px)' }}
            autoFocus
          />
          <div style={{ maxHeight: '250px', overflow: 'auto' }}>
              {filteredDPTs.map((dpt) => (
                <div
                  key={dpt.code}
                  onClick={() => handleDPTSelect(dpt.code)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    backgroundColor: value === dpt.code ? 'var(--color-selected)' : 'transparent',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text)'
                  }}
                  onMouseEnter={(e) => {
                    if (value !== dpt.code) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== dpt.code) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ fontSize: '14px' }}>
                    <span style={{ fontWeight: 'bold' }}>{dpt.code}</span>
                    {' – '}
                    <span>{dpt.name[lang]}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};


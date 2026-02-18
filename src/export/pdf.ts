// PDF Generator for Installer PDF
// Requires: npm install jspdf
// Usage: import { generateInstallerPDF } from './export/pdf';

import jsPDF from 'jspdf';
import pkg from '../../package.json';

const APP_VERSION = pkg.version ?? '0.0.0';
import { GroupAddressRow, AnyDevice, SwitchDevice, DimmerDevice, BlindDevice, CompanyInfo, InstallerPDFOptions } from '../types/common';
import { getTranslation } from '../i18n/translations';
import type { Language } from '../i18n/translations';
import { generateChannelName } from '../utils/channelName';
import { translateUserInput, getStandardUserInput } from '../i18n/userInputTranslations';

// Note: This is a placeholder. User needs to install jspdf: npm install jspdf
// Then uncomment the actual implementation below

// Helper to translate room name for PDF output based on language
const translateRoomNameForPdf = (roomName: string, lang: Language): string => {
  if (!roomName?.trim()) return roomName;
  const standard = getStandardUserInput(roomName, 'roomName') || roomName;
  return translateUserInput(standard, lang, 'roomName');
};

// Helper function to build lamp name: "verdieping.ruimte nummer ruimte naam type lamp schakelcode"
// Example: roomAddress "3.1", roomName "Woonkamer", fixture "Plafondlamp", switchCode "U3" -> "3.1 Woonkamer Plafondlamp U3"
const buildLampName = (roomAddress: string, roomName: string, fixture: string, switchCode?: string): string => {
  // Keep roomAddress as is (with dot separator)
  const addressPart = roomAddress || '';
  const parts = [addressPart, roomName, fixture, switchCode].filter(p => p && p.trim());
  return parts.join(' ');
};

// Helper function to get user logo from localStorage
const getUserLogo = (username: string): string | null => {
  try {
    const logoKey = `knx-logo-${username}`;
    return localStorage.getItem(logoKey);
  } catch (err) {
    console.error('Failed to get user logo', err);
    return null;
  }
};

// Helper function to get user company info from localStorage
const getUserCompanyInfo = (username: string): CompanyInfo | null => {
  try {
    const companyKey = `knx-company-${username}`;
    const data = localStorage.getItem(companyKey);
    if (!data) return null;
    return JSON.parse(data) as CompanyInfo;
  } catch (err) {
    console.error('Failed to get company info', err);
    return null;
  }
};

// Helper function to convert SVG to data URL
const svgToDataUrl = (svg: string): string => {
  // Clean up SVG and ensure it's properly formatted
  const cleanedSvg = svg.replace(/\s+/g, ' ').trim();
  const encoded = encodeURIComponent(cleanedSvg);
  return 'data:image/svg+xml;charset=utf-8,' + encoded;
};

// Email envelope icon SVG
const emailIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
  <polyline points="22,6 12,13 2,6"/>
</svg>`;

// Website globe icon SVG
const websiteIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <line x1="2" y1="12" x2="22" y2="12"/>
  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
</svg>`;

// Helper function to add icon to PDF using canvas
const addIconToPDF = async (doc: any, iconSvg: string, x: number, y: number, size: number = 4): Promise<void> => {
  try {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = size * 10; // Higher resolution for better quality
      canvas.height = size * 10;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          doc.addImage(dataUrl, 'PNG', x, y - size, size, size);
          resolve();
        } catch (err) {
          console.error('Failed to draw icon to canvas', err);
          reject(err);
        }
      };
      img.onerror = (err) => {
        console.error('Failed to load icon image', err);
        reject(err);
      };
      
      const dataUrl = svgToDataUrl(iconSvg);
      img.src = dataUrl;
    });
  } catch (err) {
    console.error('Failed to add icon to PDF', err);
  }
};

/** Returns the PDF as a Blob for saving via save dialog, or null on error. */
export const generateInstallerPDF = async (
  devices: AnyDevice[],
  _gaRows: GroupAddressRow[],
  lang: Language,
  projectName?: string,
  username?: string,
  options?: InstallerPDFOptions
): Promise<Blob | null> => {
  try {
    const t = getTranslation(lang);
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    
    // Get company info if available
    const companyInfo = username ? getUserCompanyInfo(username) : null;
    const hasCompanyInfo = companyInfo && (
      companyInfo.companyName || 
      companyInfo.address || 
      companyInfo.postalCode || 
      companyInfo.city || 
      companyInfo.phone || 
      companyInfo.email || 
      companyInfo.website
    );
    
    // Header section - left side
    const headerStartY = yPos;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(t.installerPDF, margin, yPos);
    yPos += 8;
    
    if (projectName) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`${t.project || 'Project'}: ${projectName}`, margin, yPos);
      yPos += 10;
    } else {
      yPos += 5;
    }
    
    // Calculate logo dimensions first if available
    let logoHeight = 0;
    let logoWidth = 0;
    let logoDataUrl: string | null = null;
    if (username) {
      logoDataUrl = getUserLogo(username);
      if (logoDataUrl && logoDataUrl.trim() && logoDataUrl.startsWith('data:image/')) {
        try {
          // Calculate logo dimensions (max width 40mm, maintain aspect ratio)
          const maxLogoWidth = 40;
          const maxLogoHeight = 20;
          
          // Create an image element to get dimensions
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = () => {
              // Validate image loaded successfully
              if (img.width === 0 || img.height === 0) {
                reject(new Error('Invalid image dimensions'));
                return;
              }
              resolve(undefined);
            };
            img.onerror = (err) => {
              console.error('Image load error:', err);
              reject(new Error('Failed to load image'));
            };
            img.src = logoDataUrl;
          });
          
          // Calculate dimensions maintaining aspect ratio
          logoWidth = maxLogoWidth;
          let logoHeightCalc = (img.height / img.width) * logoWidth;
          
          if (logoHeightCalc > maxLogoHeight) {
            logoHeightCalc = maxLogoHeight;
            logoWidth = (img.width / img.height) * logoHeightCalc;
          }
          
          logoHeight = logoHeightCalc;
        } catch (err) {
          console.error('Failed to calculate logo dimensions:', err);
          logoDataUrl = null; // Don't use logo if we can't calculate dimensions
        }
      } else if (logoDataUrl && logoDataUrl.trim()) {
        console.warn('Invalid logo format in storage:', logoDataUrl.substring(0, 50));
        logoDataUrl = null;
      }
    }
    
    // Company info section (if available) - aligned with logo
    const companyInfoStartY = yPos;
    let companyInfoHeight = 0;
    let companyNameEndY = companyInfoStartY;
    let emailY = companyInfoStartY;
    
    if (hasCompanyInfo) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (companyInfo.companyName) {
        doc.setFont('helvetica', 'bold');
        doc.text(companyInfo.companyName, margin, yPos);
        doc.setFont('helvetica', 'normal');
        companyNameEndY = yPos + 6; // End of company name line
        yPos += 6;
      }
      
      // Address line
      if (companyInfo.address) {
        doc.text(companyInfo.address, margin, yPos);
        yPos += 6;
      }
      
      // Postal code and city on separate line
      if (companyInfo.postalCode || companyInfo.city) {
        const postalCity = [companyInfo.postalCode, companyInfo.city].filter(Boolean).join(' ');
        if (postalCity) {
          doc.text(postalCity, margin, yPos);
          yPos += 6;
        }
      }
      
      // Contact info with icons
      doc.setFontSize(9);
      const iconSize = 4;
      const iconSpacing = 6;
      
      if (companyInfo.phone) {
        doc.text(`Tel: ${companyInfo.phone}`, margin, yPos);
        yPos += 5;
      }
      
      if (companyInfo.email) {
        emailY = yPos; // Store email Y position for logo alignment
        await addIconToPDF(doc, emailIconSvg, margin, yPos, iconSize);
        doc.text(companyInfo.email, margin + iconSpacing, yPos);
        yPos += 5;
      }
      
      if (companyInfo.website) {
        await addIconToPDF(doc, websiteIconSvg, margin, yPos, iconSize);
        doc.text(companyInfo.website, margin + iconSpacing, yPos);
        yPos += 5;
      }
      
      doc.setFontSize(10);
      companyInfoHeight = yPos - companyInfoStartY;
    }
    
    // Add logo aligned with company info (or header if no company info)
    if (logoDataUrl && logoHeight > 0) {
      try {
        // Determine image format from data URL
        let format: 'PNG' | 'JPEG' = 'PNG';
        if (logoDataUrl.startsWith('data:image/jpeg') || logoDataUrl.startsWith('data:image/jpg')) {
          format = 'JPEG';
        }
        
        // Position logo vertically centered between company name and email
        // If company info exists and has email, center logo between company name top and email
        // Otherwise, align top of logo with top of company info or header
        let logoY: number;
        if (hasCompanyInfo && companyInfo.email) {
          // Center logo vertically between company name top and email
          const top = companyInfoStartY;
          const bottom = emailY;
          const center = (top + bottom) / 2;
          logoY = center - (logoHeight / 2);
        } else if (hasCompanyInfo) {
          // No email, align top of logo with top of company info
          logoY = companyInfoStartY;
        } else {
          // No company info, align with header
          logoY = headerStartY;
        }
        
        // Add logo to the right, aligned with company info
        doc.addImage(logoDataUrl, format, pageWidth - margin - logoWidth, logoY, logoWidth, logoHeight);
        
        // Adjust yPos to account for the taller of logo or company info
        if (hasCompanyInfo) {
          yPos = Math.max(companyInfoStartY + companyInfoHeight, logoY + logoHeight) + 5;
        } else {
          yPos = Math.max(yPos, logoY + logoHeight) + 5;
        }
      } catch (err) {
        console.error('Failed to add logo to PDF:', err);
        // Continue without logo
        if (hasCompanyInfo) {
          yPos = companyInfoStartY + companyInfoHeight + 5;
        }
      }
    } else {
      // No logo, just add spacing after company info
      if (hasCompanyInfo) {
        yPos = companyInfoStartY + companyInfoHeight + 5;
      }
    }
    
    // Draw separator line after header
    yPos += 3;
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    // Filter only actuators (switch, dimmer, blind - exclude HVAC and central)
    const actuators = devices.filter(
      (device): device is SwitchDevice | DimmerDevice | BlindDevice =>
        device.category === 'switch' || device.category === 'dimmer' || device.category === 'blind'
    );
    
    if (actuators.length === 0) {
      doc.setFontSize(12);
      doc.text('Geen actuatoren gevonden.', margin, yPos);
      yPos += 10;
      // Continue to add floor distributor and room sections if provided
    } else {
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Sort actuators by physical address
    const sortedActuators = [...actuators].sort((a, b) => {
      const aParts = a.physicalAddress.split('.').map(Number);
      const bParts = b.physicalAddress.split('.').map(Number);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] ?? 0;
        const bVal = bParts[i] ?? 0;
        if (aVal !== bVal) return aVal - bVal;
      }
      return 0;
    });
    
    // Display each actuator with its outputs
    sortedActuators.forEach(actuator => {
      if ('outputs' in actuator && actuator.outputs && actuator.outputs.length > 0) {
        // Check if we need a new page before adding actuator info
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        
        const manufacturer = actuator.manufacturer || 'N/A';
        const model = actuator.model || 'N/A';
        const channelCount = actuator.channelCount || actuator.outputs.length;
        const physicalAddr = actuator.physicalAddress;
        
        // Actuator header line: Physical Address | Manufacturer Model (Channel Count)
        // Use singular form when channelCount is 1, plural otherwise
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        const channelLabel = channelCount === 1 
          ? (t.channel || 'kanaal') 
          : (t.channels || 'kanalen');
        const actuatorInfo = `${physicalAddr} | ${manufacturer} ${model} (${channelCount} ${channelLabel})`;
        doc.text(actuatorInfo, margin, yPos);
        yPos += 8;
        
        // Draw line under actuator header
        doc.setLineWidth(0.5);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
        yPos += 5;
        
        // Table header for outputs - better alignment
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const outputLabel = t.output ?? 'Kanaal';
        const channelColX = margin + 5;
        const lampColX = margin + 50;
        doc.text(outputLabel, channelColX, yPos);
        doc.text('Lamp', lampColX, yPos);
        yPos += 6;
        
        // Draw header line for outputs
        doc.setLineWidth(0.3);
        doc.line(channelColX, yPos - 2, pageWidth - margin, yPos - 2);
        yPos += 4;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        // Display all outputs for this actuator
        actuator.outputs.forEach((output) => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
            // Redraw output header on new page
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(outputLabel, channelColX, yPos);
            doc.text('Lamp', lampColX, yPos);
            yPos += 6;
            doc.setLineWidth(0.3);
            doc.line(channelColX, yPos - 2, pageWidth - margin, yPos - 2);
            yPos += 4;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
          }
          
          // Channel name - with proper text wrapping if needed
          const channelName = output.channelName || 'N/A';
          doc.text(channelName, channelColX, yPos);
          
          // Lamp name: "verdieping.ruimte nummer ruimte naam type lamp schakelcode"
          const lampName = buildLampName(
            output.roomAddress || '',
            output.roomName || '',
            output.fixture || '',
            output.switchCode
          );
          // Use splitTextToSize for long lamp names to prevent overflow
          const maxLampWidth = pageWidth - margin - lampColX - 5;
          const lampLines = doc.splitTextToSize(lampName || 'N/A', maxLampWidth);
          doc.text(lampLines, lampColX, yPos);
          
          yPos += Math.max(6, lampLines.length * 6);
        });
        
        // Add spacing after actuator block
        yPos += 5;
      }
    });
    }

    // Floor distributor channel distribution section (actuator-based)
    const floorDistributorActuators = options?.floorDistributorActuators;
    const floorDistributorMode = options?.floorDistributorMode;
    if (floorDistributorActuators && floorDistributorActuators.length > 0 && floorDistributorMode) {
      const hasAnyData = floorDistributorActuators.some(
        (a) => a.manufacturer?.trim() || a.physicalAddress?.trim() || a.position?.trim() || a.channels.some((c) => c.zoneId)
      );
      if (hasAnyData) {
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = 20;
        }
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(t.installerPdfFloorDistributorSection ?? 'Kanaalverdeling vloerverdeler(s)', margin, yPos);
        yPos += 8;
        doc.setLineWidth(0.5);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const climateZones = options?.climateZones ?? [];
        const zoneById = new Map(climateZones.map((z) => [z.id, z]));
        const getModeLabel = (ch: { zoneId: string; channelMode?: 'heating' | 'cooling' }) => {
          if (floorDistributorMode === 'separate') {
            return ch.channelMode === 'cooling' ? (t.cooling ?? 'Koelen') : (t.heating ?? 'Verwarmen');
          }
          return floorDistributorMode === 'heating' ? (t.heating ?? 'Verwarmen')
            : floorDistributorMode === 'cooling' ? (t.cooling ?? 'Koelen')
            : (t.installerPdfCombinedLabel ?? 'Verwarmen/koelen');
        };
        floorDistributorActuators.forEach((act, actIdx) => {
          if (yPos > pageHeight - 35) {
            doc.addPage();
            yPos = 20;
          }
          if (actIdx === 0) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.text(t.installerPdfActuatorValveWarning ?? 'Let op: maximaal aantal kleppen per kanaal, zie specificaties aktor en kleppen.', margin, yPos);
            yPos += 6;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
          }
          const actLabel = `${t.installerPdfActuator ?? 'Aktor'} ${actIdx + 1}`;
          const posText = act.position?.trim() ? ` (${act.position})` : '';
          doc.setFont('helvetica', 'bold');
          doc.text(`${actLabel}${posText}`, margin, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          const parts: string[] = [];
          if (act.physicalAddress?.trim()) parts.push(`${t.physicalAddress ?? 'Fysiek adres'}: ${act.physicalAddress}`);
          if (act.manufacturer?.trim()) parts.push(`${t.manufacturer ?? 'Merk'}: ${act.manufacturer}`);
          if (parts.length > 0) {
            doc.text(`  ${parts.join(' | ')}`, margin, yPos);
            yPos += 5;
          }
        // Fixed column positions for alignment (Kanaal | Zone) - prevents shift with double-digit channels
        const fdChannelColX = margin + 5;
        const fdZoneColX = margin + 42; // Fixed start for zone column
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(t.channel ?? 'Kanaal', fdChannelColX, yPos);
        doc.text(t.zone ?? 'Zone', fdZoneColX, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        act.channels.forEach((ch, chIdx) => {
          const zone = ch.zoneId ? zoneById.get(ch.zoneId) : null;
          const roomPart = zone ? `${zone.roomAddress} ${translateRoomNameForPdf(zone.roomName, lang)}`.trim() : (t.installerPdfZoneNotAssigned ?? '-');
          const modeLabel = getModeLabel(ch);
          const zoneLabel = zone ? `${roomPart} (${modeLabel})` : roomPart;
          const chName = generateChannelName(act.manufacturer ?? '', chIdx + 1, false, act.channelCount ?? act.channels.length);
          doc.text(chName, fdChannelColX, yPos);
          doc.text(zoneLabel, fdZoneColX, yPos);
          yPos += 5;
        });
          yPos += 3;
        });
        yPos += 5;
      }
    }

    // Room switches/sensors section (if provided)
    const roomSwitchSensorData = options?.roomSwitchSensorData;
    if (roomSwitchSensorData && roomSwitchSensorData.length > 0) {
      const validData = roomSwitchSensorData.filter((r) => r.physicalAddress?.trim());
      if (validData.length > 0) {
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = 20;
        }
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(t.installerPdfRoomSwitchesSection ?? 'Schakelaars, melders en andere componenten', margin, yPos);
        yPos += 8;
        doc.setLineWidth(0.5);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
        yPos += 6;
        // Fixed column positions for alignment (Fysiek adres | Schakelaar/Melder | Locatie)
        const rsPhysColX = margin + 5;
        const rsTypeColX = margin + 42;  // Same as fdZoneColX for consistent alignment
        const rsLocationColX = margin + 95;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(t.physicalAddress ?? 'Fysiek adres', rsPhysColX, yPos);
        doc.text(t.installerPdfTypeLabel ?? 'Schakelaar/Melder', rsTypeColX, yPos);
        doc.text(t.installerPdfLocation ?? 'Locatie', rsLocationColX, yPos);
        yPos += 6;
        doc.setLineWidth(0.3);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const byRoom = new Map<string, typeof validData>();
        const sep = '\x00';
        validData.forEach((r) => {
          const key = `${r.roomAddress}${sep}${r.roomName}`;
          if (!byRoom.has(key)) byRoom.set(key, []);
          byRoom.get(key)!.push(r);
        });
        byRoom.forEach((items) => {
          let ra = items[0]?.roomAddress ?? '';
          let rn = items[0]?.roomName ?? '';
          if (!ra?.trim() && !rn?.trim()) {
            ra = '-';
            rn = t.installerPdfOtherRoom ?? 'Overige';
          }
          const rnTranslated = translateRoomNameForPdf(rn, lang);
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(t.physicalAddress ?? 'Fysiek adres', rsPhysColX, yPos);
            doc.text(t.installerPdfTypeLabel ?? 'Schakelaar/Melder', rsTypeColX, yPos);
            doc.text(t.installerPdfLocation ?? 'Locatie', rsLocationColX, yPos);
            yPos += 6;
            doc.setLineWidth(0.3);
            doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
          }
          doc.setFont('helvetica', 'bold');
          doc.text(`${ra} ${rnTranslated}`, margin, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          items.forEach((item) => {
            let typeLabel: string;
            if (item.type === 'sensor') typeLabel = t.installerPdfTypeSensor ?? 'Bewegingsmelder';
            else if (item.type === 'switch') typeLabel = t.installerPdfTypeSwitch ?? 'Schakelaar';
            else typeLabel = item.type?.trim() || '-';
            const locationText = item.position?.trim() || '-';
            doc.text(item.physicalAddress ?? '', rsPhysColX, yPos);
            doc.text(typeLabel, rsTypeColX, yPos);
            doc.text(locationText, rsLocationColX, yPos);
            yPos += 5;
          });
          yPos += 3;
        });
      }
    }
    
    // Footer with page numbers and copyright - centered
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Footer: page number, copyright + version (from bottom: 12mm, 6mm)
      const footerYPage = pageHeight - 12;
      const footerYCopyright = pageHeight - 6;

      const pageText = `${t.page || 'Pagina'} ${i} / ${totalPages}`;
      doc.text(pageText, (pageWidth - doc.getTextWidth(pageText)) / 2, footerYPage);

      const copyrightText = `Copyright by Archie Automation · v${APP_VERSION}`;
      doc.text(copyrightText, (pageWidth - doc.getTextWidth(copyrightText)) / 2, footerYCopyright);
    }
    
    return doc.output('blob') as Blob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('PDF generation failed. ' + (error instanceof Error ? error.message : String(error)));
    return null;
  }
};


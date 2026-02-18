// Comprehensive KNX Datapoint Types list
// Based on KNX specification - all available DPTs

export interface DPTInfo {
  code: string; // e.g., "DPT1.001"
  name: Record<'nl' | 'en' | 'es' | 'fr', string>;
}

export const DPT_LIST: DPTInfo[] = [
  // DPT 1 – 1 bit
  { code: 'DPT1.001', name: { nl: 'Switch', en: 'Switch', es: 'Switch', fr: 'Switch' } },
  { code: 'DPT1.002', name: { nl: 'Boolean', en: 'Boolean', es: 'Boolean', fr: 'Boolean' } },
  { code: 'DPT1.003', name: { nl: 'Enable', en: 'Enable', es: 'Enable', fr: 'Enable' } },
  { code: 'DPT1.004', name: { nl: 'Ramp', en: 'Ramp', es: 'Ramp', fr: 'Ramp' } },
  { code: 'DPT1.005', name: { nl: 'Alarm', en: 'Alarm', es: 'Alarm', fr: 'Alarm' } },
  { code: 'DPT1.006', name: { nl: 'Binary Value', en: 'Binary Value', es: 'Binary Value', fr: 'Binary Value' } },
  { code: 'DPT1.007', name: { nl: 'Step', en: 'Step', es: 'Step', fr: 'Step' } },
  { code: 'DPT1.008', name: { nl: 'Up/Down', en: 'Up/Down', es: 'Up/Down', fr: 'Up/Down' } },
  { code: 'DPT1.009', name: { nl: 'Open/Close', en: 'Open/Close', es: 'Open/Close', fr: 'Open/Close' } },
  { code: 'DPT1.010', name: { nl: 'Start/Stop', en: 'Start/Stop', es: 'Start/Stop', fr: 'Start/Stop' } },
  { code: 'DPT1.011', name: { nl: 'State', en: 'State', es: 'State', fr: 'State' } },
  { code: 'DPT1.012', name: { nl: 'Invert', en: 'Invert', es: 'Invert', fr: 'Invert' } },
  { code: 'DPT1.013', name: { nl: 'Dim Send Style', en: 'Dim Send Style', es: 'Dim Send Style', fr: 'Dim Send Style' } },
  { code: 'DPT1.014', name: { nl: 'Input Source', en: 'Input Source', es: 'Input Source', fr: 'Input Source' } },
  { code: 'DPT1.015', name: { nl: 'Reset', en: 'Reset', es: 'Reset', fr: 'Reset' } },
  
  // DPT 2 – 1 bit met prioriteit
  { code: 'DPT2.001', name: { nl: 'Switch + Priority', en: 'Switch + Priority', es: 'Switch + Priority', fr: 'Switch + Priority' } },
  { code: 'DPT2.002', name: { nl: 'Boolean + Priority', en: 'Boolean + Priority', es: 'Boolean + Priority', fr: 'Boolean + Priority' } },
  { code: 'DPT2.003', name: { nl: 'Enable + Priority', en: 'Enable + Priority', es: 'Enable + Priority', fr: 'Enable + Priority' } },
  { code: 'DPT2.004', name: { nl: 'Ramp + Priority', en: 'Ramp + Priority', es: 'Ramp + Priority', fr: 'Ramp + Priority' } },
  { code: 'DPT2.005', name: { nl: 'Alarm + Priority', en: 'Alarm + Priority', es: 'Alarm + Priority', fr: 'Alarm + Priority' } },
  { code: 'DPT2.006', name: { nl: 'Binary Value + Priority', en: 'Binary Value + Priority', es: 'Binary Value + Priority', fr: 'Binary Value + Priority' } },
  { code: 'DPT2.007', name: { nl: 'Step + Priority', en: 'Step + Priority', es: 'Step + Priority', fr: 'Step + Priority' } },
  { code: 'DPT2.008', name: { nl: 'Direction + Priority', en: 'Direction + Priority', es: 'Direction + Priority', fr: 'Direction + Priority' } },
  
  // DPT 3 – 4 bit (dimming / relatieve waarde)
  { code: 'DPT3.007', name: { nl: 'Dimming Control', en: 'Dimming Control', es: 'Dimming Control', fr: 'Dimming Control' } },
  { code: 'DPT3.008', name: { nl: 'Blinds Control', en: 'Blinds Control', es: 'Blinds Control', fr: 'Blinds Control' } },
  
  // DPT 4 – 8 bit char
  { code: 'DPT4.001', name: { nl: 'Character (ASCII)', en: 'Character (ASCII)', es: 'Character (ASCII)', fr: 'Character (ASCII)' } },
  
  // DPT 5 – 8 bit unsigned
  { code: 'DPT5.001', name: { nl: 'Percentage (0..100%)', en: 'Percentage (0..100%)', es: 'Percentage (0..100%)', fr: 'Percentage (0..100%)' } },
  { code: 'DPT5.002', name: { nl: 'Relative brightness', en: 'Relative brightness', es: 'Relative brightness', fr: 'Relative brightness' } },
  { code: 'DPT5.003', name: { nl: 'Angle (0..360°)', en: 'Angle (0..360°)', es: 'Angle (0..360°)', fr: 'Angle (0..360°)' } },
  { code: 'DPT5.004', name: { nl: 'Percentage (0..255)', en: 'Percentage (0..255)', es: 'Percentage (0..255)', fr: 'Percentage (0..255)' } },
  { code: 'DPT5.005', name: { nl: 'Decimal factor', en: 'Decimal factor', es: 'Decimal factor', fr: 'Decimal factor' } },
  { code: 'DPT5.010', name: { nl: 'Counter (0..255)', en: 'Counter (0..255)', es: 'Counter (0..255)', fr: 'Counter (0..255)' } },
  
  // DPT 6 – 8 bit signed
  { code: 'DPT6.001', name: { nl: 'Percent difference (-128..127)', en: 'Percent difference (-128..127)', es: 'Percent difference (-128..127)', fr: 'Percent difference (-128..127)' } },
  { code: 'DPT6.010', name: { nl: 'Value 8 bit signed', en: 'Value 8 bit signed', es: 'Value 8 bit signed', fr: 'Value 8 bit signed' } },
  
  // DPT 7 – 16 bit unsigned
  { code: 'DPT7.001', name: { nl: 'Pulse counter', en: 'Pulse counter', es: 'Pulse counter', fr: 'Pulse counter' } },
  { code: 'DPT7.002', name: { nl: 'Time period (ms)', en: 'Time period (ms)', es: 'Time period (ms)', fr: 'Time period (ms)' } },
  { code: 'DPT7.003', name: { nl: 'Time (10 ms)', en: 'Time (10 ms)', es: 'Time (10 ms)', fr: 'Time (10 ms)' } },
  { code: 'DPT7.004', name: { nl: 'Time (100 ms)', en: 'Time (100 ms)', es: 'Time (100 ms)', fr: 'Time (100 ms)' } },
  { code: 'DPT7.005', name: { nl: 'Time (s)', en: 'Time (s)', es: 'Time (s)', fr: 'Time (s)' } },
  { code: 'DPT7.006', name: { nl: 'Time (min)', en: 'Time (min)', es: 'Time (min)', fr: 'Time (min)' } },
  { code: 'DPT7.007', name: { nl: 'Time (h)', en: 'Time (h)', es: 'Time (h)', fr: 'Time (h)' } },
  
  // DPT 8 – 16 bit signed
  { code: 'DPT8.001', name: { nl: 'Pulse difference', en: 'Pulse difference', es: 'Pulse difference', fr: 'Pulse difference' } },
  { code: 'DPT8.002', name: { nl: 'Time period (signed)', en: 'Time period (signed)', es: 'Time period (signed)', fr: 'Time period (signed)' } },
  { code: 'DPT8.010', name: { nl: 'Percent difference', en: 'Percent difference', es: 'Percent difference', fr: 'Percent difference' } },
  { code: 'DPT8.011', name: { nl: 'Rotation angle', en: 'Rotation angle', es: 'Rotation angle', fr: 'Rotation angle' } },
  
  // DPT 9 – 2 byte float
  { code: 'DPT9.001', name: { nl: 'Temperature (°C)', en: 'Temperature (°C)', es: 'Temperature (°C)', fr: 'Temperature (°C)' } },
  { code: 'DPT9.002', name: { nl: 'Temperature difference (K)', en: 'Temperature difference (K)', es: 'Temperature difference (K)', fr: 'Temperature difference (K)' } },
  { code: 'DPT9.003', name: { nl: 'Temperature gradient (K/h)', en: 'Temperature gradient (K/h)', es: 'Temperature gradient (K/h)', fr: 'Temperature gradient (K/h)' } },
  { code: 'DPT9.004', name: { nl: 'Illumination (Lux)', en: 'Illumination (Lux)', es: 'Illumination (Lux)', fr: 'Illumination (Lux)' } },
  { code: 'DPT9.005', name: { nl: 'Wind speed (m/s)', en: 'Wind speed (m/s)', es: 'Wind speed (m/s)', fr: 'Wind speed (m/s)' } },
  { code: 'DPT9.006', name: { nl: 'Air pressure (hPa)', en: 'Air pressure (hPa)', es: 'Air pressure (hPa)', fr: 'Air pressure (hPa)' } },
  { code: 'DPT9.007', name: { nl: 'Humidity (%)', en: 'Humidity (%)', es: 'Humidity (%)', fr: 'Humidity (%)' } },
  { code: 'DPT9.008', name: { nl: 'Air quality (ppm)', en: 'Air quality (ppm)', es: 'Air quality (ppm)', fr: 'Air quality (ppm)' } },
  { code: 'DPT9.010', name: { nl: 'Time (s)', en: 'Time (s)', es: 'Time (s)', fr: 'Time (s)' } },
  { code: 'DPT9.011', name: { nl: 'Time (ms)', en: 'Time (ms)', es: 'Time (ms)', fr: 'Time (ms)' } },
  { code: 'DPT9.020', name: { nl: 'Voltage (V)', en: 'Voltage (V)', es: 'Voltage (V)', fr: 'Voltage (V)' } },
  { code: 'DPT9.021', name: { nl: 'Current (mA)', en: 'Current (mA)', es: 'Current (mA)', fr: 'Current (mA)' } },
  { code: 'DPT9.022', name: { nl: 'Power density (W/m²)', en: 'Power density (W/m²)', es: 'Power density (W/m²)', fr: 'Power density (W/m²)' } },
  { code: 'DPT9.023', name: { nl: 'Kelvin/hour', en: 'Kelvin/hour', es: 'Kelvin/hour', fr: 'Kelvin/hour' } },
  { code: 'DPT9.024', name: { nl: 'Power (kW)', en: 'Power (kW)', es: 'Power (kW)', fr: 'Power (kW)' } },
  { code: 'DPT9.025', name: { nl: 'Frequency (Hz)', en: 'Frequency (Hz)', es: 'Frequency (Hz)', fr: 'Frequency (Hz)' } },
  { code: 'DPT9.026', name: { nl: 'Energy (kWh)', en: 'Energy (kWh)', es: 'Energy (kWh)', fr: 'Energy (kWh)' } },
  
  // DPT 10 – Time
  { code: 'DPT10.001', name: { nl: 'Time of day', en: 'Time of day', es: 'Time of day', fr: 'Time of day' } },
  
  // DPT 11 – Date
  { code: 'DPT11.001', name: { nl: 'Date', en: 'Date', es: 'Date', fr: 'Date' } },
  
  // DPT 12 – 32 bit unsigned
  { code: 'DPT12.001', name: { nl: 'Counter', en: 'Counter', es: 'Counter', fr: 'Counter' } },
  { code: 'DPT12.100', name: { nl: 'Length (mm)', en: 'Length (mm)', es: 'Length (mm)', fr: 'Length (mm)' } },
  { code: 'DPT12.101', name: { nl: 'Energy (Wh)', en: 'Energy (Wh)', es: 'Energy (Wh)', fr: 'Energy (Wh)' } },
  
  // DPT 13 – 32 bit signed
  { code: 'DPT13.001', name: { nl: 'Counter signed', en: 'Counter signed', es: 'Counter signed', fr: 'Counter signed' } },
  { code: 'DPT13.010', name: { nl: 'Active power (W)', en: 'Active power (W)', es: 'Active power (W)', fr: 'Active power (W)' } },
  
  // DPT 14 – 32 bit float
  { code: 'DPT14.000', name: { nl: 'Value (float)', en: 'Value (float)', es: 'Value (float)', fr: 'Value (float)' } },
  { code: 'DPT14.001', name: { nl: 'Current (A)', en: 'Current (A)', es: 'Current (A)', fr: 'Current (A)' } },
  { code: 'DPT14.002', name: { nl: 'Active power (W)', en: 'Active power (W)', es: 'Active power (W)', fr: 'Active power (W)' } },
  { code: 'DPT14.005', name: { nl: 'Energy (J)', en: 'Energy (J)', es: 'Energy (J)', fr: 'Energy (J)' } },
  { code: 'DPT14.019', name: { nl: 'Temperature (K)', en: 'Temperature (K)', es: 'Temperature (K)', fr: 'Temperature (K)' } },
  { code: 'DPT14.027', name: { nl: 'Flow rate (m³/h)', en: 'Flow rate (m³/h)', es: 'Flow rate (m³/h)', fr: 'Flow rate (m³/h)' } },
  { code: 'DPT14.056', name: { nl: 'Speed (m/s)', en: 'Speed (m/s)', es: 'Speed (m/s)', fr: 'Speed (m/s)' } },
  
  // DPT 15 – Access
  { code: 'DPT15.000', name: { nl: 'Access Data', en: 'Access Data', es: 'Access Data', fr: 'Access Data' } },
  
  // DPT 16 – String (14 bytes)
  { code: 'DPT16.001', name: { nl: 'ASCII String', en: 'ASCII String', es: 'ASCII String', fr: 'ASCII String' } },
  
  // DPT 17 – Scene
  { code: 'DPT17.001', name: { nl: 'Scene number', en: 'Scene number', es: 'Scene number', fr: 'Scene number' } },
  
  // DPT 18 – Scene control
  { code: 'DPT18.001', name: { nl: 'Scene control', en: 'Scene control', es: 'Scene control', fr: 'Scene control' } },
  
  // DPT 19 – Date + Time
  { code: 'DPT19.001', name: { nl: 'Date & Time', en: 'Date & Time', es: 'Date & Time', fr: 'Date & Time' } },
  
  // DPT 20 – HVAC mode
  { code: 'DPT20.102', name: { nl: 'HVAC Mode (comfort/standby/night/frost)', en: 'HVAC Mode (comfort/standby/night/frost)', es: 'HVAC Mode (comfort/standby/night/frost)', fr: 'HVAC Mode (comfort/standby/night/frost)' } },
  
  // DPT 21 – Status
  { code: 'DPT21.001', name: { nl: 'Status byte', en: 'Status byte', es: 'Status byte', fr: 'Status byte' } },
  
  // DPT 22 – Media
  { code: 'DPT22.100', name: { nl: 'Media control', en: 'Media control', es: 'Media control', fr: 'Media control' } },
  
  // DPT 23 – HVAC extension
  { code: 'DPT23.001', name: { nl: 'HVAC status', en: 'HVAC status', es: 'HVAC status', fr: 'HVAC status' } },
  
  // DPT 24 – Variable string
  { code: 'DPT24.001', name: { nl: 'Variable length string', en: 'Variable length string', es: 'Variable length string', fr: 'Variable length string' } },
  
  // DPT 25 – Scenario
  { code: 'DPT25.001', name: { nl: 'Scenario', en: 'Scenario', es: 'Scenario', fr: 'Scenario' } },
  
  // DPT 26 – Alarm
  { code: 'DPT26.001', name: { nl: 'Alarm info', en: 'Alarm info', es: 'Alarm info', fr: 'Alarm info' } },
  
  // DPT 27 – Bitset (32 bits)
  { code: 'DPT27.001', name: { nl: 'Bitset 32', en: 'Bitset 32', es: 'Bitset 32', fr: 'Bitset 32' } },
  
  // DPT 28 – UTF-8
  { code: 'DPT28.001', name: { nl: 'UTF-8 String', en: 'UTF-8 String', es: 'UTF-8 String', fr: 'UTF-8 String' } },
  
  // DPT 29 – 64 bit
  { code: 'DPT29.001', name: { nl: '64 bit value', en: '64 bit value', es: '64 bit value', fr: '64 bit value' } }
];

// Sort DPT list numerically
DPT_LIST.sort((a, b) => {
  const aParts = a.code.replace('DPT', '').split('.');
  const bParts = b.code.replace('DPT', '').split('.');
  const aMain = parseInt(aParts[0]);
  const bMain = parseInt(bParts[0]);
  if (aMain !== bMain) return aMain - bMain;
  return parseInt(aParts[1]) - parseInt(bParts[1]);
});

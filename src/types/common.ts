export type DeviceCategory = 'switch' | 'dimmer' | 'blind' | 'hvac' | 'central';

export type AddressStructure = 'two-level' | 'three-level';

// Adresseringsmodi voor flexibele adres-structuur
export type AddressingMode = 'mode1' | 'mode2' | 'mode3';

// Wizard-gebaseerde adresseringsmodi (A, B, C)
export type WizardAddressingMode = 'A' | 'B' | 'C';

// Dimmen inherit opties
export type DimmerInheritMode = 'exact' | 'extended' | 'none';

// Extra objecten strategie voor dimmen
export type ExtraObjectsStrategy = 'increment' | 'offset' | 'middlegroup';

// Teach by Example - Pattern Analysis Types
export type CategoryUsage = 'full' | 'basic' | 'none';
export type MiddleGroupPattern = 'perType' | 'same';
export type SubGroupPattern = 'increment' | 'offset' | 'sequence';

// Example address input (H/M/S format)
export interface ExampleAddress {
  objectName: string;
  main: number;
  middle: number;
  sub: number;
  dpt?: string;
  enabled: boolean;
  mainIncrement?: number; // Increment voor hoofdgroep bij volgend device (0 of 1)
  middleIncrement?: number; // Increment voor middengroep bij volgend device (0 of 1)
  subIncrement?: number; // Increment voor subgroep bij volgend device (0, 1, 10, of 100)
}

// Analyzed pattern from example
export interface GroupPattern {
  fixedMain: number; // Fixed hoofdgroep
  middleGroupPattern: MiddleGroupPattern; // perType (different middle per object) or same (all same middle)
  subGroupPattern: SubGroupPattern; // increment (+1), offset (+N), or sequence (custom)
  offsetValue?: number; // If offset pattern
  objectsPerDevice: number; // Number of objects per device/zone
  middleGroups?: number[]; // Array of middle groups if perType
  startSub?: number; // Starting sub group
  // Extra main groups for HVAC when middle groups are exhausted (0-7)
  nextMainGroup?: number; // Next hoofdgroep to use when middengroep 7 is reached (deprecated, use extraMainGroups)
  nextMiddleGroup?: number; // Next middengroep to start with in the new hoofdgroep (0-7)
  extraMainGroups?: Array<{ main: number; middle: number }>; // Array of extra hoofd/middengroep combinations to use for additional zones
}

// Teach by Example category configuration
export interface TeachByExampleCategoryConfig {
  id?: string; // Unique ID for this group (used when multiple groups exist)
  groupName?: string; // Optional name for this group (e.g., "Schakelen 1", "Schakelen 2")
  enabled: CategoryUsage; // full, basic, or none
  exampleAddresses: ExampleAddress[]; // User input for 1 device/zone
  pattern?: GroupPattern; // Analyzed pattern
  extraObjects?: Array<{
    id: string;
    name: string;
    dpt?: string;
    main: number;
    middle: number;
    sub: number;
    mainIncrement?: number; // Increment voor hoofdgroep bij volgend device (0 of 1)
    middleIncrement?: number; // Increment voor middengroep bij volgend device (0 of 1)
    subIncrement?: number; // Increment voor subgroep bij volgend device (0, 1, 10, of 100)
  }>;
  linkedToSwitching?: boolean; // Use same addresses as switching (for dimming)
  unusedName?: string; // Name for unused objects (default: "---")
  zones?: Array<{ name: string; roomAddress?: string }>; // For HVAC
}

// Teach by Example template configuration
export interface TeachByExampleTemplateConfig {
  templateName: string;
  autoGenerateRoomAddresses?: boolean; // Automatisch groepsadressen genereren voor unieke ruimtes in centraal en scène's
  autoGenerateMiddleGroups?: {
    scenes?: boolean; // Auto-generate for scènes middengroep
    centralSwitching?: boolean; // Auto-generate for centraal schakelen middengroep
    centralDimming?: boolean; // Auto-generate for centraal dimmen middengroep
    centralBlind?: boolean; // Auto-generate for centraal jalouzie / rolluik middengroep
  };
  categories: {
    switching?: TeachByExampleCategoryConfig | TeachByExampleCategoryConfig[]; // Can be single config or array for multiple groups
    dimming?: TeachByExampleCategoryConfig | TeachByExampleCategoryConfig[]; // Can be single config or array for multiple groups
    shading?: TeachByExampleCategoryConfig | TeachByExampleCategoryConfig[]; // Can be single config or array for multiple groups
    hvac?: TeachByExampleCategoryConfig | TeachByExampleCategoryConfig[]; // Can be single config or array for multiple groups
  };
}

// Configuratie voor adresseringsstructuur per functie
export interface AddressingConfig {
  mode: AddressingMode; // MODE 1, 2, of 3
  functionNumber?: number; // Functie nummer (bijv. 3 = Schakelen) - voor MODE 1
  typeOnOff?: number; // Type middengroep voor Aan/Uit (bijv. 1) - voor MODE 1
  typeStatus?: number; // Type middengroep voor Status (bijv. 2) - voor MODE 1
  statusOffset?: number; // Status offset (bijv. 100) - voor MODE 3
  startChannelNumber?: number; // Start kanaalnummer (bijv. 1 of 5)
  channelIncrement?: boolean; // Kanaal +1 per device (true/false)
}

export interface NameTemplate {
  pattern: string; // e.g. <floor>/<roomNumber> <roomName> – <fixture> – <function>
  defaultOrder: Array<'floor' | 'roomNumber' | 'roomName' | 'fixture' | 'function'>;
}

export interface FunctionGroupConfig {
  main: number;
  middle: number;
  start: number;
  dpt: string;
}

export interface DeviceObjectTemplate {
  id: string;
  name: string;
  dpt: string;
  main: number;
  middle: number;
  start: number;
  enabled: boolean;
  isDefault?: boolean; // Kan niet verwijderd worden als true
}

// Wizard-gebaseerde configuratie per categorie
export interface WizardSwitchConfig {
  mode: WizardAddressingMode; // A, B, of C
  functionNumber?: number; // Functie groepsnummer (MODE A)
  typeGroups?: { onoff: number; status: number }; // Middengroepen voor MODE A
  startSub?: number; // Start subgroep
  statusOffset?: number; // Status offset voor MODE C
  floor?: number | 'variable'; // Verdieping voor MODE B/C (variable of vast nummer)
  statusStrategy?: '+1' | 'separate'; // Status strategie voor MODE B
}

export interface WizardDimmerConfig {
  inheritFromSwitching: boolean; // Erf van Schakelen?
  inheritMode?: DimmerInheritMode; // exact, extended, of none
  alwaysCreateAddresses: boolean; // Altijd adressen genereren
  hiddenName: string; // Naam voor ongebruikte adressen (default: "---")
  mode?: WizardAddressingMode; // Eigen mode als niet inherited
  functionNumber?: number;
  typeGroups?: { onoff: number; status: number };
  startSub?: number;
  statusOffset?: number;
  floor?: number | 'variable';
  statusStrategy?: '+1' | 'separate';
  extraObjects?: {
    strategy: ExtraObjectsStrategy;
    offset?: number;
    middlegroup?: number;
    enabledObjects?: string[]; // Welke extra objecten (dim waarde, dim status, relatief dimmen)
  };
}

export interface WizardBlindConfig {
  mode: WizardAddressingMode;
  functionNumber?: number;
  typeGroups?: { updown: number; stop: number; position: number; status: number };
  startSub?: number;
  statusOffset?: number;
  floor?: number | 'variable';
  statusStrategy?: '+1' | 'separate';
}

export interface WizardHvacConfig {
  mode: WizardAddressingMode;
  functionNumber?: number;
  startSub?: number;
  statusOffset?: number;
  floor?: number | 'variable';
  statusStrategy?: '+1' | 'separate';
  zones?: Array<{ name: string; roomAddress?: string }>; // Zone configuratie
  zoneObjects?: string[]; // Welke objecten per zone (setpoint, actual temp, mode, fan, status)
}

// Algemene wizard configuratie
export interface WizardTemplateConfig {
  templateName: string;
  defaultFloors?: number[]; // Optionele default verdiepingen
  startChannelNumber: number; // Start kanaalnummer
  schakelen?: WizardSwitchConfig;
  dimmen?: WizardDimmerConfig;
  jaloezie?: WizardBlindConfig;
  hvac?: WizardHvacConfig;
}

export interface SwitchTemplate {
  objects: DeviceObjectTemplate[];
  addressing?: AddressingConfig; // Nieuwe adresseringsconfiguratie
  wizardConfig?: WizardSwitchConfig; // Wizard-gebaseerde configuratie
}

export interface DimmerTemplate {
  objects: DeviceObjectTemplate[];
  addressing?: AddressingConfig; // Nieuwe adresseringsconfiguratie
  wizardConfig?: WizardDimmerConfig; // Wizard-gebaseerde configuratie
  groupIndex?: number; // Index van deze dimgroep (0 = eerste groep, 1 = tweede groep, etc.)
  groupName?: string; // Optionele naam voor deze dimgroep (bijv. "Dimgroep 1", "Dimgroep 2")
}

export interface BlindTemplate {
  objects: DeviceObjectTemplate[];
  addressing?: AddressingConfig; // Nieuwe adresseringsconfiguratie
  wizardConfig?: WizardBlindConfig; // Wizard-gebaseerde configuratie
}

export interface HvacTemplate {
  objects: DeviceObjectTemplate[];
  valveControlType: 'bit' | 'byte';
  addressing?: AddressingConfig; // Nieuwe adresseringsconfiguratie
  wizardConfig?: WizardHvacConfig; // Wizard-gebaseerde configuratie
}

export interface FixedSubTemplate {
  id: string;
  name: string; // Naam van het groepsadres (komt in GA overzicht)
  sub: number; // Sub nummer (0-255) - laatste getal van groepsadres
  dpt: string;
  enabled: boolean;
  isDefault?: boolean;
}

export interface FixedMiddleGroupTemplate {
  id: string;
  name: string; // Naam van de middengroep (bijv. "Scene", "Centraal")
  middle: number; // Middengroep nummer (0-7)
  subs: FixedSubTemplate[];
}

export interface FixedMainGroupTemplate {
  id: string;
  main: number; // Hoofdgroep nummer (0-31)
  name: string; // Hoofdgroep naam
  middleGroups: FixedMiddleGroupTemplate[]; // Middengroepen met subs
}

export interface FixedGroupAddressesTemplate {
  mainGroups: FixedMainGroupTemplate[]; // Hoofdgroepen met middengroepen en subs
}

export interface CustomGroupTemplate {
  id: string;
  name: string;
  objects: DeviceObjectTemplate[];
}

export interface TemplateDevicesConfig {
  switch: SwitchTemplate;
  dimmer: DimmerTemplate | DimmerTemplate[]; // Kan één DimmerTemplate zijn (backwards compat) of array voor meerdere groepen
  blind: BlindTemplate;
  hvac: HvacTemplate;
  fixed: FixedGroupAddressesTemplate; // Vaste groepsadressen (vervangt scene en central)
  customGroups?: CustomGroupTemplate[]; // Extra hoofdgroepen die de gebruiker kan toevoegen
}

export interface TemplateConfig {
  name: string;
  addressStructure: AddressStructure;
  nameTemplate: NameTemplate;
  commentTemplate: string;
  devices: TemplateDevicesConfig;
  createdAt: string;
  wizardConfig?: WizardTemplateConfig; // Nieuwe wizard-gebaseerde configuratie (optioneel voor backwards compatibiliteit)
  teachByExampleConfig?: TeachByExampleTemplateConfig; // Teach by Example configuratie (optioneel)
}

export interface OutputBase {
  id: string;
  roomAddress: string; // Format: <verdieping>.<ruimte nummer> e.g. "0.1", "-1.1", "1.4"
  roomName: string;
  fixture: string;
  channelName: string;
  switchCode?: string; // Schakelcode voor verlichting (bijv. U3, L1, C5)
  isReserve?: boolean; // True als dit kanaal niet gebruikt wordt (reserve)
}

export interface DeviceBase {
  id: string;
  manufacturer: string;
  model: string;
  physicalAddress: string;
  outputs: OutputBase[];
}

export interface SwitchOutput extends OutputBase {
  functions: Array<'onOff'>;
  remarks?: string;
  switchGroupIndex?: number; // Index van de schakelgroep (0 = eerste groep, 1 = tweede groep, etc.)
  dimGroupIndex?: number; // Index van de dimgroep wanneer dimming gelinkt is aan switching (0 = eerste groep, 1 = tweede groep, etc.)
}

export interface SwitchDevice extends DeviceBase {
  category: 'switch';
  channelCount: number;
  outputs: SwitchOutput[];
}

export interface DimmerOutput extends OutputBase {
  dimMode: 'leading' | 'trailing' | 'auto';
  remarks?: string;
  functions: Array<'onOff' | 'dimming' | 'statusOnOff' | 'statusDim'>;
  dimGroupIndex?: number; // Index van de dimgroep (0 = eerste groep, 1 = tweede groep, etc.)
}

export interface DimmerDevice extends DeviceBase {
  category: 'dimmer';
  channelCount: number;
  outputs: DimmerOutput[];
}

// DALI dimmers gebruiken nu DimmerDevice met category 'dimmer'

export interface BlindOutput extends OutputBase {
  type: 'Rolluik' | 'Jaloezie' | 'Screens';
  functions: Array<'upDown' | 'slats' | 'stop' | 'status'>;
  blindGroupIndex?: number; // Index van de blind/jaloezie groep (0 = eerste groep, 1 = tweede groep, etc.)
}

export interface BlindDevice extends DeviceBase {
  category: 'blind';
  channelCount: number;
  outputs: BlindOutput[];
}

export interface HvacZone {
  id: string;
  roomAddress: string; // Format: <verdieping>.<ruimte nummer>
  roomName: string;
  channelName: string;
}

export interface HvacDevice {
  id: string;
  category: 'hvac';
  zones: HvacZone[];
}

export interface CentralDevice {
  id: string;
  category: 'central';
  // Centraal objecten worden automatisch per ruimte gegenereerd
}

export type AnyDevice =
  | SwitchDevice
  | DimmerDevice
  | BlindDevice
  | HvacDevice
  | CentralDevice;

export interface DimmerDeviceWithDali extends DimmerDevice {
  isDali?: boolean; // Flag om aan te geven dat dit een DALI dimmer is
}

export interface GroupAddressRow {
  groupAddress: string;
  name: string;
  datapointType: string;
  comment?: string;
  priority?: string;
  unfiltered?: boolean;
  central?: boolean;
  _sortKey?: {
    physicalAddress: number[];
    channelNumber: number;
    objectIndex: number;
  };
}

// Hiërarchische structuur voor 4 Ga overzicht (ETS 5/6 stijl)
export interface HierarchicalGroupAddress {
  groupAddress: string;
  name: string;
  datapointType: string;
  comment?: string;
}

export interface HierarchicalMiddleGroup {
  middle: number;
  name: string;
  addresses: HierarchicalGroupAddress[];
}

export interface HierarchicalMainGroup {
  main: number;
  name: string;
  middleGroups: HierarchicalMiddleGroup[];
}

export interface HierarchicalGroupAddressOverview {
  mainGroups: HierarchicalMainGroup[];
}

// Installer PDF options saved in project (per-step, only added to PDF when flow is completed)
export interface ProjectInstallerPdfOptions {
  includeFloorDistributor?: boolean;
  includeRoomSwitches?: boolean;
  floorDistributorMode?: FloorDistributorMode;
  floorDistributorActuators?: FloorDistributorActuatorData[];
  climateZones?: Array<{ id: string; roomAddress: string; roomName: string; channelName: string }>;
  roomSwitchSensorData?: RoomSwitchSensorData[];
}

// Project data structure
export interface ProjectData {
  id: string;
  name: string;
  username: string;
  template: TemplateConfig;
  templateName?: string; // Name of the template used for this project
  selectedCategories: DeviceCategory[];
  devices: Record<DeviceCategory, AnyDevice[]>;
  step: 'template' | 'devices' | 'configure' | 'overview' | 'export';
  nameOptions?: NameDisplayOptions; // Name display options for GA overview
  installerPdfOptions?: ProjectInstallerPdfOptions; // Saved per-step, used when generating PDF
  createdAt: string;
  updatedAt: string;
}

export interface TemplateData {
  id: string;
  name: string;
  username: string;
  template: TemplateConfig;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyInfo {
  companyName?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// Floor distributor mode: what is used (heating, cooling, both combined, or both separate)
export type FloorDistributorMode = 'heating' | 'cooling' | 'combined' | 'separate';

// Installer PDF: Floor distributor actuator with channels mapped to zones
export interface FloorDistributorActuatorData {
  id: string;
  manufacturer: string;
  physicalAddress: string;
  position: string; // where mounted
  channelCount: number;
  channels: Array<{ zoneId: string; channelMode?: 'heating' | 'cooling' }>; // channelMode only for mode 'separate'
}

// Installer PDF: Floor distributor channel mapping per climate zone (legacy, kept for PDF options type)
export interface FloorDistributorZoneData {
  zoneId: string;
  zoneName: string;
  roomAddress: string;
  roomName: string;
  manufacturer: string;
  model: string;
  heatingPhysicalAddress: string;
  heatingChannels: string;
  coolingPhysicalAddress?: string;
  coolingChannels?: string;
}

// Installer PDF: Switch/sensor per room (type can be 'switch', 'sensor', or custom string)
export interface RoomSwitchSensorData {
  id: string;
  roomAddress: string;
  roomName: string;
  physicalAddress: string;
  position: string;
  type: string; // 'switch' | 'sensor' | custom
  roomId?: string; // For extra/manually added rooms: groups components when roomAddress/roomName are empty
}

// Installer PDF: Extra options passed when generating
export interface InstallerPDFOptions {
  floorDistributorMode?: FloorDistributorMode;
  floorDistributorData?: FloorDistributorZoneData[]; // legacy zone-based
  floorDistributorActuators?: FloorDistributorActuatorData[]; // actuator-based
  climateZones?: Array<{ id: string; roomAddress: string; roomName: string; channelName: string }>;
  roomSwitchSensorData?: RoomSwitchSensorData[];
}


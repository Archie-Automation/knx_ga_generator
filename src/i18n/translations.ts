export type Language = 'nl' | 'en' | 'es' | 'fr' | 'de';

export interface Translations {
  // General
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  reset: string;
  continue: string;
  back: string;
  next: string;
  generate: string;
  export: string;
  download: string;
  settings: string;
  navigation: string;
  data: string;
  
  // Steps
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  
  // Template
  templateBuilder: string;
  templateName: string;
  addressStructure: string;
  twoLevel: string;
  threeLevel: string;
  namePattern: string;
  commentPattern: string;
  saveAndContinue: string;
  resetToDefault: string;
  
  // Device types
  switch: string;
  dimmer: string;
  dali: string;
  blind: string;
  hvac: string;
  central: string;
  scene: string;
  fixedGroupAddresses: string;
  
  // Device config
  manufacturer: string;
  model: string;
  physicalAddress: string;
  channelCount: string;
  channels: string;
  addOutput: string;
  addZone: string;
  output: string;
  zone: string;
  
  // Fields
  floorRoom: string;
  roomName: string;
  fixture: string;
  switchCode: string;
  channel: string;
  dimMode: string;
  type: string;
  roomNamePlaceholder: string;
  fixturePlaceholder: string;
  
  // Object names
  onOff: string;
  status: string;
  dimming: string;
  value: string;
  upDown: string;
  stop: string;
  slats: string;
  measuredTemp: string;
  measuredTemp2: string;
  setpoint: string;
  setTemperature: string;
  mode: string;
  valveControl: string;
  valveControlStatus: string;
  control: string;
  heatingActive: string;
  coolingActive: string;
  setpointShift: string;
  setpointShiftStatus: string;
  fan: string;
  hvacMode: string;
  fanSpeed: string;
  humidity: string;
  rgb: string;
  rgbw: string;
  dayNight: string;
  toggle: string;
  light: string;
  specialOptions: string;
  functions: string;
  
  // Common sensor and actuator names
  temperatureSensor: string;
  motionDetector: string;
  motionSensor: string;
  windSensor: string;
  rainSensor: string;
  lightSensor: string;
  smokeDetector: string;
  co2Sensor: string;
  doorContact: string;
  windowContact: string;
  pushButton: string;
  thermostat: string;
  valve: string;
  actuator: string;
  relay: string;
  timer: string;
  controller: string;
  presenceSensor: string;
  brightnessSensor: string;
  humiditySensor: string;
  
  // Colors
  red: string;
  blue: string;
  green: string;
  yellow: string;
  white: string;
  black: string;
  orange: string;
  purple: string;
  pink: string;
  brown: string;
  grey: string;
  gray: string;
  
  // KNX specific objects - Lighting
  brightness: string;
  colorTemperature: string;
  rgbValue: string;
  rgbwValue: string;
  hueValue: string;
  saturation: string;
  
  // KNX specific objects - Blinds/Shading
  position: string;
  slatsPosition: string;
  angle: string;
  
  // KNX specific objects - HVAC
  ventilation: string;
  heating: string;
  cooling: string;
  
  // KNX specific objects - Energy
  power: string;
  current: string;
  voltage: string;
  energy: string;
  frequency: string;
  
  // KNX specific objects - Time/Date
  time: string;
  date: string;
  datetime: string;
  
  // KNX specific objects - Scenes
  scene: string;
  sceneNumber: string;
  
  // KNX specific objects - Feedback/Status
  feedback: string;
  alarm: string;
  warning: string;
  fault: string;
  
  // KNX specific objects - Audio
  volume: string;
  mute: string;
  
  // KNX specific objects - General
  minimum: string;
  maximum: string;
  setpoint: string;
  actual: string;
  offset: string;
  increment: string;
  decrement: string;
  enable: string;
  disable: string;
  lock: string;
  unlock: string;
  color: string;
  colour: string;
  
  // GA Overview
  groupAddress: string;
  name: string;
  datapointType: string;
  comment: string;
  generateGAs: string;
  
  // Export
  exportCSV: string;
  exportPDF: string;
  generateInstallerPDF: string;
  
  // PDF
  installerPDF: string;
  installerPdfQ1Title: string;
  installerPdfQ1Text: string;
  installerPdfQ2Title: string;
  installerPdfQ2Text: string;
  installerPdfFloorDistributorTitle: string;
  installerPdfFloorDistributorHint: string;
  installerPdfFloorDistributorModeLabel: string;
  installerPdfFloorDistributorMode_heating: string;
  installerPdfFloorDistributorMode_cooling: string;
  installerPdfFloorDistributorMode_combined: string;
  installerPdfFloorDistributorMode_separate: string;
  installerPdfNoClimateZones: string;
  installerPdfHeatingPhysical: string;
  installerPdfHeatingChannels: string;
  installerPdfCoolingPhysical: string;
  installerPdfCoolingChannels: string;
  installerPdfCombinedPhysical: string;
  installerPdfCombinedChannels: string;
  installerPdfCombinedLabel: string;
  installerPdfChannelsLabel: string;
  installerPdfSelectModeFirst: string;
  installerPdfActuatorCount: string;
  installerPdfActuator: string;
  installerPdfActuatorPosition: string;
  installerPdfActuatorPositionPlaceholder: string;
  installerPdfActuatorChannelCount: string;
  installerPdfChannelZoneMapping: string;
  installerPdfZoneNotAssigned: string;
  installerPdfActuatorValveWarning: string;
  installerPdfOptional: string;
  installerPdfRoomSwitchesTitle: string;
  installerPdfRoomSwitchesHint: string;
  installerPdfNoRooms: string;
  installerPdfPhysicalAddress: string;
  installerPdfPosition: string;
  installerPdfTypeSwitch: string;
  installerPdfTypeSensor: string;
  installerPdfTypeOther: string;
  installerPdfTypeCustomPlaceholder: string;
  installerPdfAddComponent: string;
  installerPdfFloorDistributorSection: string;
  installerPdfRoomSwitchesSection: string;
  installerPdfTypeLabel: string;
  installerPdfLocation: string;
  installerPdfClimateSwitchesOptional: string;
  yes: string;
  no: string;
  device: string;
  devices: string;
  outputs: string;
  zones: string;
  allGAs: string;
  page: string;
  
  // DPT
  selectDPT: string;
  searchDPT: string;
  
  // App
  appTitle: string;
  appDescription: string;
  
  // Steps
  stepTemplate: string;
  stepDeviceSelection: string;
  stepConfiguration: string;
  stepOverview: string;
  stepExport: string;
  
  // Device Selection
  deviceSelectionTitle: string;
  deviceSelectionHint: string;
  nextConfiguration: string;
  
  // Overview
  overviewTitle: string;
  backToDevices: string;
  nextExport: string;
  createProjectFromTemplate: string;
  noGAsFound: string;
  gasGenerated: string;
  etsCompatible: string;
  downloadCSV: string;
  
  // Template Wizard
  templateBuilderTitle: string;
  general: string;
  allOff: string;
  welcome: string;
  namePatternInfo: string;
  addObject: string;
  addMiddleGroup: string;
  addMainGroup: string;
  addCustomGroup: string;
  objectName: string;
  mainGroup: string;
  middleGroup: string;
  subGroup: string;
  expandAll: string;
  collapseAll: string;
  changeMainGroup: string;
  changeAllMainGroupPrompt: string;
  middleGroupFull: string;
  standard: string;
  
  // User & Project Management
  users: string;
  username: string;
  usernamePlaceholder: string;
  usernameMaxLength: string;
  noUsername: string;
  noUser: string;
  noUserLoggedIn: string;
  setUsernameFirst: string;
  setUsernameFirstTemplates: string;
  projects: string;
  saveProject: string;
  importProject: string;
  load: string;
  showProjects: string;
  hideProjects: string;
  currentProject: string;
  lastUpdated: string;
  projectNamePlaceholder: string;
  projectNameRequired: string;
  usernameRequired: string;
  projectSaved: string;
  projectSaveError: string;
  projectLoaded: string;
  projectLoadError: string;
  confirmDeleteProject: string;
  projectDeleted: string;
  projectExportError: string;
  projectImported: string;
  projectImportError: string;
  noProject: string;
  noProjects: string;
  howToCreateProject: string;
  howToCreateProjectInfo: string;
  current: string;
  created: string;
  templateHasChanges: string;
  // Template Management
  templates: string;
  importTemplate: string;
  showTemplates: string;
  hideTemplates: string;
  currentTemplate: string;
  templateNamePlaceholder: string;
  templateNameRequired: string;
  templateSaved: string;
  templateSaveError: string;
  templateLoaded: string;
  templateLoadError: string;
  confirmDeleteTemplate: string;
  templateDeleted: string;
  templateExportError: string;
  templateImported: string;
  templateImportError: string;
  noTemplates: string;
  showUsers: string;
  hideUsers: string;
  noUsers: string;
  createNewUser: string;
  userCreated: string;
  confirmDeleteUser: string;
  userDeleted: string;
  userDeleteError: string;
  cannotDeleteCurrentUser: string;
  uploadLogo: string;
  changeLogo: string;
  selectLogo: string;
  removeLogo: string;
  companyInfo: string;
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  scenesAutoGenerated: string;
  centralAutoGenerated: string;
  saveAndToDevices: string;
  // Start Screen
  whatDoYouWant: string;
  openProject: string;
  openTemplate: string;
  startNewTemplateByExample: string;
  selectProject: string;
  selectTemplate: string;
  noProjectsAvailable: string;
  noTemplatesAvailable: string;
  projectNameRequiredForDevices: string;
  reserve: string;
  unused: string;
  channelUnused: string;
  physicalAddressRequired: string;
  roomAddressRequired: string;
  roomNameRequired: string;
  fixtureRequired: string;
  // Login
  login: string;
  logout: string;
  loginSubtitle: string;
  selectUser: string;
  pleaseLoginOrCreateUser: string;
  pleaseCreateUser: string;
  createFirstUser: string;
  noUsersYet: string;
  
  // Device Config
  deviceConfigTitle: string;
  actorCount: string;
  ofActorsAdded: string;
  saved: string;
  duplicatePhysicalAddress: string;
  unsavedChanges: string;
  saveChanges: string;
  saveZones: string;
  physicalAddressFormatError: string;
  actorCannotBeSavedNoChannels: string;
  actorCannotBeSavedNoData: string;
  
  // Common
  newObject: string;
  
  // Device descriptions
  switchDescription: string;
  dimmerDescription: string;
  blindDescription: string;
  hvacDescription: string;
  centralDescription: string;
  
  // Template specific
  valveControlType: string;
  commentPatternHint: string;
  duplicateGroupsFound: string;
  mainGroupRangeError: string;
  middleGroupRangeError: string;
  startGroupRangeError: string;
  
  // Addressing configuration
  addressingConfig: string;
  addressingMode: string;
  mode1: string;
  mode2: string;
  mode3: string;
  mode1Description: string;
  mode2Description: string;
  mode3Description: string;
  functionNumber: string;
  typeOnOff: string;
  typeStatus: string;
  statusOffset: string;
  startChannelNumber: string;
  channelIncrement: string;
  addressPreview: string;
  exampleAddress: string;
  
  // Other
  noTemplate: string;
  selectDeviceTypes: string;
  template: string;
  project: string;
  columns: string;
  confirm: string;
  dimGroup: string;
  blindGroup: string;
  
  // Pattern Analysis
  analyzedPatternsPerMainFunction: string;
  editPatterns: string;
  editCategory: string;
  notUsed: string;
  linkedToSwitching: string;
  analyzedPattern: string;
  pattern: string;
  mainGroupFixed: string;
  middleGroupPattern: string;
  subGroupPattern: string;
  sameForAllObjects: string;
  differentPerObjectType: string;
  incrementing: string;
  offset: string;
  sequence: string;
  objectsPerDevice: string;
  startSubGroup: string;
  exampleAddresses: string;
  example: string;
  object: string;
  nextGroupAddress: string;
  patternNotAnalyzed: string;
  patternDimmingAndSwitching: string;
  patternDimming: string;
  dimmingUsesSameAddresses: string;
  dimmingAndSwitchingUseSameAddresses: string;
  skipSwitchingWhenUsingSameMainMiddleGroup: string;
  analyzeSwitchingFirst: string;
  unusedObjectsInSwitchingGetDashName: string;
  unnamed: string;
  
  // Dimming Configuration
  dimmingConfiguration: string;
  useSameAddressesAsSwitching: string;
  yesDimEqualsSwitching: string;
  dimmingHasOwnAddresses: string;
  onlyForDimming: string;
  forDimmingAndSwitching: string;
  unusedAddressesShownAs: string;
  editDimming: string;
  
  // Error Messages
  allAddressValuesZero: string;
  enterValidAddress: string;
  
  // Blocked Messages
  blockedByHvacConfiguration: string;
  
  // Extra Main Groups
  extraMainGroupsForZones: string;
  maxZones: string;
  maximumNumberOfZones: string;
  seeTemplateSettings: string;
  
  // Usage Options
  fullyUse: string;
  basicUse: string;
  notUse: string;
  
  // Object Names (these are already in objectNameMap but we need them for display)
  omhoogOmlaag: string;
  positie: string;
  positieStatus: string;
  lamellenPositie: string;
  lamellenStatus: string;
  gemetenTemp1: string;
  gemetenTemp2: string;
  setpointStatus: string;
  modeStatus: string;
  valueStatus: string;
  
  // Fixed Group Addresses
  noMainGroupsAvailable: string;
  mainGroupName: string;
  maxMiddleGroupsReached: string;
  middleGroupName: string;
  maxSubGroupsReached: string;
  middleGroupInUse: string;
  subGroupInUse: string;
  autoGenerateRoomAddresses: string;
  autoGenerateRoomAddressesDescription: string;
  noFixedGroupAddresses: string;
  mainGroupLabel: string;
  middleGroupLabel: string;
  remove: string;
  automaticallyGenerated: string;
  used: string;
  automatic: string;
  defaultObjectCannotDelete: string;
  fixed: string;
  standardCannotDelete: string;
  extraSubAddressesWarning: string;
  sub: string;
  actions: string;
  
  // Teach By Example Wizard
  configureAddressStructure: string;
  startWizard: string;
  middleGroupPatternSame: string;
  middleGroupPatternDifferent: string;
  startSubGroupLabel: string;
  extraMainGroupsForZonesLabel: string;
  mainGroupMustBeBetween: string;
  middleGroupMustBeBetween: string;
  subGroupMustBeBetween: string;
  groupAddressAlreadyUsed: string;
  fillIncrementForExtraDevices: string;
  extraObjectsNeedIncrement: string;
  extraObject: string;
  confirmDeleteGroup: string;
  confirmRemoveDevicesWhenNotUsed: string;
  fixedGroupAddressesLabel: string;
  extraObjects: string;
  addExtraObject: string;
  templateConfiguration: string;
  configureFixedAddressesAndViewPatterns: string;
  templateConfigurationComplete: string;
  templateOverview: string;
  noTeachByExampleConfig: string;
  usage: string;
  wizardConfiguration: string;
  variable: string;
  floor: string;
  
  // Teach By Example - Form labels
  groupNameLabel: string;
  groupNamePlaceholder: string;
  groupNameOverwriteNote: string;
  note: string;
  dimmingUsesSameAddressesAsSwitching: string;
  switchingUsesSameAddressesAsDimming: string;
  skipSwitchingWhenUsingSameMainMiddleGroup: string;
  fillAddressesForBothSwitchingAndDimming: string;
  fillForOneDeviceZone: string;
  noteIncrementForExtraDevices: string;
  atLeastOneObjectMustHaveIncrement: string;
  mainGroupIncrement: string;
  middleGroupIncrement: string;
  subGroupIncrement: string;
  extraMainGroupsConfiguration: string;
  blockedMainGroups: string;
  fillAddressesForOneDeviceZone: string;
  addExtraGroup: string;
  removeGroup: string;
  addExtraMainMiddleGroup: string;
  configureCategory: string;
  howDoYouWantToUseThisFunctionGroup: string;
  nextConfigureCategory: string;
  whichStructureDoYouUse: string;
  newTemplateTeachByExample: string;
  whatShouldTemplateNameBe: string;
  analyzePattern: string;
  analyzeStructure: string;
  allObjectsGeneratedWithNames: string;
  noAddressesGeneratedForFunctionGroup: string;
  continueButton: string;
  selectThisOptionIfSameMainMiddleGroups: string;
  continueToOverview: string;
  whenMiddleGroupIncrementIs1: string;
  forExtraZonesNextMainGroup: string;
  theseMainGroupsBlockedInFixed: string;
  ifYouSetMiddleGroupIncrementTo1: string;
  forExtraZonesYouCanSpecifyNextMainGroup: string;
  exampleDeviceSwitching: string;
  exampleDeviceDimming: string;
  exampleDeviceShading: string;
  exampleDeviceHvac: string;
  
  // Default actuator model names
  defaultDimmerModel: string;
  defaultSwitchModel: string;
  defaultBlindModel: string;
  
  // HVAC Zone specific
  legend: string;
  removeZone: string;
  zonesAdded: string;
  hvacZones: string;
  addClimateZonesDescription: string;
  savedZone: string;
  zoneNumber: string;
  allClimateGAsGeneratedAutomatically: string;
  floorRoomExample: string;
  roomNameExample: string;

  // App Update
  updateAvailable: string;
  updateDescription: string;
  updateInstall: string;
  updateLater: string;
  updateChecking: string;
  updateCheckButton: string;
  updateError: string;
  updateDownloading: string;
  updateOffline: string;
  updateRestart: string;
}

const translations: Record<Language, Translations> = {
  nl: {
    save: 'Opslaan',
    cancel: 'Annuleren',
    delete: 'Verwijderen',
    edit: 'Bewerken',
    add: 'Toevoegen',
    reset: 'Resetten',
    continue: 'Verder',
    back: 'Terug',
    next: 'Volgende',
    generate: 'Genereren',
    export: 'Exporteren',
    download: 'Downloaden',
    settings: 'Instellingen',
    navigation: 'Navigatie',
    data: 'Ingeladen gegevens',
    step1: 'Stap 1',
    step2: 'Stap 2',
    step3: 'Stap 3',
    step4: 'Stap 4',
    templateBuilder: 'Sjabloon builder',
    templateName: 'Naam sjabloon',
    addressStructure: 'Adres-structuur',
    twoLevel: '2 niveaus (hoofd/groep)',
    threeLevel: '3 niveaus (hoofd/midden/groep)',
    namePattern: 'Naamopbouw',
    commentPattern: 'Opmerking patroon',
    saveAndContinue: 'Opslaan & verder',
    resetToDefault: 'Reset naar standaard',
    switch: 'Schakelen',
    dimmer: 'Dimmen',
    dali: 'DALI Dimmen',
    blind: 'Jaloezie / Rolluik',
    hvac: 'Klimaat / HVAC',
    central: 'Centraal objecten',
    scene: 'Scenes',
    fixedGroupAddresses: 'Vaste groepsadressen',
    manufacturer: 'Merk',
    model: 'Model',
    physicalAddress: 'Fysiek adres',
    channelCount: 'Aantal kanalen',
    channels: 'Kanalen',
    addOutput: '+ Uitgang',
    addZone: '+ Zone',
    output: 'Uitgang',
    zone: 'Zone',
    floorRoom: 'Verdieping.Ruimte',
    roomName: 'Ruimte naam',
    fixture: 'Type lamp / functie',
    switchCode: 'Schakelcode',
    roomNamePlaceholder: 'entree',
    fixturePlaceholder: 'wandlamp',
    channel: 'Kanaal',
    dimMode: 'Dim-modus',
    type: 'Type',
    onOff: 'aan / uit',
    status: 'status',
    onOffStatus: 'aan / uit status',
    dimming: 'dimmen',
    value: 'waarde',
    upDown: 'op/neer',
    stop: 'stop',
    slats: 'lamellen',
    measuredTemp: 'gemeten temperatuur',
    measuredTemp2: 'gemeten temperatuur 2',
    setpoint: 'gewenste temperatuur',
    setTemperature: 'ingestelde temperatuur',
    mode: 'modus',
    valveControl: 'ventiel sturing',
    valveControlStatus: 'ventiel sturing status',
    control: 'sturing',
    heatingActive: 'melding verwarmen',
    coolingActive: 'melding koelen',
    setpointShift: 'verschuiving gewenste temperatuur',
    setpointShiftStatus: 'verschuiving gewenste temperatuur status',
    fan: 'fan',
    hvacMode: 'hvac modus',
    fanSpeed: 'ventilator snelheid',
    humidity: 'luchtvochtigheid',
    rgb: 'rgb',
    rgbw: 'rgbw',
    
    // Common sensor and actuator names
    temperatureSensor: 'temperatuursensor',
    motionDetector: 'bewegingsmelder',
    motionSensor: 'bewegingssensor',
    windSensor: 'windmeter',
    rainSensor: 'regensensor',
    lightSensor: 'lichtsensor',
    brightnessDetector: 'helderheidsdetector',
    brightnessSensor: 'helderheidssensor',
    smokeDetector: 'rookmelder',
    co2Sensor: 'co2 sensor',
    humiditySensor: 'vochtigheidssensor',
    presenceSensor: 'aanwezigheidssensor',
    presenceDetector: 'aanwezigheidsmelder',
    doorContact: 'deurcontact',
    windowContact: 'raamcontact',
    waterDetector: 'watermelder',
    leakageDetector: 'lekkagedetector',
    gasDetector: 'gasmelder',
    fireDetector: 'brandmelder',
    pushButton: 'drukknop',
    switchSensor: 'schakelaar',
    dimmerSensor: 'dimmer',
    thermostat: 'thermostaat',
    valve: 'klep',
    actuator: 'actuator',
    relay: 'relais',
    
    // Colors
    red: 'rood',
    blue: 'blauw',
    green: 'groen',
    yellow: 'geel',
    white: 'wit',
    black: 'zwart',
    orange: 'oranje',
    purple: 'paars',
    pink: 'roze',
    brown: 'bruin',
    grey: 'grijs',
    gray: 'grijs',
    color: 'kleur',
    colour: 'kleur',
    
    // KNX specific objects - Lighting
    brightness: 'helderheid',
    colorTemperature: 'kleurtemperatuur',
    colorTemp: 'kleurtemperatuur',
    rgbValue: 'rgb waarde',
    rgbwValue: 'rgbw waarde',
    hueValue: 'tint waarde',
    saturation: 'verzadiging',
    
    // KNX specific objects - Blinds/Shading
    position: 'positie',
    slatsPosition: 'lamellenpositie',
    angle: 'hoek',
    tilt: 'kantel',
    
    // KNX specific objects - HVAC
    ventilation: 'ventilatie',
    heating: 'verwarming',
    cooling: 'koeling',
    fanStage: 'ventilator stand',
    heatingCoolingMode: 'verwarm/koel modus',
    dayNight: 'dag / nacht',
    toggle: 'omschakelen',
    light: 'lamp',
    specialOptions: 'speciale opties',
    functions: 'functies',
    comfort: 'comfort',
    standby: 'standby',
    economy: 'economy',
    protection: 'bescherming',
    
    // KNX specific objects - Energy
    power: 'vermogen',
    current: 'stroom',
    voltage: 'spanning',
    energy: 'energie',
    frequency: 'frequentie',
    powerFactor: 'vermogensfactor',
    
    // KNX specific objects - Time
    time: 'tijd',
    date: 'datum',
    dayOfWeek: 'dag van de week',
    
    // KNX specific objects - Scenes
    sceneNumber: 'scène nummer',
    recall: 'oproep',
    store: 'opslaan',
    
    // KNX specific objects - Logic
    and: 'en',
    or: 'of',
    not: 'niet',
    trigger: 'trigger',
    enable: 'inschakelen',
    disable: 'uitschakelen',
    lock: 'vergrendel',
    unlock: 'ontgrendel',

    // KNX specific objects - Feedback/Status
    feedback: 'terugmelding',
    alarm: 'alarm',
    warning: 'waarschuwing',
    error: 'fout',
    fault: 'storing',
    occupied: 'bezet',
    
    // KNX specific objects - Audio
    volume: 'volume',
    source: 'bron',
    mute: 'demp',
    bass: 'bas',
    treble: 'hoog',
    balance: 'balans',
    
    // KNX specific objects - General
    minimum: 'minimum',
    maximum: 'maximum',
    actual: 'actueel',
    nominal: 'nominaal',
    offset: 'offset',
    increment: 'toename',
    decrement: 'afname',
    
    groupAddress: 'Groepsadres',
    name: 'Naam',
    datapointType: 'Datapoint Type',
    comment: 'Opmerking',
    generateGAs: 'Genereer groepsadressen',
    exportCSV: 'Exporteer CSV',
    exportPDF: 'Exporteer PDF',
    generateInstallerPDF: 'Genereer Installateurs PDF',
    installerPDF: 'Installateurs KNX aansluit overzicht',
    installerPdfQ1Title: 'Kanaalverdeling vloerverdeler',
    installerPdfQ1Text: 'Wilt u ook de kanaalverdeling van de vloerverdeler akor(s) doorgeven aan de installateur?',
    installerPdfQ2Title: 'Schakelaars en bewegingsmelders',
    installerPdfQ2Text: 'Wilt u ook de fysieke adressen van de schakelaars en bewegingsmelders per ruimte doorgeven aan de installateur?',
    installerPdfFloorDistributorTitle: 'Kanaalverdeling vloerverdeler(s)',
    installerPdfFloorDistributorHint: 'Selecteer wat er gebruikt wordt en vul per zone de gegevens in.',
    installerPdfFloorDistributorModeLabel: 'Wat wordt er gebruikt?',
    installerPdfFloorDistributorMode_heating: 'Alleen verwarmen',
    installerPdfFloorDistributorMode_cooling: 'Alleen koelen',
    installerPdfFloorDistributorMode_combined: 'Verwarmen en koelen gezamenlijk (één klepsturing)',
    installerPdfFloorDistributorMode_separate: 'Verwarmen en koelen met aparte aansturing',
    installerPdfNoClimateZones: 'Geen klimaatzones gevonden. Configureer eerst klimaat/HVAC in de device configuratie.',
    installerPdfHeatingPhysical: 'Fysiek adres verwarmen',
    installerPdfHeatingChannels: 'Kanalen verwarmen',
    installerPdfCoolingPhysical: 'Fysiek adres koelen',
    installerPdfCoolingChannels: 'Kanalen koelen',
    installerPdfCombinedPhysical: 'Fysiek adres verwarmen/koelen',
    installerPdfCombinedChannels: 'Kanalen verwarmen/koelen',
    installerPdfCombinedLabel: 'Verwarmen/koelen',
    installerPdfChannelsLabel: 'Kanalen',
    installerPdfSelectModeFirst: 'Selecteer eerst wat er gebruikt wordt.',
    installerPdfActuatorCount: 'Hoeveel aktors zijn er?',
    installerPdfActuator: 'Aktor',
    installerPdfActuatorPosition: 'Montagepositie',
    installerPdfActuatorPositionPlaceholder: 'bijv. Keuken, CV-kast',
    installerPdfActuatorChannelCount: 'Aantal kanalen',
    installerPdfChannelZoneMapping: 'Kanaal → Zone',
    installerPdfZoneNotAssigned: 'Niet toegewezen',
    installerPdfActuatorValveWarning: 'Let op: maximaal aantal kleppen per kanaal, zie de specificaties van de aktor en de specificaties van de gebruikte kleppen.',
    installerPdfOptional: '(optioneel)',
    installerPdfRoomSwitchesTitle: 'Schakelaars, melders en andere componenten per ruimte',
    installerPdfRoomSwitchesHint: 'Vul per ruimte de fysieke adressen, positie en type (schakelaar of sensor) in. U kunt extra componenten toevoegen.',
    installerPdfNoRooms: 'Geen ruimtes gevonden. Configureer eerst devices met ruimte-informatie.',
    installerPdfPhysicalAddress: 'Fysiek adres',
    installerPdfPosition: 'Positie in ruimte',
    installerPdfTypeSwitch: 'Schakelaar',
    installerPdfTypeSensor: 'Bewegingsmelder',
    installerPdfTypeOther: 'Anders...',
    installerPdfTypeCustomPlaceholder: 'bijv. Drukknop, Dimmer',
    installerPdfAddComponent: 'Component toevoegen',
    installerPdfFloorDistributorSection: 'Kanaalverdeling vloerverdeler(s)',
    installerPdfRoomSwitchesSection: 'Schakelaars, melders en andere componenten',
    installerPdfTypeLabel: 'Schakelaar/Melder',
    installerPdfLocation: 'Locatie',
    installerPdfClimateSwitchesOptional: 'Klimaat en schakelmateriaal optioneel.',
    yes: 'Ja',
    no: 'Nee',
    device: 'Apparaat',
    devices: 'Apparaten',
    outputs: 'Uitgangen',
    zones: 'Zones',
    allGAs: 'Alle groepsadressen',
    page: 'Pagina',
    selectDPT: 'Selecteer DPT',
    searchDPT: 'Zoek DPT...',
    appTitle: 'KNX Groepsadressen generator',
    appDescription: 'Wizard-achtige flow: maak sjabloon, kies gebruikte aktor functies, configureer uitgangen en klimaat zone\'s, genereer GA\'s en exporteer CSV voor ETS.',
    stepTemplate: 'Sjabloon',
    stepDeviceSelection: 'Actor selectie',
    stepConfiguration: 'Configuratie',
    stepOverview: 'GA overzicht',
    stepExport: 'ETS export',
    deviceSelectionTitle: '2) Actor-type selectie',
    deviceSelectionHint: 'Kies minimaal 1 hoofdfunctie',
    nextConfiguration: 'Volgende: Configuratie',
    overviewTitle: '4) Automatische GA-opbouw',
    backToDevices: 'Terug naar Actor selectie',
    nextExport: 'Volgende: Export',
    createProjectFromTemplate: 'Maak hier een project aan met dit sjabloon en ga naar Actor selectie',
    noGAsFound: 'Geen GA\'s gevonden. Vul actoren in.',
    gasGenerated: 'GA\'s gegenereerd. CSV is ETS 5/6 compatibel.',
    etsCompatible: 'ETS 5/6 compatibel',
    downloadCSV: 'Download CSV',
    templateBuilderTitle: '1) Sjabloon builder',
    general: 'Algemeen',
    allOff: 'alles uit',
    welcome: 'Welkom',
    namePatternInfo: 'Naamopbouw: De GA-namen worden automatisch opgebouwd als: <verdieping.ruimte> <ruimte naam> <lamp-type> <schakelcode> <functie>. Verdieping.ruimte wordt alleen getoond als ingevuld.',
    addObject: '+ Object toevoegen',
    addMiddleGroup: '+ Middengroep toevoegen',
    expandAll: 'Alles uitklappen',
    collapseAll: 'Alles inklappen',
    changeMainGroup: 'Hoofdgroep',
    changeAllMainGroupPrompt: 'Nieuw hoofdgroep nummer voor alle middengroepen (huidig: {current}):',
    middleGroupFull: 'Deze hoofdgroep is vol (maximaal 8 middengroepen: 0-7)',
    addMainGroup: '+ Hoofdgroep toevoegen',
    addCustomGroup: '+ Extra hoofdgroep toevoegen',
    objectName: 'Objectnaam',
    mainGroup: 'Hoofdgroep',
    middleGroup: 'Middengroep',
    subGroup: 'Subgroep',
    standard: '(standaard)',
    scenesAutoGenerated: 'Scenes worden automatisch per ruimte gegenereerd (1 scene-GA per ruimte).',
    centralAutoGenerated: 'Centraal objecten worden automatisch per ruimte aangemaakt (bijv. "Alles Uit").',
    saveAndToDevices: 'Opslaan & naar devices',
    deviceConfigTitle: '3) Device configuratie',
    actorCount: 'Aantal aktoren',
    ofActorsAdded: 'van aktoren toegevoegd',
    saved: 'Opgeslagen',
    duplicatePhysicalAddress: 'Fysiek adres bestaat al! Kies een uniek adres.',
    unsavedChanges: 'Niet opgeslagen wijzigingen',
    physicalAddressRequired: 'Fysiek adres is verplicht',
    physicalAddressFormatError: 'Fysiek adres moet de structuur hebben: getal1.getal2.getal3\nwaarbij getal1 en getal2 0-15 zijn en getal3 0-255 is.\nBijvoorbeeld: 1.1.40',
    actorCannotBeSavedNoChannels: 'Deze aktor kan nog niet worden opgeslagen omdat het aantal kanalen 0 is.',
    actorCannotBeSavedNoData: 'Deze aktor kan nog niet worden opgeslagen omdat er nog geen gegevens zijn ingevuld.',
    roomAddressRequired: 'Verdieping.Ruimte is verplicht voor gebruikte kanalen',
    roomNameRequired: 'Ruimte naam is verplicht voor gebruikte kanalen',
    fixtureRequired: 'Type lamp / functie is verplicht voor gebruikte kanalen',
    saveChanges: 'Wijzigingen opslaan',
    saveZones: 'Zone\'s opslaan',
    legend: 'Legenda:',
    removeZone: 'Verwijder zone',
    zonesAdded: 'zones toegevoegd',
    hvacZones: 'Klimaat / HVAC zones',
    addClimateZonesDescription: 'Voeg klimaatzones toe. Per zone worden automatisch alle klimaat-GA\'s gegenereerd volgens het sjabloon',
    savedZone: 'Opgeslagen Zone',
    zoneNumber: 'Zone',
    allClimateGAsGeneratedAutomatically: 'Alle klimaat-GA\'s worden automatisch gegenereerd volgens het sjabloon.',
    floorRoomExample: 'Verdieping.Ruimte → bijv. -1.1 (kelder ruimte 1), 0.1 (begane grond ruimte 1), 1.4 (verdieping 1 ruimte 4)',
    roomNameExample: 'Ruimte naam → tekst, bijv. "Entree"',
    newObject: 'Nieuwe middengroep',
    switchDescription: 'Aan/Uit functies met status',
    dimmerDescription: 'Dimmen, status',
    blindDescription: 'Op/Neer, lamellen, stop, status',
    hvacDescription: 'Klimaatzones met alle GA\'s',
    centralDescription: 'Centrale functies per ruimte (verplicht)',
    noTemplate: 'Geen template ingeladen',
    selectDeviceTypes: 'Selecteer eerst device-types',
    template: 'Template',
    project: 'Project',
    created: 'Aangemaakt',
    columns: 'Kolommen',
    valveControlType: 'Klepsturing type',
    commentPatternHint: 'Gebruik tokens <physical>, <channel>',
    duplicateGroupsFound: 'Er zijn dubbele hoofd- en middengroep combinaties gevonden:',
    mainGroupRangeError: 'Hoofdgroep moet tussen 0 en 31 zijn.',
    middleGroupRangeError: 'Middengroep moet tussen 0 en 7 zijn.',
    startGroupRangeError: 'Start nummer moet tussen 0 en 255 zijn.',
    addressingConfig: 'Adresseringsconfiguratie',
    addressingMode: 'Adresseringsmodus',
    mode1: 'MODE 1 – Functie / Type / Device',
    mode2: 'MODE 2 – Verdieping / Functie / Device',
    mode3: 'MODE 3 – Verdieping / Functie / Device + Status offset',
    mode1Description: 'Hoofdgroep = Functie, Middengroep = Type, Subgroep = Device',
    mode2Description: 'Hoofdgroep = Verdieping, Middengroep = Functie, Subgroep = Device',
    mode3Description: 'Hoofdgroep = Verdieping, Middengroep = Functie, Subgroep = Device (Status = +offset)',
    functionNumber: 'Functie nummer',
    typeOnOff: 'Type Aan/Uit',
    typeStatus: 'Type Status',
    statusOffset: 'Status offset',
    startChannelNumber: 'Start kanaalnummer',
    channelIncrement: 'Kanaal +1 per device',
    addressPreview: 'Adresvoorbeeld',
    exampleAddress: 'Voorbeeld:',
    users: 'Gebruikers',
    username: 'Gebruikersnaam',
    usernamePlaceholder: 'Voer gebruikersnaam in',
    usernameMaxLength: 'Gebruikersnaam mag maximaal 28 karakters bevatten',
    noUsername: 'Geen gebruikersnaam',
    noUser: 'Geen gebruiker',
    noUserLoggedIn: 'Er is niemand ingelogd',
    setUsernameFirst: 'Stel eerst een gebruikersnaam in om projecten te beheren',
    setUsernameFirstTemplates: 'Stel eerst een gebruikersnaam in om sjablonen te beheren',
    projects: 'Projecten',
    saveProject: 'Project opslaan',
    importProject: 'Project importeren',
    load: 'Laden',
    showProjects: 'Toon projecten',
    hideProjects: 'Verberg projecten',
    currentProject: 'Huidig project',
    lastUpdated: 'Laatst bijgewerkt',
    projectNamePlaceholder: 'Projectnaam',
    projectNameRequired: 'Projectnaam is verplicht',
    usernameRequired: 'Gebruikersnaam is verplicht',
    projectSaved: 'Project opgeslagen',
    projectSaveError: 'Fout bij opslaan project',
    projectLoaded: 'Project geladen',
    projectLoadError: 'Fout bij laden project',
    confirmDeleteProject: 'Weet je zeker dat je "{name}" wilt verwijderen?',
    projectDeleted: 'Project verwijderd',
    projectExportError: 'Fout bij exporteren project',
    projectImported: 'Project geïmporteerd',
    projectImportError: 'Fout bij importeren project',
    noProject: 'Geen project ingeladen',
    noProjects: 'Geen projecten opgeslagen',
    howToCreateProject: 'Hoe maak je een nieuw project aan?',
    howToCreateProjectInfo: 'Om een nieuw project aan te maken, moet je eerst een template hebben. Je kunt dit doen door:\n\n1. Een bestaande template in te laden via het menu "Templates" in de sidebar\n2. Een nieuw template aan te maken via het menu "Templates" in de sidebar\n\nZodra je een template hebt geladen, kun je via de template naar Device selectie gaan om een project aan te maken.',
    templates: 'Templates',
    importTemplate: 'Template importeren',
    showTemplates: 'Toon templates',
    hideTemplates: 'Verberg templates',
    currentTemplate: 'Huidig template',
    templateNamePlaceholder: 'Templatenaam',
    templateNameRequired: 'Templatenaam is verplicht',
    templateSaved: 'Template opgeslagen',
    templateSaveError: 'Fout bij opslaan template',
    templateLoaded: 'Template geladen',
    templateLoadError: 'Fout bij laden template',
    confirmDeleteTemplate: 'Weet je zeker dat je "{name}" wilt verwijderen?',
    templateDeleted: 'Template verwijderd',
    templateExportError: 'Fout bij exporteren template',
    templateImported: 'Template geïmporteerd',
    templateImportError: 'Fout bij importeren template',
    noTemplates: 'Geen templates ingeladen',
    createNewUser: 'Nieuwe gebruiker aanmaken',
    userCreated: 'Gebruiker aangemaakt',
    templateHasChanges: 'Sjabloon wijzigingen',
    showUsers: 'Toon gebruikers',
    hideUsers: 'Verberg gebruikers',
    noUsers: 'Geen gebruikers',
    confirmDeleteUser: 'Weet u zeker dat u gebruiker "{name}" wilt verwijderen? Alle sjablonen en projecten van deze gebruiker worden verwijderd.',
    userDeleted: 'Gebruiker verwijderd',
    userDeleteError: 'Fout bij verwijderen gebruiker',
    cannotDeleteCurrentUser: 'U kunt de huidige gebruiker niet verwijderen',
    uploadLogo: 'Upload logo',
    changeLogo: 'Wijzig logo',
    selectLogo: 'Selecteer logo',
    removeLogo: 'Verwijder',
    companyInfo: 'Bedrijfsgegevens',
    companyName: 'Bedrijfsnaam',
    address: 'Adres',
    postalCode: 'Postcode',
    city: 'Plaats',
    phone: 'Telefoon',
    email: 'E-mail',
    website: 'Website',
    login: 'Inloggen',
    logout: 'Uitloggen',
    loginSubtitle: 'Kies een gebruiker of maak een nieuwe aan om te beginnen',
    selectUser: 'Selecteer gebruiker',
    pleaseLoginOrCreateUser: 'Log in via het menu "Gebruikers" in de sidebar, of maak een nieuwe gebruiker aan.',
    pleaseCreateUser: 'Maak een nieuwe gebruiker aan via het menu "Gebruikers" in de sidebar om te beginnen.',
    createFirstUser: 'Maak eerste gebruiker aan',
    noUsersYet: 'Er zijn nog geen gebruikers. Maak een nieuwe gebruiker aan om te beginnen.',
    whatDoYouWant: 'Wat wilt u doen?',
    openProject: 'Open een project',
    openTemplate: 'Open een sjabloon',
    startNewTemplateByExample: 'Start een nieuwe sjabloon (Teach by Example) configuratie',
    selectProject: 'Selecteer een project',
    selectTemplate: 'Selecteer een sjabloon',
    noProjectsAvailable: 'Geen projecten beschikbaar. Maak eerst een project aan.',
    noTemplatesAvailable: 'Geen sjablonen beschikbaar. Maak eerst een sjabloon aan.',
    projectNameRequiredForDevices: 'Voer een projectnaam in om verder te gaan met het toevoegen van apparaten.',
    reserve: 'reserve',
    unused: 'Niet gebruikt',
    channelUnused: 'Kanaal niet gebruikt',
    confirm: 'Bevestigen',
    dimGroup: 'Dimgroep',
    blindGroup: 'Jaloezie / Rolluik groep',
    analyzedPatternsPerMainFunction: 'Geanalyseerde Patronen per Hoofdfunctie',
    editPatterns: 'Bewerk Patronen',
    editCategory: 'Bewerk',
    notUsed: 'Niet gebruikt',
    linkedToSwitching: 'Gekoppeld aan Schakelen',
    analyzedPattern: 'Geanalyseerd Patroon:',
    pattern: 'Patroon:',
    mainGroupFixed: 'Hoofdgroep: {main} (vast)',
    middleGroupPattern: 'Middengroep patroon:',
    subGroupPattern: 'Subgroep patroon:',
    sameForAllObjects: 'Zelfde voor alle objecten',
    differentPerObjectType: 'Verschillend per object type',
    middleGroupPatternSame: 'Zelfde voor alle objecten',
    middleGroupPatternDifferent: 'Verschillend per object type',
    incrementing: 'Oplopend (+1)',
    sequence: 'Volgorde',
    objectsPerDevice: 'Aantal objecten per device: {count}',
    startSubGroup: 'Start subgroep: {sub}',
    exampleAddresses: 'Voorbeeld adressen:',
    example: 'Voorbeeld:',
    object: 'Object',
    nextGroupAddress: 'Volgend groepsadres',
    patternNotAnalyzed: 'Patroon nog niet geanalyseerd',
    patternDimmingAndSwitching: 'Patroon dimmen en schakelen:',
    dimmingUsesSameAddresses: 'Dimmen gebruikt dezelfde groepsadressen als Schakelen.',
    dimmingAndSwitchingUseSameAddresses: 'Dimmen en Schakelen gebruiken dezelfde groepsadressen.',
    switchingUsesSameAddressesAsDimming: 'Schakelen gebruikt dezelfde groepsadressen als Dimmen.',
    skipSwitchingWhenUsingSameMainMiddleGroup: 'Wanneer voor schakelen en dimmen dezelfde hoofd- en middengroep wordt gebruikt, sla schakelen dan over.',
    unusedObjectsInSwitchingGetDashName: 'Ongebruikte objecten bij schakelen krijgen de naam ---',
    analyzeSwitchingFirst: 'Analyseer eerst Schakelen om het patroon te zien.',
    unnamed: 'Onbenoemd',
    dimmingConfiguration: 'Dimmen configuratie',
    useSameAddressesAsSwitching: 'Gebruik je bij Dimmen dezelfde groepsadressen als bij Schakelen?',
    yesDimEqualsSwitching: 'Ja (dim = schakelen)',
    dimmingHasOwnAddresses: 'Dimmen heeft eigen groepsadressen',
    onlyForDimming: 'Alleen voor Dimmen gebruiken',
    forDimmingAndSwitching: 'Voor Dimmen en Schakelen gebruiken',
    unusedAddressesShownAs: 'Niet gebruikte groepsadressen worden weergegeven als ---',
    editDimming: 'Bewerk Dimmen',
    allAddressValuesZero: 'Alle adreswaarden zijn 0. Vul een geldig adres in.',
    enterValidAddress: 'Vul een geldig adres in.',
    blockedByHvacConfiguration: '(Geblokkeerd door HVAC configuratie)',
    extraMainGroupsForZones: 'Extra hoofdgroepen voor extra zones:',
    maxZones: 'max {count} zones',
    maximumNumberOfZones: 'Maximaal aantal zones',
    seeTemplateSettings: 'zie instellingen sjabloon',
    whenMiddleGroupIncrementIs1: 'Wanneer de middengroep toename +1 is, kunnen er maximaal 8 zones worden gemaakt (middengroep 0-7).',
    forExtraZonesNextMainGroup: 'Voor extra zones moet een volgende hoofdgroep worden opgegeven.',
    theseMainGroupsBlockedInFixed: 'Deze hoofdgroepen worden automatisch geblokkeerd in de vaste groepsadressen.',
    ifYouSetMiddleGroupIncrementTo1: 'Als u bij de toename van de middengroep +1 instelt, kunnen er maximaal 8 zones worden gemaakt (middengroep 0-7).',
    forExtraZonesYouCanSpecifyNextMainGroup: 'Voor extra zones kunt u hier een volgende hoofdgroep opgeven.',
    fullyUse: 'Volledig gebruiken',
    basicUse: 'Basis gebruiken',
    notUse: 'Niet gebruiken',
    allObjectsGeneratedWithNames: 'Alle objecten worden gegenereerd met namen',
    noAddressesGeneratedForFunctionGroup: 'Geen adressen genereren voor deze functiegroep',
    continueButton: 'Verder',
    selectThisOptionIfSameMainMiddleGroups: 'Selecteer deze optie als ook als u dezelfde hoofd- en middengroepen gebruikt bij Dimmen.',
    continueToOverview: 'Verder naar overzicht',
    omhoogOmlaag: 'Omhoog/Omlaag',
    positie: 'Positie',
    positieStatus: 'Positie status',
    lamellenPositie: 'Lamellen positie',
    lamellenStatus: 'Lamellen positie status',
    gemetenTemp1: 'Gemeten temp 1',
    gemetenTemp2: 'Gemeten temp 2',
    setpointStatus: 'set temperature',
    modeStatus: 'modus status',
    valueStatus: 'waarde status',
    noMainGroupsAvailable: 'Geen beschikbare hoofdgroepen meer. Alle hoofdgroepen zijn in gebruik of geblokkeerd.',
    mainGroupName: 'hoofdgroep',
    maxMiddleGroupsReached: 'Maximum aantal middengroepen bereikt (0-7) voor deze hoofdgroep. Alle middengroepen zijn in gebruik of geblokkeerd.',
    middleGroupName: 'middengroep',
    maxSubGroupsReached: 'Maximum aantal subgroepen bereikt (0-255) voor deze middengroep. Alle subgroepen zijn in gebruik of geblokkeerd.',
    middleGroupInUse: 'Middengroep {value} is al in gebruik door een hoofdfunctie en kan niet worden gebruikt.',
    subGroupInUse: 'Subgroep {value} is al in gebruik door een hoofdfunctie en kan niet worden gebruikt.',
    autoGenerateRoomAddresses: 'Automatisch groepsadressen genereren voor unieke ruimtes (centraal en scène\'s)',
    autoGenerateRoomAddressesDescription: 'Wanneer ingeschakeld, worden automatisch groepsadressen aangemaakt voor elke unieke ruimte in de centraal en scène\'s middengroepen. De sub adressen 0-99 in deze middengroepen worden dan geblokkeerd voor handmatige bewerking. Sub adressen 100-255 blijven beschikbaar voor handmatige toevoeging.',
    noFixedGroupAddresses: 'Geen vaste groepsadressen. Klik op "{addMainGroup}" om er een toe te voegen.',
    mainGroupLabel: 'Hoofdgroep {main}: {name}',
    middleGroupLabel: 'Middengroep {middle}: {name}',
    remove: 'Verwijderen',
    automaticallyGenerated: '(Automatisch gegenereerd)',
    used: 'Gebruikt',
    automatic: '(automatisch)',
    defaultObjectCannotDelete: 'Standaard object - kan alleen uitgeschakeld worden',
    fixed: '(Vast)',
    standardCannotDelete: '(Standaard - kan alleen uitgeschakeld worden)',
    extraSubAddressesWarning: 'Er zijn {count} extra sub-adres(sen) in de "centraal" of "scène\'s" middengroepen:\n\n{list}\n\nDeze zullen worden verwijderd wanneer automatische generatie wordt ingeschakeld. Weet u het zeker?',
    sub: 'Sub',
    actions: 'Acties',
    configureAddressStructure: 'Configureer uw groepsadressen-structuur door één voorbeeld per hoofdgroep in te vullen.',
    startWizard: 'Start Wizard',
    extraMainGroupsForZonesLabel: 'Extra hoofdgroepen voor extra zones:',
    startSubGroupLabel: 'Start subgroep: {sub}',
    mainGroupMustBeBetween: 'Hoofdgroep moet tussen 0 en 31 zijn (huidig: {current})',
    middleGroupMustBeBetween: 'Middengroep moet tussen 0 en 7 zijn (huidig: {current})',
    subGroupMustBeBetween: 'Subgroep moet tussen 0 en 255 zijn (huidig: {current})',
    groupAddressAlreadyUsed: 'Groepsadres {address} is al gebruikt door {objectName} in dezelfde groep.',
    fillIncrementForExtraDevices: 'Vul de toename in voor extra devices/zones. Ten minste één toename (Hoofdgroep, Middengroep of Subgroep) moet worden ingevuld.',
    extraObjectsNeedIncrement: 'Extra objecten moeten ook een toename hebben. Vul de toename in voor extra devices/zones.',
    extraObject: 'Extra object',
    confirmDeleteGroup: 'Weet je zeker dat je "{name}" wilt verwijderen?',
    confirmRemoveDevicesWhenNotUsed: 'Als je "{category}" instelt op "niet gebruiken", worden alle {category} devices verwijderd uit de Configuratie. Weet je zeker dat je door wilt gaan?',
    fixedGroupAddressesLabel: 'Vaste groepsadressen',
    extraObjects: 'Extra objecten',
    addExtraObject: 'Extra object toevoegen',
    templateConfiguration: 'Template configuratie',
    configureFixedAddressesAndViewPatterns: 'Configureer vaste groepsadressen en bekijk geanalyseerde patronen',
    templateConfigurationComplete: 'Sjabloon configuratie compleet',
    templateOverview: 'Template Overzicht',
    noTeachByExampleConfig: 'Geen Teach by Example configuratie gevonden.',
    usage: 'Gebruik:',
    wizardConfiguration: 'Wizard Configuratie:',
    variable: 'Variabel',
    groupNameLabel: 'Groepnaam:',
    groupNamePlaceholder: 'Bijv. {category} beganegrond of {category} 1e verdieping',
    groupNameOverwriteNote: 'Let op: de groepsnaam wordt alleen aangepast als deze nog de standaardwaarde heeft (dimmen of dimmen / schakelen). Bij een eigen groepsnaam blijft deze behouden.',
    note: 'Let op:',
    dimmingUsesSameAddressesAsSwitching: 'Dimmen gebruikt dezelfde groepsadressen als Schakelen.',
    fillAddressesForBothSwitchingAndDimming: 'Vul hier de adressen in die voor zowel Schakelen als Dimmen worden gebruikt.',
    fillForOneDeviceZone: 'Vul voor één device/zone alle groepsadressen in (H/M/S formaat):',
    noteIncrementForExtraDevices: 'Voor ieder extra device/zone moet de toename van de Hoofdgroep, Middengroep en/of Subgroep worden ingevuld.',
    atLeastOneObjectMustHaveIncrement: 'Ten minste één object moet een toename hebben.',
    mainGroupIncrement: 'Toename Hoofdgroep',
    middleGroupIncrement: 'Toename Middengroep',
    subGroupIncrement: 'Toename Subgroep',
    extraMainGroupsConfiguration: 'Extra hoofdgroepen configuratie',
    blockedMainGroups: 'Geblokkeerde hoofdgroepen:',
    fillAddressesForOneDeviceZone: 'Vul voor één device/zone alle groepsadressen in (H/M/S formaat):',
    addExtraGroup: 'Extra {category} groep toevoegen',
    removeGroup: 'Verwijder groep',
    addExtraMainMiddleGroup: 'Extra hoofd/middengroep toevoegen',
    configureCategory: 'Configureer {category}',
    howDoYouWantToUseThisFunctionGroup: 'Hoe wil je deze functiegroep gebruiken?',
    nextConfigureCategory: 'Volgende: Configureer {category}',
    whichStructureDoYouUse: 'Welke structuur gebruik je?',
    newTemplateTeachByExample: 'Nieuw sjabloon (Teach by Example)',
    whatShouldTemplateNameBe: 'Welke naam wilt u aan het sjabloon geven?',
    analyzePattern: 'Analyseer patroon',
    analyzeStructure: 'Analyseer structuur',
    defaultDimmerModel: 'Dim actor',
    defaultSwitchModel: 'Schakel actor',
    defaultBlindModel: 'Jaloezie actor',
    updateAvailable: 'Update beschikbaar',
    updateDescription: 'Er is een nieuwe versie beschikbaar. Wil je nu updaten?',
    updateInstall: 'Nu updaten',
    updateLater: 'Later',
    updateChecking: 'Controleren op updates...',
    updateCheckButton: 'Controleren op updates',
    updateError: 'Kon niet controleren op updates',
    updateDownloading: 'Update downloaden...',
    updateOffline: 'Geen internetverbinding. Update controle overgeslagen.',
    updateRestart: 'De app wordt herstart om de update te installeren.'
  },
  en: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    reset: 'Reset',
    continue: 'Continue',
    back: 'Back',
    next: 'Next',
    generate: 'Generate',
    export: 'Export',
    download: 'Download',
    settings: 'Settings',
    navigation: 'Navigation',
    data: 'Data',
    step1: 'Step 1',
    step2: 'Step 2',
    step3: 'Step 3',
    step4: 'Step 4',
    templateBuilder: 'Template Builder',
    templateName: 'Template Name',
    addressStructure: 'Address Structure',
    twoLevel: '2 levels (main/group)',
    threeLevel: '3 levels (main/middle/group)',
    namePattern: 'Name Pattern',
    commentPattern: 'Comment Pattern',
    saveAndContinue: 'Save & Continue',
    resetToDefault: 'Reset to Default',
    switch: 'Switch',
    dimmer: 'Dimming',
    dali: 'DALI Dimming',
    blind: 'Blind / Shutter',
    hvac: 'Climate / HVAC',
    central: 'Central Objects',
    scene: 'Scenes',
    fixedGroupAddresses: 'Fixed Group Addresses',
    manufacturer: 'Manufacturer',
    model: 'Model',
    physicalAddress: 'Physical Address',
    channelCount: 'Channel Count',
    addOutput: '+ Output',
    addZone: '+ Zone',
    output: 'Output',
    zone: 'Zone',
    floorRoom: 'Floor.Room',
    roomName: 'Room Name',
    fixture: 'Fixture Type',
    switchCode: 'Switch Code',
    roomNamePlaceholder: 'hall',
    fixturePlaceholder: 'wall light',
    channel: 'Channel',
    channels: 'Channels',
    dimMode: 'Dim Mode',
    type: 'Type',
    onOff: 'on/off',
    status: 'state',
    onOffStatus: 'on/off state',
    dimming: 'dimming',
    value: 'value',
    upDown: 'up/down',
    stop: 'stop',
    slats: 'slats',
    measuredTemp: 'measured temperature',
    measuredTemp2: 'measured temperature 2',
    setpoint: 'desired temperature',
    setTemperature: 'set temperature',
    mode: 'mode',
    valveControl: 'valve control',
    valveControlStatus: 'valve control status',
    control: 'control',
    heatingActive: 'heating active',
    coolingActive: 'cooling active',
    setpointShift: 'desired temperature shift',
    setpointShiftStatus: 'desired temperature shift status',
    fan: 'fan',

    actual: 'actual',
    actuator: 'actuator',
    alarm: 'alarm',
    and: 'and',
    angle: 'angle',
    balance: 'balance',
    bass: 'bass',
    black: 'black',
    blue: 'blue',
    brightness: 'brightness',
    brightnessDetector: 'brightness detector',
    brightnessSensor: 'brightness sensor',
    brown: 'brown',
    co2Sensor: 'co2 sensor',
    color: 'color',
    colorTemp: 'color temp',
    colorTemperature: 'color temperature',
    colour: 'colour',
    comfort: 'comfort',
    cooling: 'cooling',
    csvDescription: 'Windows-1252 encoding, semicolon delimiter, 2 columns',
    date: 'date',
    dayOfWeek: 'day of week',
    decrement: 'decrement',
    dimmerSensor: 'dimmer',
    disable: 'disable',
    doorContact: 'door contact',
    economy: 'economy',
    enable: 'enable',
    energy: 'energy',
    error: 'error',
    fanSpeed: 'fan speed',
    fanStage: 'fan stage',
    fault: 'fault',
    feedback: 'feedback',
    fireDetector: 'fire detector',
    forExtraZonesYouCanSpecifyNextMainGroup: 'For extra zones you can specify a next main group here.',
    frequency: 'frequency',
    gasDetector: 'gas detector',
    gray: 'gray',
    green: 'green',
    grey: 'grey',
    heating: 'heating',
    heatingCoolingMode: 'heating/cooling mode',
    dayNight: 'day / night',
    toggle: 'toggle',
    light: 'light',
    specialOptions: 'special options',
    functions: 'functions',
    hueValue: 'hue value',
    humidity: 'humidity',
    humiditySensor: 'humidity sensor',
    hvacMode: 'hvac mode',
    ifYouSetMiddleGroupIncrementTo1: 'If you set the middle group increment to +1, a maximum of 8 zones can be created (middle group 0-7).',
    increment: 'increment',
    leakageDetector: 'leakage detector',
    lightSensor: 'light sensor',
    lock: 'lock',
    maximum: 'maximum',
    middleGroupIncrement1MaxZones: 'With middle group increment +1: max {count} zones ({seeTemplateSettings})',
    minimum: 'minimum',
    motionDetector: 'motion detector',
    motionSensor: 'motion sensor',
    mute: 'mute',
    nextGroupAddressDimming: 'Group address next dimmable / switchable lamp',
    nextGroupAddressDimmingOnly: 'Group address next dimmable lamp',
    nextGroupAddressHvac: 'Group address next zone',
    nextGroupAddressShading: 'Group address next blind / shutter',
    nextGroupAddressSwitching: 'Group address next switching',
    nominal: 'nominal',
    not: 'not',
    occupied: 'occupied',
    or: 'or',
    orange: 'orange',
    pink: 'pink',
    position: 'position',
    power: 'power',
    powerFactor: 'power factor',
    presenceDetector: 'presence detector',
    presenceSensor: 'presence sensor',
    protection: 'protection',
    purple: 'purple',
    pushButton: 'push button',
    rainSensor: 'rain sensor',
    recall: 'recall',
    red: 'red',
    relay: 'relay',
    rgb: 'rgb',
    rgbValue: 'rgb value',
    rgbw: 'rgbw',
    rgbwValue: 'rgbw value',
    saturation: 'saturation',
    sceneNumber: 'scene number',
    slatsPosition: 'slats position',
    smokeDetector: 'smoke detector',
    source: 'source',
    standby: 'standby',
    store: 'store',
    switchSensor: 'switch',
    temperatureSensor: 'temperature sensor',
    thermostat: 'thermostat',
    theseMainGroupsBlockedInFixed: 'These main groups are automatically blocked in the fixed group addresses.',
    tilt: 'tilt',
    time: 'time',
    treble: 'treble',
    trigger: 'trigger',
    unlock: 'unlock',
    valve: 'valve',
    ventilation: 'ventilation',
    voltage: 'voltage',
    volume: 'volume',
    warning: 'warning',
    waterDetector: 'water detector',
    white: 'white',
    windSensor: 'wind sensor',
    windowContact: 'window contact',
    yellow: 'yellow',
    groupAddress: 'Group Address',
    name: 'Name',
    datapointType: 'Datapoint Type',
    comment: 'Comment',
    generateGAs: 'Generate Group Addresses',
    exportCSV: 'Export CSV',
    exportPDF: 'Export PDF',
    generateInstallerPDF: 'Generate Installer PDF',
    installerPDF: 'Installer PDF',
    installerPdfQ1Title: 'Floor distributor channel distribution',
    installerPdfQ1Text: 'Do you want to pass the channel distribution of the floor distributor actuator(s) to the installer?',
    installerPdfQ2Title: 'Switches and motion sensors',
    installerPdfQ2Text: 'Do you also want to pass the physical addresses of switches and motion sensors per room to the installer?',
    installerPdfFloorDistributorTitle: 'Floor distributor channel distribution',
    installerPdfFloorDistributorHint: 'Select what is used and enter data per zone.',
    installerPdfFloorDistributorModeLabel: 'What is used?',
    installerPdfFloorDistributorMode_heating: 'Heating only',
    installerPdfFloorDistributorMode_cooling: 'Cooling only',
    installerPdfFloorDistributorMode_combined: 'Heating and cooling combined (single valve control)',
    installerPdfFloorDistributorMode_separate: 'Heating and cooling with separate control',
    installerPdfNoClimateZones: 'No climate zones found. Configure climate/HVAC in device configuration first.',
    installerPdfHeatingPhysical: 'Heating physical address',
    installerPdfHeatingChannels: 'Heating channels',
    installerPdfCoolingPhysical: 'Cooling physical address',
    installerPdfCoolingChannels: 'Cooling channels',
    installerPdfCombinedPhysical: 'Heating/cooling physical address',
    installerPdfCombinedChannels: 'Heating/cooling channels',
    installerPdfCombinedLabel: 'Heating/cooling',
    installerPdfChannelsLabel: 'Channels',
    installerPdfSelectModeFirst: 'Select what is used first.',
    installerPdfActuatorCount: 'How many actuators are there?',
    installerPdfActuator: 'Actuator',
    installerPdfActuatorPosition: 'Mounting position',
    installerPdfActuatorPositionPlaceholder: 'e.g. Kitchen, boiler room',
    installerPdfActuatorChannelCount: 'Number of channels',
    installerPdfChannelZoneMapping: 'Channel → Zone',
    installerPdfZoneNotAssigned: 'Not assigned',
    installerPdfActuatorValveWarning: 'Note: maximum number of valves per channel, see actuator specifications and specifications of the valves used.',
    installerPdfOptional: '(optional)',
    installerPdfRoomSwitchesTitle: 'Switches, sensors and other components per room',
    installerPdfRoomSwitchesHint: 'Enter physical addresses, position and type (switch or sensor) per room. You can add extra components.',
    installerPdfNoRooms: 'No rooms found. Configure devices with room information first.',
    installerPdfPhysicalAddress: 'Physical address',
    installerPdfPosition: 'Position in room',
    installerPdfTypeSwitch: 'Switch',
    installerPdfTypeSensor: 'Motion sensor',
    installerPdfTypeOther: 'Other...',
    installerPdfTypeCustomPlaceholder: 'e.g. Push button, Dimmer',
    installerPdfAddComponent: 'Add component',
    installerPdfFloorDistributorSection: 'Floor distributor channel distribution',
    installerPdfRoomSwitchesSection: 'Switches, sensors and other components',
    installerPdfTypeLabel: 'Switch/Sensor',
    installerPdfLocation: 'Location',
    installerPdfClimateSwitchesOptional: 'Climate and switchgear optional.',
    yes: 'Yes',
    no: 'No',
    device: 'Device',
    devices: 'Devices',
    outputs: 'Outputs',
    zones: 'Zones',
    allGAs: 'All Group Addresses',
    page: 'Page',
    selectDPT: 'Select DPT',
    searchDPT: 'Search DPT...',
    appTitle: 'KNX Group Address Generator',
    appDescription: 'Wizard-like flow: create template, choose used actor functions, configure outputs and climate zones, generate GAs and export CSV for ETS.',
    stepTemplate: 'Template',
    stepDeviceSelection: 'Device Selection',
    stepConfiguration: 'Configuration',
    stepOverview: 'GA Overview',
    stepExport: 'ETS Export',
    deviceSelectionTitle: '2) Device Type Selection',
    deviceSelectionHint: 'Choose at least 1 main function',
    nextConfiguration: 'Next: Configuration',
    overviewTitle: '4) Automatic GA Generation',
    backToDevices: 'Back to devices',
    nextExport: 'Next: Export',
    createProjectFromTemplate: 'Create a project here with this template and go to Device selection',
    noGAsFound: 'No GAs found. Fill in devices.',
    gasGenerated: 'GAs generated. CSV is ETS 5/6 compatible.',
    etsCompatible: 'ETS 5/6 compatible',
    downloadCSV: 'Download CSV',
    templateBuilderTitle: '1) Template Builder',
    general: 'General',
    allOff: 'all off',
    welcome: 'welcome',
    namePatternInfo: 'Name Pattern: GA names are automatically built as: <floor.room> <room name> <fixture type> <switch code> <function>. Floor.room is only shown if filled.',
    addObject: '+ Add Object',
    addMiddleGroup: '+ Add Middle Group',
    expandAll: 'Expand All',
    collapseAll: 'Collapse All',
    changeMainGroup: 'Main Group',
    changeAllMainGroupPrompt: 'New main group number for all middle groups (current: {current}):',
    middleGroupFull: 'This main group is full (maximum 8 middle groups: 0-7)',
    addMainGroup: '+ Add Main Group',
    addCustomGroup: '+ Add Custom Group',
    objectName: 'Object Name',
    mainGroup: 'Main Group',
    middleGroup: 'Middle Group',
    subGroup: 'Sub Group',
    standard: '(default)',
    scenesAutoGenerated: 'Scenes are automatically generated per room (1 scene GA per room).',
    centralAutoGenerated: 'Central objects are automatically created per room (e.g. "All Off").',
    saveAndToDevices: 'Save & to devices',
    deviceConfigTitle: '3) Device Configuration',
    actorCount: 'Number of actuators',
    ofActorsAdded: 'of actuators added',
    saved: 'Saved',
    duplicatePhysicalAddress: 'Physical address already exists! Choose a unique address.',
    unsavedChanges: 'Unsaved changes',
    physicalAddressRequired: 'Physical address is required',
    roomAddressRequired: 'Floor.Room is required for used channels',
    roomNameRequired: 'Room name is required for used channels',
    fixtureRequired: 'Fixture / function is required for used channels',
    saveChanges: 'Save changes',
    saveZones: 'Save zones',
    legend: 'Legend:',
    removeZone: 'Remove zone',
    zonesAdded: 'zones added',
    hvacZones: 'Climate / HVAC zones',
    addClimateZonesDescription: 'Add climate zones. Per zone, all climate GAs are automatically generated according to the template',
    savedZone: 'Saved Zone',
    zoneNumber: 'Zone',
    allClimateGAsGeneratedAutomatically: 'All climate GAs are automatically generated according to the template.',
    floorRoomExample: 'Floor.Room → e.g. -1.1 (basement room 1), 0.1 (ground floor room 1), 1.4 (first floor room 4)',
    roomNameExample: 'Room name → text, e.g. "Hall"',
    physicalAddressFormatError: 'Physical address must have the structure: number1.number2.number3\nwhere number1 and number2 are 0-15 and number3 is 0-255.\nFor example: 1.1.40',
    actorCannotBeSavedNoChannels: 'This actuator cannot be saved yet because the channel count is 0.',
    actorCannotBeSavedNoData: 'This actuator cannot be saved yet because no data has been filled in.',
    newObject: 'New Middle Group',
    switchDescription: 'On/Off functions with status',
    dimmerDescription: 'Dimming, status',
    blindDescription: 'Up/Down, slats, stop, status',
    hvacDescription: 'Climate zones with all GAs',
    centralDescription: 'Central functions per room (required)',
    noTemplate: 'No template loaded',
    selectDeviceTypes: 'Select device types first',
    template: 'Template',
    project: 'Project',
    created: 'Created',
    columns: 'Columns',
    valveControlType: 'Valve control type',
    commentPatternHint: 'Use tokens <physical>, <channel>',
    duplicateGroupsFound: 'Duplicate main and middle group combinations found:',
    mainGroupRangeError: 'Main group must be between 0 and 31.',
    middleGroupRangeError: 'Middle group must be between 0 and 7.',
    startGroupRangeError: 'Start number must be between 0 and 255.',
    addressingConfig: 'Addressing Configuration',
    addressingMode: 'Addressing Mode',
    mode1: 'MODE 1 – Function / Type / Device',
    mode2: 'MODE 2 – Floor / Function / Device',
    mode3: 'MODE 3 – Floor / Function / Device + Status offset',
    mode1Description: 'Main Group = Function, Middle Group = Type, Sub Group = Device',
    mode2Description: 'Main Group = Floor, Middle Group = Function, Sub Group = Device',
    mode3Description: 'Main Group = Floor, Middle Group = Function, Sub Group = Device (Status = +offset)',
    functionNumber: 'Function number',
    typeOnOff: 'Type On/Off',
    typeStatus: 'Type Status',
    statusOffset: 'Status offset',
    startChannelNumber: 'Start channel number',
    channelIncrement: 'Channel +1 per device',
    addressPreview: 'Address Preview',
    exampleAddress: 'Example:',
    users: 'Users',
    username: 'Username',
    usernamePlaceholder: 'Enter username',
    usernameMaxLength: 'Username may contain a maximum of 28 characters',
    noUsername: 'No username',
    noUser: 'No user',
    noUserLoggedIn: 'No one is logged in',
    setUsernameFirst: 'Please set a username first to manage projects',
    setUsernameFirstTemplates: 'Please set a username first to manage templates',
    projects: 'Projects',
    saveProject: 'Save Project',
    importProject: 'Import Project',
    load: 'Load',
    showProjects: 'Show Projects',
    hideProjects: 'Hide Projects',
    currentProject: 'Current Project',
    lastUpdated: 'Last Updated',
    projectNamePlaceholder: 'Project Name',
    projectNameRequired: 'Project name is required',
    usernameRequired: 'Username is required',
    projectSaved: 'Project saved',
    projectSaveError: 'Error saving project',
    projectLoaded: 'Project loaded',
    projectLoadError: 'Error loading project',
    confirmDeleteProject: 'Are you sure you want to delete "{name}"?',
    projectDeleted: 'Project deleted',
    projectExportError: 'Error exporting project',
    projectImported: 'Project imported',
    projectImportError: 'Error importing project',
    noProject: 'No project loaded',
    noProjects: 'No projects saved',
    howToCreateProject: 'How do you create a new project?',
    howToCreateProjectInfo: 'To create a new project, you first need to have a template. You can do this by:\n\n1. Loading an existing template via the "Templates" menu in the sidebar\n2. Creating a new template via the "Templates" menu in the sidebar\n\nOnce you have loaded a template, you can go to Device selection via the template to create a project.',
    templates: 'Templates',
    importTemplate: 'Import Template',
    showTemplates: 'Show Templates',
    hideTemplates: 'Hide Templates',
    currentTemplate: 'Current Template',
    templateNamePlaceholder: 'Template Name',
    templateNameRequired: 'Template name is required',
    templateSaved: 'Template saved',
    templateSaveError: 'Error saving template',
    templateLoaded: 'Template loaded',
    templateLoadError: 'Error loading template',
    confirmDeleteTemplate: 'Are you sure you want to delete "{name}"?',
    templateDeleted: 'Template deleted',
    templateExportError: 'Error exporting template',
    templateImported: 'Template imported',
    templateImportError: 'Error importing template',
    noTemplates: 'No templates loaded',
    current: 'Current',
    createNewUser: 'Create New User',
    userCreated: 'User created',
    templateHasChanges: 'Template changes',
    showUsers: 'Show Users',
    hideUsers: 'Hide Users',
    noUsers: 'No users',
    confirmDeleteUser: 'Are you sure you want to delete user "{name}"? All templates and projects for this user will be deleted.',
    userDeleted: 'User deleted',
    userDeleteError: 'Error deleting user',
    cannotDeleteCurrentUser: 'You cannot delete the current user',
    uploadLogo: 'Upload logo',
    changeLogo: 'Change logo',
    selectLogo: 'Select logo',
    removeLogo: 'Remove',
    companyInfo: 'Company Information',
    companyName: 'Company Name',
    address: 'Address',
    postalCode: 'Postal Code',
    city: 'City',
    phone: 'Phone',
    email: 'Email',
    website: 'Website',
    login: 'Login',
    logout: 'Logout',
    loginSubtitle: 'Select a user or create a new one to get started',
    selectUser: 'Select user',
    pleaseLoginOrCreateUser: 'Log in via the "Users" menu in the sidebar, or create a new user.',
    pleaseCreateUser: 'Create a new user via the "Users" menu in the sidebar to get started.',
    createFirstUser: 'Create first user',
    noUsersYet: 'No users exist yet. Create a new user to get started.',
    whatDoYouWant: 'What would you like to do?',
    openProject: 'Open a project',
    openTemplate: 'Open a Template',
    startNewTemplateByExample: 'Start a new Template by Example configuration',
    selectProject: 'Select a project',
    selectTemplate: 'Select a template',
    noProjectsAvailable: 'No projects available. Create a project first.',
    noTemplatesAvailable: 'No templates available. Create a template first.',
    projectNameRequiredForDevices: 'Enter a project name to continue adding devices.',
    reserve: 'reserve',
    unused: 'Unused',
    channelUnused: 'Channel unused',
    confirm: 'Confirm',
    dimGroup: 'Dim Group',
    blindGroup: 'Blind / Shutter Group',
    analyzedPatternsPerMainFunction: 'Analyzed Patterns per Main Function',
    editPatterns: 'Edit Patterns',
    editCategory: 'Edit',
    notUsed: 'Not used',
    linkedToSwitching: 'Linked to Switching',
    analyzedPattern: 'Analyzed Pattern:',
    pattern: 'Pattern:',
    mainGroupFixed: 'Main Group: {main} (fixed)',
    middleGroupPattern: 'Middle Group Pattern:',
    subGroupPattern: 'Sub Group Pattern:',
    sameForAllObjects: 'Same for all objects',
    differentPerObjectType: 'Different per object type',
    incrementing: 'Incrementing (+1)',
    offset: 'Offset (+{value})',
    sequence: 'Sequence',
    objectsPerDevice: 'Objects per device: {count}',
    startSubGroup: 'Start sub group: {sub}',
    exampleAddresses: 'Example Addresses:',
    example: 'Example:',
    object: 'Object',
    nextGroupAddress: 'Next Group Address',
    patternNotAnalyzed: 'Pattern not yet analyzed',
    patternDimmingAndSwitching: 'Dimming and Switching Pattern:',
    dimmingUsesSameAddresses: 'Dimming uses the same group addresses as Switching.',
    dimmingAndSwitchingUseSameAddresses: 'Dimming and Switching use the same group addresses.',
    skipSwitchingWhenUsingSameMainMiddleGroup: 'When you use switching and dimming in the same main middle group, skip switching.',
    unusedObjectsInSwitchingGetDashName: 'Unused objects in switching get the name ---',
    analyzeSwitchingFirst: 'Analyze Switching first to see the pattern.',
    unnamed: 'Unnamed',
    dimmingConfiguration: 'Dimming Configuration',
    useSameAddressesAsSwitching: 'Do you use the same group addresses for Dimming as for Switching?',
    yesDimEqualsSwitching: 'Yes (dim = switching)',
    dimmingHasOwnAddresses: 'Dimming has its own group addresses',
    onlyForDimming: 'Only for Dimming',
    forDimmingAndSwitching: 'For Dimming and Switching',
    unusedAddressesShownAs: 'Unused group addresses are shown as ---',
    editDimming: 'Edit Dimming',
    allAddressValuesZero: 'All address values are 0. Enter a valid address.',
    enterValidAddress: 'Enter a valid address.',
    blockedByHvacConfiguration: '(Blocked by HVAC configuration)',
    extraMainGroupsForZones: 'Extra main groups for extra zones:',
    maxZones: 'max {count} zones',
    maximumNumberOfZones: 'Maximum number of zones',
    seeTemplateSettings: 'see template settings',
    fullyUse: 'Fully use',
    basicUse: 'Basic use',
    notUse: 'Not use',
    allObjectsGeneratedWithNames: 'All objects will be generated with names',
    noAddressesGeneratedForFunctionGroup: 'No addresses will be generated for this function group',
    continueButton: 'Continue',
    selectThisOptionIfSameMainMiddleGroups: 'Select this option if you also use the same main and middle groups for Dimming.',
    continueToOverview: 'Continue to Overview',
    omhoogOmlaag: 'Up/Down',
    positie: 'Position',
    positieStatus: 'Position status',
    lamellenPositie: 'Slats position',
    lamellenStatus: 'Slats position status',
    gemetenTemp1: 'Measured temp 1',
    gemetenTemp2: 'Measured temp 2',
    setpointStatus: 'set temperature',
    modeStatus: 'mode state',
    valueStatus: 'value status',
    noMainGroupsAvailable: 'No main groups available. All main groups are in use or blocked.',
    mainGroupName: 'main group',
    maxMiddleGroupsReached: 'Maximum number of middle groups reached (0-7) for this main group. All middle groups are in use or blocked.',
    middleGroupName: 'middle group',
    maxSubGroupsReached: 'Maximum number of sub groups reached (0-255) for this middle group. All sub groups are in use or blocked.',
    middleGroupInUse: 'Middle group {value} is already in use by a main function and cannot be used.',
    subGroupInUse: 'Sub group {value} is already in use by a main function and cannot be used.',
    autoGenerateRoomAddresses: 'Automatically generate group addresses for unique rooms (central and scenes)',
    autoGenerateRoomAddressesDescription: 'When enabled, group addresses are automatically created for each unique room in the central and scenes middle groups. Sub addresses 0-99 in these middle groups are then blocked for manual editing. Sub addresses 100-255 remain available for manual addition.',
    noFixedGroupAddresses: 'No fixed group addresses. Click on "{addMainGroup}" to add one.',
    mainGroupLabel: 'Main Group {main}: {name}',
    middleGroupLabel: 'Middle Group {middle}: {name}',
    remove: 'Remove',
    automaticallyGenerated: '(Automatically generated)',
    used: 'Used',
    automatic: '(automatic)',
    defaultObjectCannotDelete: 'Default object - can only be disabled',
    fixed: '(Fixed)',
    standardCannotDelete: '(Standard - can only be disabled)',
    extraSubAddressesWarning: 'There are {count} extra sub-address(es) in the "central" or "scenes" middle groups:\n\n{list}\n\nThese will be removed when automatic generation is enabled. Are you sure?',
    sub: 'Sub',
    actions: 'Actions',
    configureAddressStructure: 'Configure your group address structure by filling in one example per main group.',
    startWizard: 'Start Wizard',
    extraMainGroupsForZonesLabel: 'Extra main groups for extra zones:',
    mainGroupMustBeBetween: 'Main group must be between 0 and 31 (current: {current})',
    middleGroupMustBeBetween: 'Middle group must be between 0 and 7 (current: {current})',
    subGroupMustBeBetween: 'Sub group must be between 0 and 255 (current: {current})',
    groupAddressAlreadyUsed: 'Group address {address} is already used by {objectName} in the same group.',
    fillIncrementForExtraDevices: 'Fill in the increment for extra devices/zones. At least one increment (Main Group, Middle Group or Sub Group) must be filled in.',
    extraObjectsNeedIncrement: 'Extra objects must also have an increment. Fill in the increment for extra devices/zones.',
    extraObject: 'Extra object',
    confirmDeleteGroup: 'Are you sure you want to delete "{name}"?',
    confirmRemoveDevicesWhenNotUsed: 'If you set "{category}" to "not used", all {category} devices will be removed from the Configuration. Are you sure you want to continue?',
    fixedGroupAddressesLabel: 'Fixed Group Addresses',
    startSubGroupLabel: 'Start sub group: {sub}',
    extraObjects: 'Extra Objects',
    addExtraObject: 'Add Extra Object',
    templateConfiguration: 'Template Configuration',
    configureFixedAddressesAndViewPatterns: 'Configure fixed group addresses and view analyzed patterns per main function.',
    templateConfigurationComplete: 'Template Configuration Complete',
    groupNameLabel: 'Group Name:',
    groupNamePlaceholder: 'E.g. {category} ground floor or {category} 1st floor',
    groupNameOverwriteNote: 'Note: the group name is only updated when it still has the default value (dimmer or dimmer / switch). A custom group name is preserved.',
    note: 'Note:',
    dimmingUsesSameAddressesAsSwitching: 'Dimming uses the same group addresses as Switching.',
    switchingUsesSameAddressesAsDimming: 'Switching uses the same group addresses as Dimming.',
    fillAddressesForBothSwitchingAndDimming: 'Fill in the addresses here that are used for both Switching and Dimming.',
    fillForOneDeviceZone: 'Fill in all group addresses for one device/zone (M/M/S format):',
    noteIncrementForExtraDevices: 'For each extra device/zone, the increment of the Main Group, Middle Group and/or Sub Group must be filled in.',
    atLeastOneObjectMustHaveIncrement: 'At least one object must have an increment.',
    mainGroupIncrement: 'Main Group Increment',
    middleGroupIncrement: 'Middle Group Increment',
    subGroupIncrement: 'Sub Group Increment',
    extraMainGroupsConfiguration: 'Extra main groups configuration',
    blockedMainGroups: 'Blocked main groups:',
    fillAddressesForOneDeviceZone: 'Fill in all group addresses for one device/zone (M/M/S format):',
    addExtraGroup: 'Add Extra {category} Group',
    removeGroup: 'Remove Group',
    addExtraMainMiddleGroup: 'Add Extra Main/Middle Group',
    configureCategory: 'Configure {category}',
    howDoYouWantToUseThisFunctionGroup: 'How do you want to use this function group?',
    nextConfigureCategory: 'Next: Configure {category}',
    whichStructureDoYouUse: 'Which structure do you use?',
    newTemplateTeachByExample: 'New Template (Teach by Example)',
    whatShouldTemplateNameBe: 'What should the template name be?',
    analyzePattern: 'Analyze Pattern',
    analyzeStructure: 'Analyze Structure',
    defaultDimmerModel: 'Dimmer',
    defaultSwitchModel: 'Switch Actuator',
    defaultBlindModel: 'Blind Actuator',
    updateAvailable: 'Update available',
    updateDescription: 'A new version is available. Do you want to update now?',
    updateInstall: 'Update now',
    updateLater: 'Later',
    updateChecking: 'Checking for updates...',
    updateCheckButton: 'Check for updates',
    updateError: 'Could not check for updates',
    updateDownloading: 'Downloading update...',
    updateOffline: 'No internet connection. Update check skipped.',
    updateRestart: 'The app will restart to install the update.'
  },
  es: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Añadir',
    reset: 'Restablecer',
    continue: 'Continuar',
    back: 'Atrás',
    next: 'Siguiente',
    generate: 'Generar',
    export: 'Exportar',
    download: 'Descargar',
    settings: 'Configuración',
    navigation: 'Navegación',
    data: 'Datos cargados',
    step1: 'Paso 1',
    step2: 'Paso 2',
    step3: 'Paso 3',
    step4: 'Paso 4',
    templateBuilder: 'Constructor de Plantilla',
    templateName: 'Nombre de Plantilla',
    addressStructure: 'Estructura de Dirección',
    twoLevel: '2 niveles (principal/grupo)',
    threeLevel: '3 niveles (principal/medio/grupo)',
    namePattern: 'Patrón de Nombre',
    commentPattern: 'Patrón de Comentario',
    saveAndContinue: 'Guardar y Continuar',
    resetToDefault: 'Restablecer por Defecto',
    switch: 'Interruptor',
    dimmer: 'Atenuación',
    dali: 'Atenuación DALI',
    blind: 'Persiana / Toldo',
    hvac: 'Clima / HVAC',
    central: 'Objetos Centrales',
    scene: 'Escenas',
    fixedGroupAddresses: 'Direcciones de Grupo Fijas',
    manufacturer: 'Fabricante',
    model: 'Modelo',
    physicalAddress: 'Dirección Física',
    channelCount: 'Número de Canales',
    channels: 'Canales',
    addOutput: '+ Salida',
    addZone: '+ Zona',
    output: 'Salida',
    zone: 'Zona',
    floorRoom: 'Planta.Habitación',
    roomName: 'Nombre de Habitación',
    fixture: 'Tipo de Luminaria',
    switchCode: 'Código de Interruptor',
    roomNamePlaceholder: 'hall',
    fixturePlaceholder: 'luz de pared',
    channel: 'Canal',
    dimMode: 'Modo Atenuación',
    type: 'Tipo',
    onOff: 'encendido/apagado',
    onOffStatus: 'encendido/apagado estado',
    status: 'estado',
    dimming: 'atenuación',
    value: 'valor',
    upDown: 'arriba/abajo',
    stop: 'detener',
    slats: 'lamas',
    measuredTemp: 'temperatura medida',
    measuredTemp2: 'temperatura medida 2',
    setpoint: 'temperatura deseada',
    setTemperature: 'temperatura establecida',
    mode: 'modo',
    valveControl: 'control de válvula',
    valveControlStatus: 'estado de control de válvula',
    control: 'control',
    heatingActive: 'calefacción activa',
    coolingActive: 'refrigeración activa',
    setpointShift: 'desplazamiento de temperatura deseada',
    setpointShiftStatus: 'estado de desplazamiento de temperatura deseada',
    fan: 'ventilador',

    actual: 'actual',
    actuator: 'actuador',
    alarm: 'alarma',
    and: 'y',
    angle: 'ángulo',
    balance: 'balance',
    bass: 'bajo',
    black: 'negro',
    blue: 'azul',
    brightness: 'brillo',
    brightnessDetector: 'detector de brillo',
    brightnessSensor: 'sensor de brillo',
    brown: 'marrón',
    co2Sensor: 'sensor co2',
    color: 'color',
    colorTemp: 'temp color',
    colorTemperature: 'temperatura de color',
    colour: 'color',
    comfort: 'confort',
    cooling: 'refrigeración',
    csvDescription: 'Codificación Windows-1252, delimitador ;, 2 columnas',
    date: 'fecha',
    dayOfWeek: 'día de la semana',
    decrement: 'decremento',
    dimmerSensor: 'regulador',
    disable: 'deshabilitar',
    doorContact: 'contacto de puerta',
    economy: 'economía',
    enable: 'habilitar',
    energy: 'energía',
    error: 'error',
    fanSpeed: 'velocidad del ventilador',
    fanStage: 'nivel de ventilador',
    fault: 'falla',
    feedback: 'retroalimentación',
    fireDetector: 'detector de incendios',
    frequency: 'frecuencia',
    gasDetector: 'detector de gas',
    gray: 'gris',
    green: 'verde',
    grey: 'gris',
    heating: 'calefacción',
    heatingCoolingMode: 'modo calefacción/refrigeración',
    dayNight: 'día / noche',
    toggle: 'alternar',
    light: 'luz',
    specialOptions: 'opciones especiales',
    functions: 'funciones',
    howToCreateProject: '¿Cómo se crea un nuevo proyecto?',
    howToCreateProjectInfo: 'Para crear un nuevo proyecto, primero necesitas tener una plantilla. Puedes hacer esto:\n\n1. Cargando una plantilla existente a través del menú "Plantillas" en la barra lateral\n2. Creando una nueva plantilla a través del menú "Plantillas" en la barra lateral\n\nUna vez que hayas cargado una plantilla, puedes ir a la selección de dispositivos a través de la plantilla para crear un proyecto.',
    hueValue: 'valor de tono',
    humidity: 'humedad',
    humiditySensor: 'sensor de humedad',
    hvacMode: 'modo hvac',
    increment: 'incremento',
    leakageDetector: 'detector de fugas',
    lightSensor: 'sensor de luz',
    lock: 'bloquear',
    maximum: 'máximo',
    middleGroupIncrement1MaxZones: 'Con incremento grupo medio +1: máx. {count} zonas ({seeTemplateSettings})',
    minimum: 'mínimo',
    motionDetector: 'detector de movimiento',
    motionSensor: 'sensor de movimiento',
    mute: 'silenciar',
    nextGroupAddressDimming: 'Dirección de grupo siguiente lámpara dimmable / conmutable',
    nextGroupAddressDimmingOnly: 'Dirección de grupo siguiente lámpara dimmable',
    nextGroupAddressHvac: 'Dirección de grupo siguiente zona',
    nextGroupAddressShading: 'Dirección de grupo siguiente persiana / toldo',
    nextGroupAddressSwitching: 'Dirección de grupo siguiente interruptor',
    nominal: 'nominal',
    not: 'no',
    occupied: 'ocupado',
    or: 'o',
    orange: 'naranja',
    pink: 'rosa',
    position: 'posición',
    power: 'potencia',
    powerFactor: 'factor de potencia',
    presenceDetector: 'detector de presencia',
    presenceSensor: 'sensor de presencia',
    protection: 'protección',
    purple: 'morado',
    pushButton: 'pulsador',
    rainSensor: 'sensor de lluvia',
    recall: 'recuperar',
    red: 'rojo',
    relay: 'relé',
    rgb: 'rgb',
    rgbValue: 'valor rgb',
    rgbw: 'rgbw',
    rgbwValue: 'valor rgbw',
    saturation: 'saturación',
    sceneNumber: 'número de escena',
    slatsPosition: 'posición de lamas',
    smokeDetector: 'detector de humo',
    source: 'fuente',
    standby: 'standby',
    store: 'almacenar',
    switchSensor: 'interruptor',
    temperatureSensor: 'sensor de temperatura',
    thermostat: 'termostato',
    tilt: 'inclinación',
    time: 'tiempo',
    treble: 'agudo',
    trigger: 'disparador',
    unlock: 'desbloquear',
    valve: 'válvula',
    ventilation: 'ventilación',
    voltage: 'voltaje',
    volume: 'volumen',
    warning: 'advertencia',
    waterDetector: 'detector de agua',
    white: 'blanco',
    windSensor: 'sensor de viento',
    windowContact: 'contacto de ventana',
    yellow: 'amarillo',
    groupAddress: 'Dirección de Grupo',
    name: 'Nombre',
    datapointType: 'Tipo de Punto de Datos',
    comment: 'Comentario',
    generateGAs: 'Generar Direcciones de Grupo',
    exportCSV: 'Exportar CSV',
    exportPDF: 'Exportar PDF',
    generateInstallerPDF: 'Generar PDF de Instalador',
    installerPDF: 'PDF de Instalador',
    installerPdfQ1Title: 'Distribución de canales del distribuidor de suelo',
    installerPdfQ1Text: '¿Desea pasar la distribución de canales del distribuidor de suelo (actuador/es) al instalador?',
    installerPdfQ2Title: 'Interruptores y sensores de movimiento',
    installerPdfQ2Text: '¿También desea pasar las direcciones físicas de interruptores y sensores de movimiento por habitación al instalador?',
    installerPdfFloorDistributorTitle: 'Distribución de canales del distribuidor de suelo',
    installerPdfFloorDistributorHint: 'Seleccione qué se utiliza e introduzca los datos por zona.',
    installerPdfFloorDistributorModeLabel: '¿Qué se utiliza?',
    installerPdfFloorDistributorMode_heating: 'Solo calefacción',
    installerPdfFloorDistributorMode_cooling: 'Solo refrigeración',
    installerPdfFloorDistributorMode_combined: 'Calefacción y refrigeración combinadas (una válvula)',
    installerPdfFloorDistributorMode_separate: 'Calefacción y refrigeración con control separado',
    installerPdfNoClimateZones: 'No se encontraron zonas climáticas. Configure clima/HVAC en la configuración de dispositivos primero.',
    installerPdfHeatingPhysical: 'Dirección física calefacción',
    installerPdfHeatingChannels: 'Canales calefacción',
    installerPdfCoolingPhysical: 'Dirección física refrigeración',
    installerPdfCoolingChannels: 'Canales refrigeración',
    installerPdfCombinedPhysical: 'Dirección física calefacción/refrigeración',
    installerPdfCombinedChannels: 'Canales calefacción/refrigeración',
    installerPdfCombinedLabel: 'Calefacción/refrigeración',
    installerPdfChannelsLabel: 'Canales',
    installerPdfSelectModeFirst: 'Seleccione primero qué se utiliza.',
    installerPdfActuatorCount: '¿Cuántos actuadores hay?',
    installerPdfActuator: 'Actuador',
    installerPdfActuatorPosition: 'Posición de montaje',
    installerPdfActuatorPositionPlaceholder: 'ej. Cocina, cuarto caldera',
    installerPdfActuatorChannelCount: 'Número de canales',
    installerPdfChannelZoneMapping: 'Canal → Zona',
    installerPdfZoneNotAssigned: 'No asignado',
    installerPdfActuatorValveWarning: 'Nota: número máximo de válvulas por canal, consulte las especificaciones del actuador y de las válvulas utilizadas.',
    installerPdfOptional: '(opcional)',
    installerPdfRoomSwitchesTitle: 'Interruptores, sensores y otros componentes por habitación',
    installerPdfRoomSwitchesHint: 'Introduzca direcciones físicas, posición y tipo (interruptor o sensor) por habitación. Puede añadir componentes extra.',
    installerPdfNoRooms: 'No se encontraron habitaciones. Configure dispositivos con información de habitación primero.',
    installerPdfPhysicalAddress: 'Dirección física',
    installerPdfPosition: 'Posición en habitación',
    installerPdfTypeSwitch: 'Interruptor',
    installerPdfTypeSensor: 'Sensor de movimiento',
    installerPdfTypeOther: 'Otro...',
    installerPdfTypeCustomPlaceholder: 'ej. Pulsador, Dimmer',
    installerPdfAddComponent: 'Añadir componente',
    installerPdfFloorDistributorSection: 'Distribución de canales del distribuidor de suelo',
    installerPdfRoomSwitchesSection: 'Interruptores, sensores y otros componentes',
    installerPdfTypeLabel: 'Interruptor/Sensor',
    installerPdfLocation: 'Ubicación',
    installerPdfClimateSwitchesOptional: 'Clima y material de conmutación opcional.',
    yes: 'Sí',
    no: 'No',
    device: 'Dispositivo',
    devices: 'Dispositivos',
    outputs: 'Salidas',
    zones: 'Zonas',
    allGAs: 'Todas las Direcciones de Grupo',
    page: 'Página',
    selectDPT: 'Seleccionar DPT',
    searchDPT: 'Buscar DPT...',
    appTitle: 'Generador de Direcciones de Grupo KNX',
    appDescription: 'Flujo tipo asistente: crea plantilla, elige funciones de actuador utilizadas, configura salidas y zonas climáticas, genera GA y exporta CSV para ETS.',
    stepTemplate: 'Plantilla',
    stepDeviceSelection: 'Selección de Dispositivos',
    stepConfiguration: 'Configuración',
    stepOverview: 'Resumen de GA',
    stepExport: 'Exportar ETS',
    deviceSelectionTitle: '2) Selección de Tipo de Dispositivo',
    deviceSelectionHint: 'Elige al menos 1 función principal',
    nextConfiguration: 'Siguiente: Configuración',
    overviewTitle: '4) Generación Automática de GA',
    backToDevices: 'Volver a dispositivos',
    nextExport: 'Siguiente: Exportar',
    createProjectFromTemplate: 'Crear un proyecto aquí con esta plantilla e ir a Selección de dispositivos',
    noGAsFound: 'No se encontraron GA. Completa los dispositivos.',
    gasGenerated: 'GA generados. CSV es compatible con ETS 5/6.',
    etsCompatible: 'Compatible con ETS 5/6',
    downloadCSV: 'Descargar CSV',
    templateBuilderTitle: '1) Constructor de Plantilla',
    general: 'General',
    allOff: 'todo apagado',
    welcome: 'bienvenido',
    namePatternInfo: 'Patrón de Nombre: Los nombres GA se construyen automáticamente como: <planta.habitación> <nombre habitación> <tipo luminaria> <código interruptor> <función>. Planta.habitación solo se muestra si está lleno.',
    addObject: '+ Añadir Objeto',
    addMiddleGroup: '+ Añadir Grupo Medio',
    expandAll: 'Expandir Todo',
    collapseAll: 'Contraer Todo',
    changeMainGroup: 'Grupo Principal',
    changeAllMainGroupPrompt: 'Nuevo número de grupo principal para todos los grupos medios (actual: {current}):',
    middleGroupFull: 'Este grupo principal está lleno (máximo 8 grupos medios: 0-7)',
    addMainGroup: '+ Añadir Grupo Principal',
    addCustomGroup: '+ Añadir Grupo Personalizado',
    objectName: 'Nombre del Objeto',
    mainGroup: 'Grupo Principal',
    middleGroup: 'Grupo Medio',
    subGroup: 'Subgrupo',
    standard: '(por defecto)',
    scenesAutoGenerated: 'Las escenas se generan automáticamente por habitación (1 GA de escena por habitación).',
    centralAutoGenerated: 'Los objetos centrales se crean automáticamente por habitación (ej. "Todo Apagado").',
    saveAndToDevices: 'Guardar y a dispositivos',
    deviceConfigTitle: '3) Configuración de Dispositivos',
    actorCount: 'Número de actuadores',
    ofActorsAdded: 'de actuadores añadidos',
    saved: 'Guardado',
    duplicatePhysicalAddress: '¡La dirección física ya existe! Elija una dirección única.',
    unsavedChanges: 'Cambios sin guardar',
    physicalAddressRequired: 'La dirección física es obligatoria',
    physicalAddressFormatError: 'La dirección física debe tener la estructura: número1.número2.número3\ndonde número1 y número2 son 0-15 y número3 es 0-255.\nPor ejemplo: 1.1.40',
    actorCannotBeSavedNoChannels: 'Este actuador aún no se puede guardar porque el número de canales es 0.',
    actorCannotBeSavedNoData: 'Este actuador aún no se puede guardar porque no se han completado los datos.',
    roomAddressRequired: 'Piso.Habitación es obligatorio para canales usados',
    roomNameRequired: 'Nombre de habitación es obligatorio para canales usados',
    fixtureRequired: 'Tipo de lámpara / función es obligatorio para canales usados',
    saveChanges: 'Guardar cambios',
    saveZones: 'Guardar zonas',
    legend: 'Leyenda:',
    removeZone: 'Eliminar zona',
    zonesAdded: 'zonas añadidas',
    hvacZones: 'Clima / HVAC zonas',
    addClimateZonesDescription: 'Añadir zonas climáticas. Por zona, todas las GA climáticas se generan automáticamente según la plantilla',
    savedZone: 'Zona Guardada',
    zoneNumber: 'Zona',
    allClimateGAsGeneratedAutomatically: 'Todas las GA climáticas se generan automáticamente según la plantilla.',
    floorRoomExample: 'Piso.Habitación → ej. -1.1 (sótano habitación 1), 0.1 (planta baja habitación 1), 1.4 (primera planta habitación 4)',
    roomNameExample: 'Nombre de habitación → texto, ej. "Entrada"',
    newObject: 'Nuevo Grupo Medio',
    switchDescription: 'Funciones Encendido/Apagado con estado',
    dimmerDescription: 'Atenuación, estado',
    blindDescription: 'Arriba/Abajo, lamas, detener, estado',
    hvacDescription: 'Zonas climáticas con todas las GA',
    centralDescription: 'Funciones centrales por habitación (requerido)',
    noTemplate: 'No hay plantilla cargada',
    selectDeviceTypes: 'Selecciona primero los tipos de dispositivos',
    template: 'Plantilla',
    project: 'Proyecto',
    created: 'Creado',
    columns: 'Columnas',
    valveControlType: 'Tipo de control de válvula',
    commentPatternHint: 'Usar tokens <physical>, <channel>',
    duplicateGroupsFound: 'Se encontraron combinaciones duplicadas de grupo principal y medio:',
    mainGroupRangeError: 'El grupo principal debe estar entre 0 y 31.',
    middleGroupRangeError: 'El grupo medio debe estar entre 0 y 7.',
    startGroupRangeError: 'El número de inicio debe estar entre 0 y 255.',
    addressingConfig: 'Configuración de Direccionamiento',
    addressingMode: 'Modo de Direccionamiento',
    mode1: 'MODO 1 – Función / Tipo / Dispositivo',
    mode2: 'MODO 2 – Planta / Función / Dispositivo',
    mode3: 'MODO 3 – Planta / Función / Dispositivo + Desplazamiento de Estado',
    mode1Description: 'Grupo Principal = Función, Grupo Medio = Tipo, Sub Grupo = Dispositivo',
    mode2Description: 'Grupo Principal = Planta, Grupo Medio = Función, Sub Grupo = Dispositivo',
    mode3Description: 'Grupo Principal = Planta, Grupo Medio = Función, Sub Grupo = Dispositivo (Estado = +desplazamiento)',
    functionNumber: 'Número de función',
    typeOnOff: 'Tipo Encendido/Apagado',
    typeStatus: 'Tipo Estado',
    statusOffset: 'Desplazamiento de estado',
    startChannelNumber: 'Número de canal inicial',
    channelIncrement: 'Canal +1 por dispositivo',
    addressPreview: 'Vista Previa de Dirección',
    exampleAddress: 'Ejemplo:',
    users: 'Usuarios',
    username: 'Nombre de usuario',
    usernamePlaceholder: 'Ingrese nombre de usuario',
    usernameMaxLength: 'El nombre de usuario puede contener un máximo de 28 caracteres',
    noUsername: 'Sin nombre de usuario',
    noUser: 'Sin usuario',
    noUserLoggedIn: 'Nadie ha iniciado sesión',
    setUsernameFirst: 'Por favor establezca un nombre de usuario primero para administrar proyectos',
    setUsernameFirstTemplates: 'Por favor establezca un nombre de usuario primero para administrar plantillas',
    projects: 'Proyectos',
    saveProject: 'Guardar Proyecto',
    importProject: 'Importar Proyecto',
    load: 'Cargar',
    showProjects: 'Mostrar Proyectos',
    hideProjects: 'Ocultar Proyectos',
    currentProject: 'Proyecto Actual',
    lastUpdated: 'Última Actualización',
    projectNamePlaceholder: 'Nombre del Proyecto',
    projectNameRequired: 'El nombre del proyecto es obligatorio',
    usernameRequired: 'El nombre de usuario es obligatorio',
    projectSaved: 'Proyecto guardado',
    projectSaveError: 'Error al guardar proyecto',
    projectLoaded: 'Proyecto cargado',
    projectLoadError: 'Error al cargar proyecto',
    confirmDeleteProject: '¿Está seguro de que desea eliminar "{name}"?',
    projectDeleted: 'Proyecto eliminado',
    projectExportError: 'Error al exportar proyecto',
    projectImported: 'Proyecto importado',
    projectImportError: 'Error al importar proyecto',
    noProject: 'No hay proyecto cargado',
    noProjects: 'No hay proyectos guardados',
    templates: 'Plantillas',
    importTemplate: 'Importar Plantilla',
    showTemplates: 'Mostrar Plantillas',
    hideTemplates: 'Ocultar Plantillas',
    currentTemplate: 'Plantilla Actual',
    templateNamePlaceholder: 'Nombre de la Plantilla',
    templateNameRequired: 'El nombre de la plantilla es obligatorio',
    templateSaved: 'Plantilla guardada',
    templateSaveError: 'Error al guardar plantilla',
    templateLoaded: 'Plantilla cargada',
    templateLoadError: 'Error al cargar plantilla',
    confirmDeleteTemplate: '¿Está seguro de que desea eliminar "{name}"?',
    templateDeleted: 'Plantilla eliminada',
    templateExportError: 'Error al exportar plantilla',
    templateImported: 'Plantilla importada',
    templateImportError: 'Error al importar plantilla',
    noTemplates: 'No hay plantillas guardadas',
    current: 'Actual',
    createNewUser: 'Crear Nuevo Usuario',
    userCreated: 'Usuario creado',
    templateHasChanges: 'Cambios en plantilla',
    showUsers: 'Mostrar Usuarios',
    hideUsers: 'Ocultar Usuarios',
    noUsers: 'Sin usuarios',
    confirmDeleteUser: '¿Está seguro de que desea eliminar al usuario "{name}"? Se eliminarán todas las plantillas y proyectos de este usuario.',
    userDeleted: 'Usuario eliminado',
    userDeleteError: 'Error al eliminar usuario',
    cannotDeleteCurrentUser: 'No puede eliminar el usuario actual',
    uploadLogo: 'Subir logo',
    changeLogo: 'Cambiar logo',
    selectLogo: 'Seleccionar logo',
    removeLogo: 'Eliminar',
    companyInfo: 'Información de la Empresa',
    companyName: 'Nombre de la Empresa',
    address: 'Dirección',
    postalCode: 'Código Postal',
    city: 'Ciudad',
    phone: 'Teléfono',
    email: 'Correo Electrónico',
    website: 'Sitio Web',
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    loginSubtitle: 'Seleccione un usuario o cree uno nuevo para comenzar',
    selectUser: 'Seleccionar usuario',
    pleaseLoginOrCreateUser: 'Inicie sesión a través del menú "Usuarios" en la barra lateral, o cree un nuevo usuario.',
    pleaseCreateUser: 'Cree un nuevo usuario a través del menú "Usuarios" en la barra lateral para comenzar.',
    createFirstUser: 'Crear primer usuario',
    noUsersYet: 'Aún no hay usuarios. Cree un nuevo usuario para comenzar.',
    whatDoYouWant: '¿Qué desea hacer?',
    openProject: 'Abrir un proyecto',
    openTemplate: 'Abrir una Plantilla',
    startNewTemplateByExample: 'Iniciar una nueva configuración de Plantilla por Ejemplo',
    selectProject: 'Seleccionar un proyecto',
    selectTemplate: 'Seleccionar una plantilla',
    noProjectsAvailable: 'No hay proyectos disponibles. Cree un proyecto primero.',
    noTemplatesAvailable: 'No hay plantillas disponibles. Cree una plantilla primero.',
    projectNameRequiredForDevices: 'Ingrese un nombre de proyecto para continuar agregando dispositivos.',
    reserve: 'reserva',
    unused: 'No utilizado',
    channelUnused: 'Canal no utilizado',
    confirm: 'Confirmar',
    dimGroup: 'Grupo de Atenuación',
    blindGroup: 'Grupo de Persiana / Toldo',
    analyzedPatternsPerMainFunction: 'Patrones Analizados por Función Principal',
    editPatterns: 'Editar Patrones',
    editCategory: 'Editar',
    notUsed: 'No utilizado',
    linkedToSwitching: 'Vinculado a Interruptor',
    analyzedPattern: 'Patrón Analizado:',
    pattern: 'Patrón:',
    mainGroupFixed: 'Grupo Principal: {main} (fijo)',
    middleGroupPattern: 'Patrón de Grupo Medio:',
    subGroupPattern: 'Patrón de Subgrupo:',
    sameForAllObjects: 'Igual para todos los objetos',
    differentPerObjectType: 'Diferente por tipo de objeto',
    incrementing: 'Incrementando (+1)',
    offset: 'Desplazamiento (+{value})',
    sequence: 'Secuencia',
    objectsPerDevice: 'Objetos por dispositivo: {count}',
    startSubGroup: 'Inicio de subgrupo: {sub}',
    exampleAddresses: 'Direcciones de Ejemplo:',
    example: 'Ejemplo:',
    object: 'Objeto',
    nextGroupAddress: 'Siguiente Dirección de Grupo',
    patternNotAnalyzed: 'Patrón aún no analizado',
    patternDimmingAndSwitching: 'Patrón de Atenuación e Interruptor:',
    patternDimming: 'Patrón de Atenuación:',
    dimmingUsesSameAddresses: 'La atenuación usa las mismas direcciones de grupo que el interruptor.',
    dimmingAndSwitchingUseSameAddresses: 'La atenuación y el interruptor usan las mismas direcciones de grupo.',
    skipSwitchingWhenUsingSameMainMiddleGroup: 'Cuando use interruptor y atenuación en el mismo grupo principal medio, omita el interruptor.',
    unusedObjectsInSwitchingGetDashName: 'Los objetos no utilizados en el interruptor obtienen el nombre ---',
    analyzeSwitchingFirst: 'Analice primero el interruptor para ver el patrón.',
    unnamed: 'Sin nombre',
    dimmingConfiguration: 'Configuración de Atenuación',
    useSameAddressesAsSwitching: '¿Usa las mismas direcciones de grupo para Atenuación que para Interruptor?',
    yesDimEqualsSwitching: 'Sí (atenuación = interruptor)',
    dimmingHasOwnAddresses: 'La atenuación tiene sus propias direcciones de grupo',
    onlyForDimming: 'Solo para Atenuación',
    forDimmingAndSwitching: 'Para Atenuación e Interruptor',
    unusedAddressesShownAs: 'Las direcciones de grupo no utilizadas se muestran como ---',
    editDimming: 'Editar Atenuación',
    allAddressValuesZero: 'Todos los valores de dirección son 0. Ingrese una dirección válida.',
    enterValidAddress: 'Ingrese una dirección válida.',
    blockedByHvacConfiguration: '(Bloqueado por configuración HVAC)',
    extraMainGroupsForZones: 'Grupos principales adicionales para zonas adicionales:',
    maxZones: 'máx {count} zonas',
    maximumNumberOfZones: 'Número máximo de zonas',
    seeTemplateSettings: 'ver configuración de plantilla',
    whenMiddleGroupIncrementIs1: 'Cuando el incremento del grupo medio es +1, se pueden crear un máximo de 8 zonas (grupo medio 0-7).',
    forExtraZonesNextMainGroup: 'Para zonas adicionales, se debe especificar un siguiente grupo principal.',
    theseMainGroupsBlockedInFixed: 'Estos grupos principales se bloquean automáticamente en las direcciones de grupo fijas.',
    ifYouSetMiddleGroupIncrementTo1: 'Si establece el incremento del grupo medio en +1, se pueden crear un máximo de 8 zonas (grupo medio 0-7).',
    forExtraZonesYouCanSpecifyNextMainGroup: 'Para zonas adicionales, puede especificar un siguiente grupo principal aquí.',
    exampleDeviceSwitching: '0.1 lámpara de pared entrada',
    exampleDeviceDimming: '0.1 lámpara de pared entrada',
    exampleDeviceShading: '0.2 cortina sala de estar',
    exampleDeviceHvac: '0.3 cocina',
    fullyUse: 'Usar completamente',
    basicUse: 'Uso básico',
    notUse: 'No usar',
    allObjectsGeneratedWithNames: 'Todos los objetos se generarán con nombres',
    noAddressesGeneratedForFunctionGroup: 'No se generarán direcciones para este grupo de funciones',
    continueButton: 'Continuar',
    selectThisOptionIfSameMainMiddleGroups: 'Seleccione esta opción si también utiliza los mismos grupos principales y medios para Regulación.',
    continueToOverview: 'Continuar al Resumen',
    omhoogOmlaag: 'Arriba/Abajo',
    positie: 'Posición',
    positieStatus: 'Estado de posición',
    lamellenPositie: 'Posición de lamas',
    lamellenStatus: 'Estado de posición de lamas',
    gemetenTemp1: 'Temp medida 1',
    gemetenTemp2: 'Temp medida 2',
    setpointStatus: 'temperatura establecida',
    modeStatus: 'estado del modo',
    valueStatus: 'estado del valor',
    noMainGroupsAvailable: 'No hay grupos principales disponibles. Todos los grupos principales están en uso o bloqueados.',
    mainGroupName: 'grupo principal',
    maxMiddleGroupsReached: 'Número máximo de grupos medios alcanzado (0-7) para este grupo principal. Todos los grupos medios están en uso o bloqueados.',
    middleGroupName: 'grupo medio',
    maxSubGroupsReached: 'Número máximo de subgrupos alcanzado (0-255) para este grupo medio. Todos los subgrupos están en uso o bloqueados.',
    middleGroupInUse: 'El grupo medio {value} ya está en uso por una función principal y no puede ser utilizado.',
    subGroupInUse: 'El subgrupo {value} ya está en uso por una función principal y no puede ser utilizado.',
    autoGenerateRoomAddresses: 'Generar automáticamente direcciones de grupo para habitaciones únicas (central y escenas)',
    autoGenerateRoomAddressesDescription: 'Cuando está habilitado, se crean automáticamente direcciones de grupo para cada habitación única en los grupos medios central y escenas. Las sub direcciones 0-99 en estos grupos medios se bloquean para edición manual. Las sub direcciones 100-255 permanecen disponibles para adición manual.',
    noFixedGroupAddresses: 'No hay direcciones de grupo fijas. Haga clic en "{addMainGroup}" para agregar una.',
    mainGroupLabel: 'Grupo Principal {main}: {name}',
    middleGroupLabel: 'Grupo Medio {middle}: {name}',
    remove: 'Eliminar',
    automaticallyGenerated: '(Generado automáticamente)',
    used: 'Usado',
    automatic: '(automático)',
    defaultObjectCannotDelete: 'Objeto predeterminado - solo se puede deshabilitar',
    fixed: '(Fijo)',
    standardCannotDelete: '(Estándar - solo se puede deshabilitar)',
    extraSubAddressesWarning: 'Hay {count} sub-dirección(es) adicional(es) en los grupos medios "central" o "escenas":\n\n{list}\n\nEstas serán eliminadas cuando se habilite la generación automática. ¿Está seguro?',
    sub: 'Sub',
    actions: 'Acciones',
    configureAddressStructure: 'Configure la estructura de direcciones de grupo completando un ejemplo por grupo principal.',
    startWizard: 'Iniciar Asistente',
    extraMainGroupsForZonesLabel: 'Grupos principales adicionales para zonas adicionales:',
    mainGroupMustBeBetween: 'El grupo principal debe estar entre 0 y 31 (actual: {current})',
    middleGroupMustBeBetween: 'El grupo medio debe estar entre 0 y 7 (actual: {current})',
    subGroupMustBeBetween: 'El subgrupo debe estar entre 0 y 255 (actual: {current})',
    groupAddressAlreadyUsed: 'La dirección de grupo {address} ya está en uso por {objectName} en el mismo grupo.',
    fillIncrementForExtraDevices: 'Complete el incremento para dispositivos/zonas adicionales. Al menos un incremento (Grupo Principal, Grupo Medio o Subgrupo) debe completarse.',
    extraObjectsNeedIncrement: 'Los objetos adicionales también deben tener un incremento. Complete el incremento para dispositivos/zonas adicionales.',
    extraObject: 'Objeto adicional',
    confirmDeleteGroup: '¿Está seguro de que desea eliminar "{name}"?',
    confirmRemoveDevicesWhenNotUsed: 'Si establece "{category}" como "no usar", se eliminarán todos los dispositivos {category} de la Configuración. ¿Está seguro de que desea continuar?',
    fixedGroupAddressesLabel: 'Direcciones de Grupo Fijas',
    startSubGroupLabel: 'Inicio de subgrupo: {sub}',
    extraObjects: 'Objetos Adicionales',
    addExtraObject: 'Agregar Objeto Adicional',
    templateConfiguration: 'Configuración de Plantilla',
    configureFixedAddressesAndViewPatterns: 'Configure las direcciones de grupo fijas y vea los patrones analizados por función principal.',
    templateConfigurationComplete: 'Configuración de Plantilla Completa',
    templateOverview: 'Resumen de Plantilla',
    noTeachByExampleConfig: 'No se encontró configuración de Teach by Example.',
    usage: 'Uso:',
    wizardConfiguration: 'Configuración del Asistente:',
    variable: 'Variable',
    floor: 'Planta',
    groupNameLabel: 'Nombre del Grupo:',
    groupNamePlaceholder: 'Ej. {category} planta baja o {category} 1er piso',
    groupNameOverwriteNote: 'Nota: el nombre del grupo solo se actualiza si sigue teniendo el valor predeterminado (atenuación o atenuación / interruptor). Un nombre personalizado se conserva.',
    note: 'Nota:',
    dimmingUsesSameAddressesAsSwitching: 'El regulador utiliza las mismas direcciones de grupo que el interruptor.',
    switchingUsesSameAddressesAsDimming: 'El interruptor utiliza las mismas direcciones de grupo que el regulador.',
    fillAddressesForBothSwitchingAndDimming: 'Complete aquí las direcciones que se utilizan tanto para el interruptor como para el regulador.',
    fillForOneDeviceZone: 'Complete todas las direcciones de grupo para un dispositivo/zona (formato M/M/S):',
    noteIncrementForExtraDevices: 'Para cada dispositivo/zona adicional, se debe completar el incremento del Grupo Principal, Grupo Medio y/o Subgrupo.',
    atLeastOneObjectMustHaveIncrement: 'Al menos un objeto debe tener un incremento.',
    mainGroupIncrement: 'Incremento del Grupo Principal',
    middleGroupIncrement: 'Incremento del Grupo Medio',
    subGroupIncrement: 'Incremento del Subgrupo',
    extraMainGroupsConfiguration: 'Configuración de grupos principales adicionales',
    blockedMainGroups: 'Grupos principales bloqueados:',
    fillAddressesForOneDeviceZone: 'Complete todas las direcciones de grupo para un dispositivo/zona (formato M/M/S):',
    addExtraGroup: 'Agregar Grupo {category} Extra',
    removeGroup: 'Eliminar Grupo',
    addExtraMainMiddleGroup: 'Agregar Grupo Principal/Medio Extra',
    configureCategory: 'Configurar {category}',
    howDoYouWantToUseThisFunctionGroup: '¿Cómo desea usar este grupo de funciones?',
    nextConfigureCategory: 'Siguiente: Configurar {category}',
    whichStructureDoYouUse: '¿Qué estructura utiliza?',
    newTemplateTeachByExample: 'Nueva Plantilla (Enseñar con Ejemplo)',
    whatShouldTemplateNameBe: '¿Cuál debe ser el nombre de la plantilla?',
    analyzePattern: 'Analizar Patrón',
    analyzeStructure: 'Analizar Estructura',
    defaultDimmerModel: 'Atenuador',
    defaultSwitchModel: 'Actuador de Interruptor',
    defaultBlindModel: 'Actuador de Persiana',
    updateAvailable: 'Actualización disponible',
    updateDescription: 'Hay una nueva versión disponible. ¿Quieres actualizar ahora?',
    updateInstall: 'Actualizar ahora',
    updateLater: 'Más tarde',
    updateChecking: 'Comprobando actualizaciones...',
    updateCheckButton: 'Comprobar actualizaciones',
    updateError: 'No se pudo comprobar actualizaciones',
    updateDownloading: 'Descargando actualización...',
    updateOffline: 'Sin conexión a internet. Comprobación de actualizaciones omitida.',
    updateRestart: 'La aplicación se reiniciará para instalar la actualización.'
  },
  fr: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    reset: 'Réinitialiser',
    continue: 'Continuer',
    back: 'Retour',
    next: 'Suivant',
    generate: 'Générer',
    export: 'Exporter',
    download: 'Télécharger',
    settings: 'Paramètres',
    navigation: 'Navigation',
    data: 'Données chargées',
    step1: 'Étape 1',
    step2: 'Étape 2',
    step3: 'Étape 3',
    step4: 'Étape 4',
    templateBuilder: 'Constructeur de Modèle',
    templateName: 'Nom du Modèle',
    addressStructure: 'Structure d\'Adresse',
    twoLevel: '2 niveaux (principal/groupe)',
    threeLevel: '3 niveaux (principal/moyen/groupe)',
    namePattern: 'Modèle de Nom',
    commentPattern: 'Modèle de Commentaire',
    saveAndContinue: 'Enregistrer et Continuer',
    resetToDefault: 'Réinitialiser par Défaut',
    switch: 'Interrupteur',
    dimmer: 'Variation',
    dali: 'Variation DALI',
    blind: 'Volet / Store',
    hvac: 'Climat / CVC',
    central: 'Objets Centraux',
    scene: 'Scènes',
    fixedGroupAddresses: 'Adresses de Groupe Fixes',
    manufacturer: 'Fabricant',
    model: 'Modèle',
    physicalAddress: 'Adresse Physique',
    channelCount: 'Nombre de Canaux',
    channels: 'Canaux',
    addOutput: '+ Sortie',
    addZone: '+ Zone',
    output: 'Sortie',
    zone: 'Zone',
    floorRoom: 'Étage.Pièce',
    roomName: 'Nom de Pièce',
    fixture: 'Type de Luminaire',
    switchCode: 'Code d\'Interrupteur',
    roomNamePlaceholder: 'hall',
    fixturePlaceholder: 'lumière murale',
    channel: 'Canal',
    dimMode: 'Mode Variation',
    type: 'Type',
    onOff: 'marche/arrêt',
    onOffStatus: 'marche/arrêt état',
    status: 'état',
    dimming: 'variation',
    value: 'valeur',
    upDown: 'haut/bas',
    stop: 'arrêt',
    slats: 'lames',
    measuredTemp: 'température mesurée',
    measuredTemp2: 'température mesurée 2',
    setpoint: 'température souhaitée',
    setTemperature: 'température réglée',
    mode: 'mode',
    valveControl: 'contrôle de vanne',
    valveControlStatus: 'état de contrôle de vanne',
    heatingActive: 'chauffage actif',
    coolingActive: 'refroidissement actif',
    setpointShift: 'décalage de température souhaitée',
    setpointShiftStatus: 'état de décalage de température souhaitée',
    fan: 'ventilateur',
    dayNight: 'jour / nuit',
    toggle: 'basculer',
    light: 'lumière',
    specialOptions: 'options spéciales',
    functions: 'fonctions',
    
    actual: 'actuel',
    actuator: 'actionneur',
    alarm: 'alarme',
    and: 'et',
    angle: 'angle',
    balance: 'balance',
    bass: 'basse',
    black: 'noir',
    blue: 'bleu',
    brightness: 'luminosité',
    brightnessDetector: 'détecteur de luminosité',
    brightnessSensor: 'capteur de luminosité',
    brown: 'marron',
    co2Sensor: 'capteur co2',
    color: 'couleur',
    colorTemp: 'temp couleur',
    colorTemperature: 'température de couleur',
    colour: 'couleur',
    comfort: 'confort',
    cooling: 'refroidissement',
    csvDescription: 'Encodage Windows-1252, délimiteur ;, 2 colonnes',
    date: 'date',
    dayOfWeek: 'jour de la semaine',
    decrement: 'diminution',
    dimmerSensor: 'variateur',
    disable: 'désactiver',
    doorContact: 'contact de porte',
    economy: 'économie',
    enable: 'activer',
    energy: 'énergie',
    error: 'erreur',
    fanSpeed: 'vitesse du ventilateur',
    fanStage: 'niveau de ventilation',
    fault: 'défaut',
    feedback: 'retour',
    fireDetector: 'détecteur d\'incendie',
    forExtraZonesYouCanSpecifyNextMainGroup: 'Pour les zones supplémentaires, vous pouvez indiquer un groupe principal suivant ici.',
    frequency: 'fréquence',
    gasDetector: 'détecteur de gaz',
    gray: 'gris',
    green: 'vert',
    grey: 'gris',
    heating: 'chauffage',
    heatingCoolingMode: 'mode chauffage/refroidissement',
    hueValue: 'valeur de teinte',
    humidity: 'humidité',
    humiditySensor: 'capteur d\'humidité',
    hvacMode: 'mode hvac',
    ifYouSetMiddleGroupIncrementTo1: 'Si vous réglez l\'incrément du groupe moyen sur +1, 8 zones au maximum peuvent être créées (groupe moyen 0-7).',
    increment: 'augmentation',
    leakageDetector: 'détecteur de fuite',
    lightSensor: 'capteur de lumière',
    lock: 'verrouiller',
    maximum: 'maximum',
    middleGroupIncrement1MaxZones: 'Avec incrément groupe moyen +1 : max {count} zones ({seeTemplateSettings})',
    minimum: 'minimum',
    motionDetector: 'détecteur de mouvement',
    motionSensor: 'capteur de mouvement',
    mute: 'muet',
    nextGroupAddressDimming: 'Adresse de groupe prochaine lampe dimmable / commutable',
    nextGroupAddressDimmingOnly: 'Adresse de groupe prochaine lampe dimmable',
    nextGroupAddressHvac: 'Adresse de groupe prochaine zone',
    nextGroupAddressShading: 'Adresse de groupe prochaine jalousie / store',
    nextGroupAddressSwitching: 'Adresse de groupe prochain interrupteur',
    nominal: 'nominal',
    not: 'pas',
    occupied: 'occupé',
    or: 'ou',
    orange: 'orange',
    pink: 'rose',
    position: 'position',
    power: 'puissance',
    powerFactor: 'facteur de puissance',
    presenceDetector: 'détecteur de présence',
    presenceSensor: 'capteur de présence',
    protection: 'protection',
    purple: 'violet',
    pushButton: 'bouton poussoir',
    rainSensor: 'capteur de pluie',
    recall: 'rappel',
    red: 'rouge',
    relay: 'relais',
    rgb: 'rgb',
    rgbValue: 'valeur rgb',
    rgbw: 'rgbw',
    rgbwValue: 'valeur rgbw',
    saturation: 'saturation',
    sceneNumber: 'numéro de scène',
    slatsPosition: 'position des lames',
    smokeDetector: 'détecteur de fumée',
    source: 'source',
    standby: 'standby',
    store: 'stocker',
    switchSensor: 'interrupteur',
    temperatureSensor: 'capteur de température',
    thermostat: 'thermostat',
    theseMainGroupsBlockedInFixed: 'Ces groupes principaux sont automatiquement bloqués dans les adresses de groupe fixes.',
    tilt: 'inclinaison',
    time: 'temps',
    treble: 'aigu',
    trigger: 'déclencheur',
    unlock: 'déverrouiller',
    valve: 'valve',
    ventilation: 'ventilation',
    voltage: 'tension',
    volume: 'volume',
    warning: 'avertissement',
    waterDetector: 'détecteur d\'eau',
    white: 'blanc',
    windSensor: 'capteur de vent',
    windowContact: 'contact de fenêtre',
    yellow: 'jaune',
    groupAddress: 'Adresse de Groupe',
    name: 'Nom',
    datapointType: 'Type de Point de Données',
    comment: 'Commentaire',
    generateGAs: 'Générer les Adresses de Groupe',
    exportCSV: 'Exporter CSV',
    exportPDF: 'Exporter PDF',
    generateInstallerPDF: 'Générer PDF Installateur',
    installerPDF: 'PDF Installateur',
    installerPdfQ1Title: 'Répartition des canaux du distributeur de sol',
    installerPdfQ1Text: 'Voulez-vous transmettre la répartition des canaux du distributeur de sol (actionneur(s)) à l\'installateur?',
    installerPdfQ2Title: 'Interrupteurs et détecteurs de mouvement',
    installerPdfQ2Text: 'Voulez-vous également transmettre les adresses physiques des interrupteurs et détecteurs de mouvement par pièce à l\'installateur?',
    installerPdfFloorDistributorTitle: 'Répartition des canaux du distributeur de sol',
    installerPdfFloorDistributorHint: 'Sélectionnez ce qui est utilisé et saisissez les données par zone.',
    installerPdfFloorDistributorModeLabel: 'Qu\'est-ce qui est utilisé?',
    installerPdfFloorDistributorMode_heating: 'Chauffage uniquement',
    installerPdfFloorDistributorMode_cooling: 'Refroidissement uniquement',
    installerPdfFloorDistributorMode_combined: 'Chauffage et refroidissement combinés (une vanne)',
    installerPdfFloorDistributorMode_separate: 'Chauffage et refroidissement avec commande séparée',
    installerPdfNoClimateZones: 'Aucune zone climatique trouvée. Configurez d\'abord le climat/CVC dans la configuration des appareils.',
    installerPdfHeatingPhysical: 'Adresse physique chauffage',
    installerPdfHeatingChannels: 'Canaux chauffage',
    installerPdfCoolingPhysical: 'Adresse physique refroidissement',
    installerPdfCoolingChannels: 'Canaux refroidissement',
    installerPdfCombinedPhysical: 'Adresse physique chauffage/refroidissement',
    installerPdfCombinedChannels: 'Canaux chauffage/refroidissement',
    installerPdfCombinedLabel: 'Chauffage/refroidissement',
    installerPdfChannelsLabel: 'Canaux',
    installerPdfSelectModeFirst: 'Sélectionnez d\'abord ce qui est utilisé.',
    installerPdfActuatorCount: 'Combien d\'actionneurs y a-t-il?',
    installerPdfActuator: 'Actionneur',
    installerPdfActuatorPosition: 'Position de montage',
    installerPdfActuatorPositionPlaceholder: 'ex. Cuisine, local chaudière',
    installerPdfActuatorChannelCount: 'Nombre de canaux',
    installerPdfChannelZoneMapping: 'Canal → Zone',
    installerPdfZoneNotAssigned: 'Non assigné',
    installerPdfActuatorValveWarning: 'Attention: nombre maximum de vannes par canal, voir les spécifications de l\'actionneur et des vannes utilisées.',
    installerPdfOptional: '(optionnel)',
    installerPdfRoomSwitchesTitle: 'Interrupteurs, détecteurs et autres composants par pièce',
    installerPdfRoomSwitchesHint: 'Saisissez les adresses physiques, position et type (interrupteur ou capteur) par pièce. Vous pouvez ajouter des composants supplémentaires.',
    installerPdfNoRooms: 'Aucune pièce trouvée. Configurez d\'abord les appareils avec les informations de pièce.',
    installerPdfPhysicalAddress: 'Adresse physique',
    installerPdfPosition: 'Position dans la pièce',
    installerPdfTypeSwitch: 'Interrupteur',
    installerPdfTypeSensor: 'Détecteur de mouvement',
    installerPdfTypeOther: 'Autre...',
    installerPdfTypeCustomPlaceholder: 'ex. Bouton-poussoir, Variateur',
    installerPdfAddComponent: 'Ajouter un composant',
    installerPdfFloorDistributorSection: 'Répartition des canaux du distributeur de sol',
    installerPdfRoomSwitchesSection: 'Interrupteurs, détecteurs et autres composants',
    installerPdfTypeLabel: 'Interrupteur/Détecteur',
    installerPdfLocation: 'Emplacement',
    installerPdfClimateSwitchesOptional: 'Climat et matériel de commutation optionnel.',
    yes: 'Oui',
    no: 'Non',
    device: 'Appareil',
    devices: 'Appareils',
    outputs: 'Sorties',
    zones: 'Zones',
    allGAs: 'Toutes les Adresses de Groupe',
    page: 'Page',
    selectDPT: 'Sélectionner DPT',
    searchDPT: 'Rechercher DPT...',
    appTitle: 'Générateur d\'Adresses de Groupe KNX',
    appDescription: 'Flux de type assistant: créez un modèle, choisissez les fonctions d\'actionneur utilisées, configurez les sorties et les zones climatiques, générez les AG et exportez CSV pour ETS.',
    stepTemplate: 'Modèle',
    stepDeviceSelection: 'Sélection d\'Appareil',
    stepConfiguration: 'Configuration',
    stepOverview: 'Vue d\'ensemble AG',
    stepExport: 'Export ETS',
    deviceSelectionTitle: '2) Sélection du Type d\'Appareil',
    deviceSelectionHint: 'Choisissez au moins 1 fonction principale',
    nextConfiguration: 'Suivant: Configuration',
    overviewTitle: '4) Construction Automatique AG',
    backToDevices: 'Retour aux appareils',
    nextExport: 'Suivant: Export',
    createProjectFromTemplate: 'Créer un projet ici avec ce modèle et aller à la sélection d\'appareils',
    noGAsFound: 'Aucune AG trouvée. Remplissez les appareils.',
    gasGenerated: 'AG générées. CSV compatible ETS 5/6.',
    etsCompatible: 'Compatible ETS 5/6',
    downloadCSV: 'Télécharger CSV',
    templateBuilderTitle: '1) Constructeur de Modèle',
    general: 'Général',
    allOff: 'tout éteindre',
    welcome: 'bienvenue',
    namePatternInfo: 'Modèle de nom: Les noms AG sont automatiquement construits comme: <étage.piece> <nom pièce> <type luminaire> <code interrupteur> <fonction>. Étage.piece n\'est affiché que s\'il est rempli.',
    addObject: '+ Ajouter Objet',
    addMiddleGroup: '+ Ajouter Groupe Moyen',
    expandAll: 'Tout Déplier',
    collapseAll: 'Tout Replier',
    changeMainGroup: 'Groupe Principal',
    changeAllMainGroupPrompt: 'Nouveau numéro de groupe principal pour tous les groupes moyens (actuel: {current}):',
    middleGroupFull: 'Ce groupe principal est plein (maximum 8 groupes moyens: 0-7)',
    addMainGroup: '+ Ajouter Groupe Principal',
    addCustomGroup: '+ Ajouter Groupe Personnalisé',
    objectName: 'Nom d\'Objet',
    mainGroup: 'Groupe Principal',
    middleGroup: 'Groupe Moyen',
    subGroup: 'Sous-groupe',
    standard: '(standard)',
    scenesAutoGenerated: 'Les scènes sont automatiquement générées par pièce (1 AG scène par pièce).',
    centralAutoGenerated: 'Les objets centraux sont automatiquement créés par pièce (ex. "Tout Éteindre").',
    saveAndToDevices: 'Enregistrer & vers Appareils',
    deviceConfigTitle: '3) Configuration d\'Appareil',
    actorCount: 'Nombre d\'Actionneurs',
    ofActorsAdded: 'd\'actionneurs ajoutés',
    saved: 'Enregistré',
    duplicatePhysicalAddress: 'L\'adresse physique existe déjà! Choisissez une adresse unique.',
    unsavedChanges: 'Modifications non enregistrées',
    physicalAddressRequired: 'L\'adresse physique est requise',
    physicalAddressFormatError: 'L\'adresse physique doit avoir la structure: nombre1.nombre2.nombre3\noù nombre1 et nombre2 sont 0-15 et nombre3 est 0-255.\nPar exemple: 1.1.40',
    actorCannotBeSavedNoChannels: 'Cet actionneur ne peut pas encore être enregistré car le nombre de canaux est 0.',
    actorCannotBeSavedNoData: 'Cet actionneur ne peut pas encore être enregistré car aucune donnée n\'a été remplie.',
    roomAddressRequired: 'Étage.Pièce est requis pour les canaux utilisés',
    roomNameRequired: 'Nom de la pièce est requis pour les canaux utilisés',
    fixtureRequired: 'Type de lampe / fonction est requis pour les canaux utilisés',
    saveChanges: 'Enregistrer les modifications',
    saveZones: 'Enregistrer les zones',
    legend: 'Légende:',
    removeZone: 'Supprimer la zone',
    zonesAdded: 'zones ajoutées',
    hvacZones: 'Climat / CVC zones',
    addClimateZonesDescription: 'Ajouter des zones climatiques. Par zone, toutes les AG climatiques sont automatiquement générées selon le modèle',
    savedZone: 'Zone Enregistrée',
    zoneNumber: 'Zone',
    allClimateGAsGeneratedAutomatically: 'Toutes les AG climatiques sont automatiquement générées selon le modèle.',
    floorRoomExample: 'Étage.Pièce → ex. -1.1 (cave pièce 1), 0.1 (rez-de-chaussée pièce 1), 1.4 (premier étage pièce 4)',
    roomNameExample: 'Nom de la pièce → texte, ex. "Entrée"',
    newObject: 'Nouveau Groupe Moyen',
    switchDescription: 'Fonctions Marche/Arrêt avec état',
    dimmerDescription: 'Variation, état',
    blindDescription: 'Haut/Bas, lames, arrêt, état',
    hvacDescription: 'Zones climatiques avec toutes les AG',
    centralDescription: 'Fonctions centrales par pièce (requis)',
    noTemplate: 'Aucun modèle chargé',
    selectDeviceTypes: 'Sélectionnez d\'abord les types d\'appareils',
    template: 'Modèle',
    project: 'Projet',
    created: 'Créé',
    columns: 'Colonnes',
    valveControlType: 'Type de contrôle de vanne',
    commentPatternHint: 'Utiliser les tokens <physical>, <channel>',
    duplicateGroupsFound: 'Combinaisons de groupes principaux et moyens en double trouvées:',
    mainGroupRangeError: 'Le groupe principal doit être entre 0 et 31.',
    middleGroupRangeError: 'Le groupe moyen doit être entre 0 et 7.',
    startGroupRangeError: 'Le numéro de départ doit être entre 0 et 255.',
    addressingConfig: 'Configuration d\'Adressage',
    addressingMode: 'Mode d\'Adressage',
    mode1: 'MODE 1 – Fonction / Type / Appareil',
    mode2: 'MODE 2 – Étage / Fonction / Appareil',
    mode3: 'MODE 3 – Étage / Fonction / Appareil + Décalage d\'État',
    mode1Description: 'Groupe Principal = Fonction, Groupe Moyen = Type, Sous Groupe = Appareil',
    mode2Description: 'Groupe Principal = Étage, Groupe Moyen = Fonction, Sous Groupe = Appareil',
    mode3Description: 'Groupe Principal = Étage, Groupe Moyen = Fonction, Sous Groupe = Appareil (État = +décalage)',
    functionNumber: 'Numéro de fonction',
    typeOnOff: 'Type Marche/Arrêt',
    typeStatus: 'Type État',
    statusOffset: 'Décalage d\'état',
    startChannelNumber: 'Numéro de canal de départ',
    channelIncrement: 'Canal +1 par appareil',
    addressPreview: 'Aperçu d\'Adresse',
    exampleAddress: 'Exemple:',
    users: 'Utilisateurs',
    username: 'Nom d\'utilisateur',
    usernamePlaceholder: 'Entrez le nom d\'utilisateur',
    usernameMaxLength: 'Le nom d\'utilisateur peut contenir un maximum de 28 caractères',
    noUsername: 'Aucun nom d\'utilisateur',
    noUser: 'Aucun utilisateur',
    noUserLoggedIn: 'Personne n\'est connecté',
    setUsernameFirst: 'Veuillez d\'abord définir un nom d\'utilisateur pour gérer les projets',
    setUsernameFirstTemplates: 'Veuillez d\'abord définir un nom d\'utilisateur pour gérer les modèles',
    projects: 'Projets',
    saveProject: 'Enregistrer le Projet',
    importProject: 'Importer le Projet',
    load: 'Charger',
    showProjects: 'Afficher les Projets',
    hideProjects: 'Masquer les Projets',
    currentProject: 'Projet Actuel',
    lastUpdated: 'Dernière Mise à Jour',
    projectNamePlaceholder: 'Nom du Projet',
    projectNameRequired: 'Le nom du projet est requis',
    usernameRequired: 'Le nom d\'utilisateur est requis',
    projectSaved: 'Projet enregistré',
    projectSaveError: 'Erreur lors de l\'enregistrement du projet',
    projectLoaded: 'Projet chargé',
    projectLoadError: 'Erreur lors du chargement du projet',
    confirmDeleteProject: 'Êtes-vous sûr de vouloir supprimer "{name}"?',
    projectDeleted: 'Projet supprimé',
    projectExportError: 'Erreur lors de l\'exportation du projet',
    projectImported: 'Projet importé',
    projectImportError: 'Erreur lors de l\'importation du projet',
    noProject: 'Aucun projet chargé',
    noProjects: 'Aucun projet enregistré',
    howToCreateProject: 'Comment créer un nouveau projet ?',
    howToCreateProjectInfo: 'Pour créer un nouveau projet, vous devez d\'abord avoir un modèle. Vous pouvez le faire en :\n\n1. Chargeant un modèle existant via le menu "Modèles" dans la barre latérale\n2. Créant un nouveau modèle via le menu "Modèles" dans la barre latérale\n\nUne fois que vous avez chargé un modèle, vous pouvez accéder à la sélection d\'appareils via le modèle pour créer un projet.',
    templates: 'Modèles',
    importTemplate: 'Importer le Modèle',
    showTemplates: 'Afficher les Modèles',
    hideTemplates: 'Masquer les Modèles',
    currentTemplate: 'Modèle Actuel',
    templateNamePlaceholder: 'Nom du Modèle',
    templateNameRequired: 'Le nom du modèle est requis',
    templateSaved: 'Modèle enregistré',
    templateSaveError: 'Erreur lors de l\'enregistrement du modèle',
    templateLoaded: 'Modèle chargé',
    templateLoadError: 'Erreur lors du chargement du modèle',
    confirmDeleteTemplate: 'Êtes-vous sûr de vouloir supprimer "{name}"?',
    templateDeleted: 'Modèle supprimé',
    templateExportError: 'Erreur lors de l\'exportation du modèle',
    templateImported: 'Modèle importé',
    templateImportError: 'Erreur lors de l\'importation du modèle',
    noTemplates: 'Aucun modèle chargé',
    current: 'Actuel',
    createNewUser: 'Créer un Nouvel Utilisateur',
    userCreated: 'Utilisateur créé',
    templateHasChanges: 'Modifications du modèle',
    showUsers: 'Afficher les Utilisateurs',
    hideUsers: 'Masquer les Utilisateurs',
    noUsers: 'Aucun utilisateur',
    confirmDeleteUser: 'Êtes-vous sûr de vouloir supprimer l\'utilisateur "{name}"? Tous les modèles et projets de cet utilisateur seront supprimés.',
    userDeleted: 'Utilisateur supprimé',
    userDeleteError: 'Erreur lors de la suppression de l\'utilisateur',
    cannotDeleteCurrentUser: 'Vous ne pouvez pas supprimer l\'utilisateur actuel',
    uploadLogo: 'Télécharger le logo',
    changeLogo: 'Changer le logo',
    selectLogo: 'Sélectionner le logo',
    removeLogo: 'Supprimer',
    companyInfo: 'Informations de l\'Entreprise',
    companyName: 'Nom de l\'Entreprise',
    address: 'Adresse',
    postalCode: 'Code Postal',
    city: 'Ville',
    phone: 'Téléphone',
    email: 'E-mail',
    website: 'Site Web',
    login: 'Connexion',
    logout: 'Déconnexion',
    loginSubtitle: 'Sélectionnez un utilisateur ou créez-en un nouveau pour commencer',
    selectUser: 'Sélectionner un utilisateur',
    pleaseLoginOrCreateUser: 'Connectez-vous via le menu "Utilisateurs" dans la barre latérale, ou créez un nouvel utilisateur.',
    pleaseCreateUser: 'Créez un nouvel utilisateur via le menu "Utilisateurs" dans la barre latérale pour commencer.',
    createFirstUser: 'Créer le premier utilisateur',
    noUsersYet: 'Aucun utilisateur n\'existe encore. Créez un nouvel utilisateur pour commencer.',
    whatDoYouWant: 'Que souhaitez-vous faire?',
    openProject: 'Ouvrir un projet',
    openTemplate: 'Ouvrir un Modèle',
    startNewTemplateByExample: 'Démarrer une nouvelle configuration de Modèle par Exemple',
    selectProject: 'Sélectionner un projet',
    selectTemplate: 'Sélectionner un modèle',
    noProjectsAvailable: 'Aucun projet disponible. Créez d\'abord un projet.',
    noTemplatesAvailable: 'Aucun modèle disponible. Créez d\'abord un modèle.',
    projectNameRequiredForDevices: 'Entrez un nom de projet pour continuer à ajouter des appareils.',
    reserve: 'réserve',
    unused: 'Non utilisé',
    channelUnused: 'Canal non utilisé',
    confirm: 'Confirmer',
    dimGroup: 'Groupe Variation',
    blindGroup: 'Groupe Volet / Store',
    analyzedPatternsPerMainFunction: 'Modèles Analysés par Fonction Principale',
    editPatterns: 'Modifier les Modèles',
    editCategory: 'Modifier',
    notUsed: 'Non utilisé',
    linkedToSwitching: 'Lié à l\'Interrupteur',
    analyzedPattern: 'Modèle Analysé:',
    pattern: 'Modèle:',
    mainGroupFixed: 'Groupe Principal: {main} (fixe)',
    middleGroupPattern: 'Modèle de Groupe Moyen:',
    subGroupPattern: 'Modèle de Sous-groupe:',
    sameForAllObjects: 'Identique pour tous les objets',
    differentPerObjectType: 'Différent par type d\'objet',
    incrementing: 'Incrémentation (+1)',
    offset: 'Décalage (+{value})',
    sequence: 'Séquence',
    objectsPerDevice: 'Objets par appareil: {count}',
    startSubGroup: 'Début du sous-groupe: {sub}',
    exampleAddresses: 'Adresses d\'Exemple:',
    example: 'Exemple:',
    object: 'Objet',
    nextGroupAddress: 'Adresse de Groupe Suivante',
    patternNotAnalyzed: 'Modèle pas encore analysé',
    patternDimmingAndSwitching: 'Modèle de Variation et Interrupteur:',
    dimmingUsesSameAddresses: 'La variation utilise les mêmes adresses de groupe que l\'interrupteur.',
    dimmingAndSwitchingUseSameAddresses: 'La variation et l\'interrupteur utilisent les mêmes adresses de groupe.',
    skipSwitchingWhenUsingSameMainMiddleGroup: 'Lorsque vous utilisez l\'interrupteur et la variation dans le même groupe principal moyen, ignorez l\'interrupteur.',
    unusedObjectsInSwitchingGetDashName: 'Les objets non utilisés dans l\'interrupteur obtiennent le nom ---',
    analyzeSwitchingFirst: 'Analysez d\'abord l\'interrupteur pour voir le modèle.',
    unnamed: 'Sans nom',
    dimmingConfiguration: 'Configuration de Variation',
    useSameAddressesAsSwitching: 'Utilisez-vous les mêmes adresses de groupe pour la Variation que pour l\'Interrupteur?',
    yesDimEqualsSwitching: 'Oui (variation = interrupteur)',
    dimmingHasOwnAddresses: 'La variation a ses propres adresses de groupe',
    onlyForDimming: 'Seulement pour la Variation',
    forDimmingAndSwitching: 'Pour la Variation et l\'Interrupteur',
    unusedAddressesShownAs: 'Les adresses de groupe non utilisées sont affichées comme ---',
    editDimming: 'Modifier la Variation',
    allAddressValuesZero: 'Toutes les valeurs d\'adresse sont 0. Entrez une adresse valide.',
    enterValidAddress: 'Entrez une adresse valide.',
    blockedByHvacConfiguration: '(Bloqué par la configuration CVC)',
    extraMainGroupsForZones: 'Groupes principaux supplémentaires pour zones supplémentaires:',
    maxZones: 'max {count} zones',
    maximumNumberOfZones: 'Nombre maximum de zones',
    seeTemplateSettings: 'voir les paramètres du modèle',
    fullyUse: 'Utiliser complètement',
    basicUse: 'Utilisation de base',
    notUse: 'Ne pas utiliser',
    allObjectsGeneratedWithNames: 'Tous les objets seront générés avec des noms',
    noAddressesGeneratedForFunctionGroup: 'Aucune adresse ne sera générée pour ce groupe de fonctions',
    continueButton: 'Continuer',
    selectThisOptionIfSameMainMiddleGroups: 'Sélectionnez cette option si vous utilisez également les mêmes groupes principaux et moyens pour le Variateur.',
    continueToOverview: 'Continuer vers l\'Aperçu',
    omhoogOmlaag: 'Haut/Bas',
    positie: 'Position',
    positieStatus: 'État de position',
    lamellenPositie: 'Position des lames',
    lamellenStatus: 'État de position des lames',
    gemetenTemp1: 'Temp mesurée 1',
    gemetenTemp2: 'Temp mesurée 2',
    setpointStatus: 'température réglée',
    modeStatus: 'état du mode',
    valueStatus: 'état de la valeur',
    noMainGroupsAvailable: 'Aucun groupe principal disponible. Tous les groupes principaux sont utilisés ou bloqués.',
    mainGroupName: 'groupe principal',
    maxMiddleGroupsReached: 'Nombre maximum de groupes moyens atteint (0-7) pour ce groupe principal. Tous les groupes moyens sont utilisés ou bloqués.',
    middleGroupName: 'groupe moyen',
    maxSubGroupsReached: 'Nombre maximum de sous-groupes atteint (0-255) pour ce groupe moyen. Tous les sous-groupes sont utilisés ou bloqués.',
    middleGroupInUse: 'Le groupe moyen {value} est déjà utilisé par une fonction principale et ne peut pas être utilisé.',
    subGroupInUse: 'Le sous-groupe {value} est déjà utilisé par une fonction principale et ne peut pas être utilisé.',
    autoGenerateRoomAddresses: 'Générer automatiquement les adresses de groupe pour les pièces uniques (central et scènes)',
    autoGenerateRoomAddressesDescription: 'Lorsqu\'il est activé, les adresses de groupe sont automatiquement créées pour chaque pièce unique dans les groupes moyens central et scènes. Les sous-adresses 0-99 dans ces groupes moyens sont ensuite bloquées pour l\'édition manuelle. Les sous-adresses 100-255 restent disponibles pour l\'ajout manuel.',
    noFixedGroupAddresses: 'Aucune adresse de groupe fixe. Cliquez sur "{addMainGroup}" pour en ajouter une.',
    mainGroupLabel: 'Groupe Principal {main}: {name}',
    middleGroupLabel: 'Groupe Moyen {middle}: {name}',
    remove: 'Supprimer',
    automaticallyGenerated: '(Généré automatiquement)',
    used: 'Utilisé',
    automatic: '(automatique)',
    defaultObjectCannotDelete: 'Objet par défaut - ne peut être que désactivé',
    fixed: '(Fixe)',
    standardCannotDelete: '(Standard - ne peut être que désactivé)',
    extraSubAddressesWarning: 'Il y a {count} sous-adresse(s) supplémentaire(s) dans les groupes moyens "central" ou "scènes":\n\n{list}\n\nCes adresses seront supprimées lorsque la génération automatique sera activée. Êtes-vous sûr?',
    sub: 'Sous',
    actions: 'Actions',
    configureAddressStructure: 'Configurez la structure des adresses de groupe en remplissant un exemple par groupe principal.',
    startWizard: 'Démarrer l\'Assistant',
    extraMainGroupsForZonesLabel: 'Groupes principaux supplémentaires pour zones supplémentaires:',
    mainGroupMustBeBetween: 'Le groupe principal doit être entre 0 et 31 (actuel: {current})',
    middleGroupMustBeBetween: 'Le groupe moyen doit être entre 0 et 7 (actuel: {current})',
    subGroupMustBeBetween: 'Le sous-groupe doit être entre 0 et 255 (actuel: {current})',
    groupAddressAlreadyUsed: 'L\'adresse de groupe {address} est déjà utilisée par {objectName} dans le même groupe.',
    fillIncrementForExtraDevices: 'Remplissez l\'incrément pour les appareils/zones supplémentaires. Au moins un incrément (Groupe Principal, Groupe Moyen ou Sous-groupe) doit être rempli.',
    extraObjectsNeedIncrement: 'Les objets supplémentaires doivent également avoir un incrément. Remplissez l\'incrément pour les appareils/zones supplémentaires.',
    extraObject: 'Objet supplémentaire',
    confirmDeleteGroup: 'Êtes-vous sûr de vouloir supprimer "{name}"?',
    confirmRemoveDevicesWhenNotUsed: 'Si vous définissez "{category}" sur "non utilisé", tous les dispositifs {category} seront supprimés de la Configuration. Êtes-vous sûr de vouloir continuer?',
    fixedGroupAddressesLabel: 'Adresses de Groupe Fixes',
    startSubGroupLabel: 'Début du sous-groupe: {sub}',
    extraObjects: 'Objets Supplémentaires',
    addExtraObject: 'Ajouter un Objet Supplémentaire',
    templateConfiguration: 'Configuration du Modèle',
    configureFixedAddressesAndViewPatterns: 'Configurez les adresses de groupe fixes et consultez les modèles analysés par fonction principale.',
    templateConfigurationComplete: 'Configuration du Modèle Complète',
    templateOverview: 'Aperçu du Modèle',
    noTeachByExampleConfig: 'Aucune configuration Teach by Example trouvée.',
    usage: 'Utilisation:',
    wizardConfiguration: 'Configuration de l\'Assistant:',
    variable: 'Variable',
    floor: 'Étage',
    groupNameLabel: 'Nom du Groupe:',
    groupNamePlaceholder: 'Ex. {category} rez-de-chaussée ou {category} 1er étage',
    groupNameOverwriteNote: 'Remarque : le nom du groupe n\'est mis à jour que s\'il a encore la valeur par défaut (variateur ou variateur / interrupteur). Un nom personnalisé est conservé.',
    note: 'Note:',
    dimmingUsesSameAddressesAsSwitching: 'Le variateur utilise les mêmes adresses de groupe que l\'interrupteur.',
    switchingUsesSameAddressesAsDimming: 'L\'interrupteur utilise les mêmes adresses de groupe que le variateur.',
    fillAddressesForBothSwitchingAndDimming: 'Remplissez ici les adresses utilisées à la fois pour l\'interrupteur et le variateur.',
    fillForOneDeviceZone: 'Remplissez toutes les adresses de groupe pour un appareil/zone (format M/M/S):',
    noteIncrementForExtraDevices: 'Pour chaque appareil/zone supplémentaire, l\'incrément du Groupe Principal, Groupe Moyen et/ou Sous-groupe doit être rempli.',
    atLeastOneObjectMustHaveIncrement: 'Au moins un objet doit avoir un incrément.',
    mainGroupIncrement: 'Incrément du Groupe Principal',
    middleGroupIncrement: 'Incrément du Groupe Moyen',
    subGroupIncrement: 'Incrément du Sous-groupe',
    extraMainGroupsConfiguration: 'Configuration des groupes principaux supplémentaires',
    blockedMainGroups: 'Groupes principaux bloqués:',
    fillAddressesForOneDeviceZone: 'Remplissez toutes les adresses de groupe pour un appareil/zone (format M/M/S):',
    addExtraGroup: 'Ajouter un Groupe {category} Supplémentaire',
    removeGroup: 'Supprimer le Groupe',
    addExtraMainMiddleGroup: 'Ajouter un Groupe Principal/Moyen Supplémentaire',
    configureCategory: 'Configurer {category}',
    howDoYouWantToUseThisFunctionGroup: 'Comment voulez-vous utiliser ce groupe de fonctions?',
    nextConfigureCategory: 'Suivant: Configurer {category}',
    whichStructureDoYouUse: 'Quelle structure utilisez-vous?',
    newTemplateTeachByExample: 'Nouveau Modèle (Enseigner par Exemple)',
    whatShouldTemplateNameBe: 'Quel doit être le nom du modèle?',
    analyzePattern: 'Analyser le Modèle',
    analyzeStructure: 'Analyser la Structure',
    defaultDimmerModel: 'Variateur',
    defaultSwitchModel: 'Actionneur d\'Interrupteur',
    defaultBlindModel: 'Actionneur de Store',
    updateAvailable: 'Mise à jour disponible',
    updateDescription: 'Une nouvelle version est disponible. Voulez-vous mettre à jour maintenant?',
    updateInstall: 'Mettre à jour maintenant',
    updateLater: 'Plus tard',
    updateChecking: 'Vérification des mises à jour...',
    updateCheckButton: 'Vérifier les mises à jour',
    updateError: 'Impossible de vérifier les mises à jour',
    updateDownloading: 'Téléchargement de la mise à jour...',
    updateOffline: 'Pas de connexion Internet. Vérification des mises à jour ignorée.',
    updateRestart: 'L\'application va redémarrer pour installer la mise à jour.'
  },
  de: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',
    reset: 'Zurücksetzen',
    continue: 'Weiter',
    back: 'Zurück',
    next: 'Weiter',
    generate: 'Generieren',
    export: 'Exportieren',
    download: 'Herunterladen',
    settings: 'Einstellungen',
    navigation: 'Navigation',
    data: 'Geladene Daten',
    step1: 'Schritt 1',
    step2: 'Schritt 2',
    step3: 'Schritt 3',
    step4: 'Schritt 4',
    templateBuilder: 'Template-Builder',
    templateName: 'Template-Name',
    addressStructure: 'Adressstruktur',
    twoLevel: '2 Ebenen (Haupt/Gruppe)',
    threeLevel: '3 Ebenen (Haupt/Mitte/Gruppe)',
    namePattern: 'Namensmuster',
    commentPattern: 'Kommentar-Muster',
    saveAndContinue: 'Speichern & Weiter',
    resetToDefault: 'Auf Standard zurücksetzen',
    switch: 'Schalten',
    dimmer: 'Dimmen',
    dali: 'DALI Dimmen',
    blind: 'Jalousie / Rollladen',
    hvac: 'Klima / HLK',
    central: 'Zentrale Objekte',
    scene: 'Szenen',
    fixedGroupAddresses: 'Feste Gruppenadressen',
    manufacturer: 'Hersteller',
    model: 'Modell',
    physicalAddress: 'Physikalische Adresse',
    channelCount: 'Kanalanzahl',
    channels: 'Kanäle',
    addOutput: '+ Ausgang',
    addZone: '+ Zone',
    output: 'Ausgang',
    zone: 'Zone',
    floorRoom: 'Etage.Raum',
    roomName: 'Raumname',
    fixture: 'Leuchten-Typ',
    switchCode: 'Schaltcode',
    roomNamePlaceholder: 'Halle',
    fixturePlaceholder: 'Wandlampe',
    channel: 'Kanal',
    dimMode: 'Dimm-Modus',
    type: 'Typ',
    onOff: 'Ein/Aus',
    onOffStatus: 'Ein/Aus Status',
    status: 'Status',
    dimming: 'Dimmen',
    value: 'Wert',
    upDown: 'Auf/Ab',
    stop: 'Stopp',
    slats: 'Lamellen',
    measuredTemp: 'Gemessene Temperatur',
    measuredTemp2: 'Gemessene Temperatur 2',
    setpoint: 'gewünschte Temperatur',
    setTemperature: 'eingestellte Temperatur',
    mode: 'Modus',
    valveControl: 'Ventilsteuerung',
    valveControlStatus: 'Ventilsteuerung Status',
    control: 'Steuerung',
    heatingActive: 'Heizung aktiv',
    coolingActive: 'Kühlung aktiv',
    setpointShift: 'Verschiebung gewünschte Temperatur',
    fan: 'Lüfter',

    actual: 'aktuell',
    actuator: 'aktor',
    alarm: 'alarm',
    and: 'und',
    angle: 'winkel',
    balance: 'balance',
    bass: 'bass',
    black: 'schwarz',
    blue: 'blau',
    brightness: 'helligkeit',
    brightnessDetector: 'helligkeitsdetektor',
    brightnessSensor: 'helligkeitssensor',
    brown: 'braun',
    co2Sensor: 'co2 sensor',
    color: 'farbe',
    colorTemp: 'farbtemp',
    colorTemperature: 'farbtemperatur',
    colour: 'farbe',
    comfort: 'komfort',
    cooling: 'kühlung',
    csvDescription: 'Windows-1252 Kodierung, Trennzeichen ;, 2 Spalten',
    date: 'datum',
    dayOfWeek: 'wochentag',
    decrement: 'verringerung',
    dimmerSensor: 'dimmer',
    disable: 'deaktivieren',
    doorContact: 'türkontakt',
    economy: 'economy',
    enable: 'aktivieren',
    energy: 'energie',
    error: 'fehler',
    fanSpeed: 'lüftergeschwindigkeit',
    fanStage: 'lüfterstufe',
    fault: 'störung',
    feedback: 'rückmeldung',
    fireDetector: 'brandmelder',
    frequency: 'frequenz',
    gasDetector: 'gasmelder',
    gray: 'grau',
    green: 'grün',
    grey: 'grau',
    heating: 'heizung',
    heatingCoolingMode: 'heiz-/kühlmodus',
    dayNight: 'tag / nacht',
    toggle: 'umschalten',
    light: 'lampe',
    specialOptions: 'besondere Optionen',
    functions: 'Funktionen',
    hueValue: 'farbton wert',
    humidity: 'luftfeuchtigkeit',
    humiditySensor: 'feuchtigkeitssensor',
    hvacMode: 'hvac modus',
    increment: 'erhöhung',
    leakageDetector: 'leckagemelder',
    lightSensor: 'lichtsensor',
    lock: 'sperren',
    maximum: 'maximum',
    middleGroupIncrement1MaxZones: 'Bei Mittelgruppen-Inkrement +1: max. {count} Zonen ({seeTemplateSettings})',
    minimum: 'minimum',
    motionDetector: 'bewegungsmelder',
    motionSensor: 'bewegungssensor',
    mute: 'stumm',
    nextGroupAddressDimming: 'Gruppenadresse nächste dimmbare / schaltbare Lampe',
    nextGroupAddressDimmingOnly: 'Gruppenadresse nächste dimmbare Lampe',
    nextGroupAddressHvac: 'Gruppenadresse nächste Zone',
    nextGroupAddressShading: 'Gruppenadresse nächste Jalousie / Rollladen',
    nextGroupAddressSwitching: 'Gruppenadresse nächste Schaltung',
    nominal: 'nominal',
    not: 'nicht',
    occupied: 'besetzt',
    or: 'oder',
    orange: 'orange',
    pink: 'rosa',
    position: 'position',
    power: 'leistung',
    powerFactor: 'leistungsfaktor',
    presenceDetector: 'anwesenheitsmelder',
    presenceSensor: 'anwesenheitssensor',
    protection: 'schutz',
    purple: 'lila',
    pushButton: 'drucktaste',
    rainSensor: 'regensensor',
    recall: 'abruf',
    red: 'rot',
    relay: 'relais',
    rgb: 'rgb',
    rgbValue: 'rgb wert',
    rgbw: 'rgbw',
    rgbwValue: 'rgbw wert',
    saturation: 'sättigung',
    sceneNumber: 'szene nummer',
    slatsPosition: 'lamellenposition',
    smokeDetector: 'rauchmelder',
    source: 'quelle',
    standby: 'standby',
    store: 'speichern',
    switchSensor: 'schalter',
    temperatureSensor: 'temperatursensor',
    thermostat: 'thermostat',
    tilt: 'neigung',
    time: 'zeit',
    treble: 'höhen',
    trigger: 'trigger',
    unlock: 'entsperren',
    valve: 'ventil',
    ventilation: 'lüftung',
    voltage: 'spannung',
    volume: 'lautstärke',
    warning: 'warnung',
    waterDetector: 'wassermelder',
    white: 'weiß',
    windSensor: 'windsensor',
    windowContact: 'fensterkontakt',
    yellow: 'gelb',
    groupAddress: 'Gruppenadresse',
    name: 'Name',
    datapointType: 'Datentyp',
    comment: 'Kommentar',
    generateGAs: 'Gruppenadressen generieren',
    exportCSV: 'CSV exportieren',
    exportPDF: 'PDF exportieren',
    generateInstallerPDF: 'Installateur-PDF generieren',
    installerPDF: 'Installateur-PDF',
    installerPdfQ1Title: 'Kanalverteilung Fußbodenverteiler',
    installerPdfQ1Text: 'Möchten Sie die Kanalverteilung des Fußbodenverteiler-Aktors/der Aktoren an den Installateur weitergeben?',
    installerPdfQ2Title: 'Schalter und Bewegungsmelder',
    installerPdfQ2Text: 'Möchten Sie auch die physischen Adressen der Schalter und Bewegungsmelder pro Raum an den Installateur weitergeben?',
    installerPdfFloorDistributorTitle: 'Kanalverteilung Fußbodenverteiler',
    installerPdfFloorDistributorHint: 'Wählen Sie, was verwendet wird, und geben Sie die Daten pro Zone ein.',
    installerPdfFloorDistributorModeLabel: 'Was wird verwendet?',
    installerPdfFloorDistributorMode_heating: 'Nur Heizung',
    installerPdfFloorDistributorMode_cooling: 'Nur Kühlung',
    installerPdfFloorDistributorMode_combined: 'Heizung und Kühlung gemeinsam (eine Ventilsteuerung)',
    installerPdfFloorDistributorMode_separate: 'Heizung und Kühlung mit getrennter Steuerung',
    installerPdfNoClimateZones: 'Keine Klimazonen gefunden. Konfigurieren Sie zuerst Klima/HVAC in der Gerätekonfiguration.',
    installerPdfHeatingPhysical: 'Physische Adresse Heizung',
    installerPdfHeatingChannels: 'Kanäle Heizung',
    installerPdfCoolingPhysical: 'Physische Adresse Kühlung',
    installerPdfCoolingChannels: 'Kanäle Kühlung',
    installerPdfCombinedPhysical: 'Physische Adresse Heizung/Kühlung',
    installerPdfCombinedChannels: 'Kanäle Heizung/Kühlung',
    installerPdfCombinedLabel: 'Heizung/Kühlung',
    installerPdfChannelsLabel: 'Kanäle',
    installerPdfSelectModeFirst: 'Wählen Sie zuerst, was verwendet wird.',
    installerPdfActuatorCount: 'Wie viele Aktoren gibt es?',
    installerPdfActuator: 'Aktor',
    installerPdfActuatorPosition: 'Montageposition',
    installerPdfActuatorPositionPlaceholder: 'z.B. Küche, Heizungsraum',
    installerPdfActuatorChannelCount: 'Anzahl Kanäle',
    installerPdfChannelZoneMapping: 'Kanal → Zone',
    installerPdfZoneNotAssigned: 'Nicht zugewiesen',
    installerPdfActuatorValveWarning: 'Hinweis: maximale Anzahl Ventile pro Kanal, siehe Aktor-Spezifikationen und Spezifikationen der verwendeten Ventile.',
    installerPdfOptional: '(optional)',
    installerPdfRoomSwitchesTitle: 'Schalter, Melder und andere Komponenten pro Raum',
    installerPdfRoomSwitchesHint: 'Geben Sie pro Raum physische Adressen, Position und Typ (Schalter oder Sensor) ein. Sie können zusätzliche Komponenten hinzufügen.',
    installerPdfNoRooms: 'Keine Räume gefunden. Konfigurieren Sie zuerst Geräte mit Rauminformationen.',
    installerPdfPhysicalAddress: 'Physische Adresse',
    installerPdfPosition: 'Position im Raum',
    installerPdfTypeSwitch: 'Schalter',
    installerPdfTypeSensor: 'Bewegungsmelder',
    installerPdfTypeOther: 'Andere...',
    installerPdfTypeCustomPlaceholder: 'z.B. Taster, Dimmer',
    installerPdfAddComponent: 'Komponente hinzufügen',
    installerPdfFloorDistributorSection: 'Kanalverteilung Fußbodenverteiler',
    installerPdfRoomSwitchesSection: 'Schalter, Melder und andere Komponenten',
    installerPdfTypeLabel: 'Schalter/Melder',
    installerPdfLocation: 'Standort',
    installerPdfClimateSwitchesOptional: 'Klima und Schaltmaterial optional.',
    yes: 'Ja',
    no: 'Nein',
    device: 'Gerät',
    devices: 'Geräte',
    outputs: 'Ausgänge',
    zones: 'Zonen',
    allGAs: 'Alle Gruppenadressen',
    page: 'Seite',
    selectDPT: 'DPT auswählen',
    searchDPT: 'DPT suchen...',
    appTitle: 'KNX Gruppenadressen-Generator',
    appDescription: 'Assistenten-Flow: Template erstellen, verwendete Aktor-Funktionen wählen, Ausgänge und Klimazonen konfigurieren, GA\'s generieren und CSV für ETS exportieren.',
    stepTemplate: 'Template',
    stepDeviceSelection: 'Geräteauswahl',
    stepConfiguration: 'Konfiguration',
    stepOverview: 'GA-Übersicht',
    stepExport: 'ETS-Export',
    deviceSelectionTitle: '2) Gerätetyp-Auswahl',
    deviceSelectionHint: 'Wählen Sie mindestens 1 Hauptfunktion',
    nextConfiguration: 'Weiter: Konfiguration',
    overviewTitle: '4) Automatische GA-Erstellung',
    backToDevices: 'Zurück zu Geräten',
    nextExport: 'Weiter: Export',
    createProjectFromTemplate: 'Erstellen Sie hier ein Projekt mit dieser Vorlage und gehen Sie zur Geräteauswahl',
    noGAsFound: 'Keine GA\'s gefunden. Geräte ausfüllen.',
    gasGenerated: 'GA\'s generiert. CSV ist ETS 5/6 kompatibel.',
    etsCompatible: 'ETS 5/6 kompatibel',
    downloadCSV: 'CSV herunterladen',
    templateBuilderTitle: '1) Template-Builder',
    general: 'Allgemein',
    allOff: 'alles aus',
    welcome: 'willkommen',
    namePatternInfo: 'Namensmuster: Die GA-Namen werden automatisch erstellt als: <Etage.Raum> <Raumname> <Leuchten-Typ> <Schaltcode> <Funktion>. Etage.Raum wird nur angezeigt, wenn ausgefüllt.',
    addObject: '+ Objekt hinzufügen',
    addMiddleGroup: '+ Mittelgruppe hinzufügen',
    expandAll: 'Alles ausklappen',
    collapseAll: 'Alles einklappen',
    changeMainGroup: 'Hauptgruppe',
    changeAllMainGroupPrompt: 'Neue Hauptgruppen-Nummer für alle Mittelgruppen (aktuell: {current}):',
    middleGroupFull: 'Diese Hauptgruppe ist voll (maximal 8 Mittelgruppen: 0-7)',
    addMainGroup: '+ Hauptgruppe hinzufügen',
    addCustomGroup: '+ Zusätzliche Hauptgruppe hinzufügen',
    objectName: 'Objektname',
    mainGroup: 'Hauptgruppe',
    middleGroup: 'Mittelgruppe',
    subGroup: 'Untergruppe',
    standard: '(Standard)',
    scenesAutoGenerated: 'Szenen werden automatisch pro Raum generiert (1 Szenen-GA pro Raum).',
    centralAutoGenerated: 'Zentrale Objekte werden automatisch pro Raum erstellt (z.B. "Alles Aus").',
    saveAndToDevices: 'Speichern & zu Geräten',
    deviceConfigTitle: '3) Gerätekonfiguration',
    actorCount: 'Anzahl Aktoren',
    ofActorsAdded: 'von Aktoren hinzugefügt',
    saved: 'Gespeichert',
    duplicatePhysicalAddress: 'Physikalische Adresse existiert bereits! Wählen Sie eine eindeutige Adresse.',
    unsavedChanges: 'Nicht gespeicherte Änderungen',
    physicalAddressRequired: 'Physikalische Adresse ist erforderlich',
    physicalAddressFormatError: 'Die physikalische Adresse muss die Struktur haben: Zahl1.Zahl2.Zahl3\nwobei Zahl1 und Zahl2 0-15 sind und Zahl3 0-255 ist.\nZum Beispiel: 1.1.40',
    actorCannotBeSavedNoChannels: 'Dieser Aktor kann noch nicht gespeichert werden, da die Kanalanzahl 0 ist.',
    actorCannotBeSavedNoData: 'Dieser Aktor kann noch nicht gespeichert werden, da noch keine Daten eingegeben wurden.',
    roomAddressRequired: 'Etage.Raum ist für verwendete Kanäle erforderlich',
    roomNameRequired: 'Raumname ist für verwendete Kanäle erforderlich',
    fixtureRequired: 'Leuchtentyp / Funktion ist für verwendete Kanäle erforderlich',
    saveChanges: 'Änderungen speichern',
    saveZones: 'Zonen speichern',
    legend: 'Legende:',
    removeZone: 'Zone entfernen',
    zonesAdded: 'Zonen hinzugefügt',
    hvacZones: 'Klima / HLK Zonen',
    addClimateZonesDescription: 'Klimazonen hinzufügen. Pro Zone werden automatisch alle Klima-GA\'s gemäß der Vorlage generiert',
    savedZone: 'Gespeicherte Zone',
    zoneNumber: 'Zone',
    allClimateGAsGeneratedAutomatically: 'Alle Klima-GA\'s werden automatisch gemäß der Vorlage generiert.',
    floorRoomExample: 'Etage.Raum → z.B. -1.1 (Keller Raum 1), 0.1 (Erdgeschoss Raum 1), 1.4 (erste Etage Raum 4)',
    roomNameExample: 'Raumname → Text, z.B. "Halle"',
    newObject: 'Neue Mittelgruppe',
    switchDescription: 'Ein/Aus-Funktionen mit Status',
    dimmerDescription: 'Dimmen, Status',
    blindDescription: 'Auf/Ab, Lamellen, Stopp, Status',
    hvacDescription: 'Klimazonen mit allen GA\'s',
    centralDescription: 'Zentrale Funktionen pro Raum (erforderlich)',
    noTemplate: 'Kein Template geladen',
    selectDeviceTypes: 'Wählen Sie zuerst Gerätetypen',
    template: 'Template',
    project: 'Projekt',
    created: 'Erstellt',
    columns: 'Spalten',
    valveControlType: 'Ventilsteuerungstyp',
    commentPatternHint: 'Verwenden Sie Tokens <physical>, <channel>',
    duplicateGroupsFound: 'Doppelte Haupt- und Mittelgruppen-Kombinationen gefunden:',
    mainGroupRangeError: 'Hauptgruppe muss zwischen 0 und 31 sein.',
    middleGroupRangeError: 'Mittelgruppe muss zwischen 0 und 7 sein.',
    startGroupRangeError: 'Startnummer muss zwischen 0 und 255 sein.',
    addressingConfig: 'Adressierungs-Konfiguration',
    addressingMode: 'Adressierungsmodus',
    mode1: 'MODE 1 – Funktion / Typ / Gerät',
    mode2: 'MODE 2 – Etage / Funktion / Gerät',
    mode3: 'MODE 3 – Etage / Funktion / Gerät + Status-Offset',
    mode1Description: 'Hauptgruppe = Funktion, Mittelgruppe = Typ, Untergruppe = Gerät',
    mode2Description: 'Hauptgruppe = Etage, Mittelgruppe = Funktion, Untergruppe = Gerät',
    mode3Description: 'Hauptgruppe = Etage, Mittelgruppe = Funktion, Untergruppe = Gerät (Status = +Offset)',
    functionNumber: 'Funktionsnummer',
    typeOnOff: 'Typ Ein/Aus',
    typeStatus: 'Typ Status',
    statusOffset: 'Status-Offset',
    startChannelNumber: 'Start-Kanalnummer',
    channelIncrement: 'Kanal +1 pro Gerät',
    addressPreview: 'Adress-Vorschau',
    exampleAddress: 'Beispiel:',
    users: 'Benutzer',
    username: 'Benutzername',
    usernamePlaceholder: 'Benutzernamen eingeben',
    usernameMaxLength: 'Der Benutzername darf maximal 28 Zeichen enthalten',
    noUsername: 'Kein Benutzername',
    noUser: 'Kein Benutzer',
    noUserLoggedIn: 'Niemand ist angemeldet',
    setUsernameFirst: 'Bitte setzen Sie zuerst einen Benutzernamen, um Projekte zu verwalten',
    setUsernameFirstTemplates: 'Bitte setzen Sie zuerst einen Benutzernamen, um Templates zu verwalten',
    projects: 'Projekte',
    saveProject: 'Projekt speichern',
    importProject: 'Projekt importieren',
    load: 'Laden',
    showProjects: 'Projekte anzeigen',
    hideProjects: 'Projekte ausblenden',
    currentProject: 'Aktuelles Projekt',
    lastUpdated: 'Zuletzt aktualisiert',
    projectNamePlaceholder: 'Projektname',
    projectNameRequired: 'Projektname ist erforderlich',
    usernameRequired: 'Benutzername ist erforderlich',
    projectSaved: 'Projekt gespeichert',
    projectSaveError: 'Fehler beim Speichern des Projekts',
    projectLoaded: 'Projekt geladen',
    projectLoadError: 'Fehler beim Laden des Projekts',
    confirmDeleteProject: 'Sind Sie sicher, dass Sie "{name}" löschen möchten?',
    projectDeleted: 'Projekt gelöscht',
    projectExportError: 'Fehler beim Exportieren des Projekts',
    projectImported: 'Projekt importiert',
    projectImportError: 'Fehler beim Importieren des Projekts',
    noProject: 'Kein Projekt geladen',
    noProjects: 'Keine Projekte gespeichert',
    howToCreateProject: 'Wie erstellt man ein neues Projekt?',
    howToCreateProjectInfo: 'Um ein neues Projekt zu erstellen, müssen Sie zuerst eine Vorlage haben. Sie können dies tun, indem Sie:\n\n1. Eine bestehende Vorlage über das Menü "Vorlagen" in der Seitenleiste laden\n2. Eine neue Vorlage über das Menü "Vorlagen" in der Seitenleiste erstellen\n\nSobald Sie eine Vorlage geladen haben, können Sie über die Vorlage zur Geräteauswahl gehen, um ein Projekt zu erstellen.',
    templates: 'Templates',
    importTemplate: 'Template importieren',
    showTemplates: 'Templates anzeigen',
    hideTemplates: 'Templates ausblenden',
    currentTemplate: 'Aktuelles Template',
    templateNamePlaceholder: 'Template-Name',
    templateNameRequired: 'Template-Name ist erforderlich',
    templateSaved: 'Template gespeichert',
    templateSaveError: 'Fehler beim Speichern des Templates',
    templateLoaded: 'Template geladen',
    templateLoadError: 'Fehler beim Laden des Templates',
    confirmDeleteTemplate: 'Sind Sie sicher, dass Sie "{name}" löschen möchten?',
    templateDeleted: 'Template gelöscht',
    templateExportError: 'Fehler beim Exportieren des Templates',
    templateImported: 'Template importiert',
    templateImportError: 'Fehler beim Importieren des Templates',
    noTemplates: 'Keine Templates geladen',
    current: 'Aktuell',
    createNewUser: 'Neuen Benutzer erstellen',
    userCreated: 'Benutzer erstellt',
    templateHasChanges: 'Template-Änderungen',
    showUsers: 'Benutzer anzeigen',
    hideUsers: 'Benutzer ausblenden',
    noUsers: 'Keine Benutzer',
    confirmDeleteUser: 'Sind Sie sicher, dass Sie Benutzer "{name}" löschen möchten? Alle Templates und Projekte für diesen Benutzer werden gelöscht.',
    userDeleted: 'Benutzer gelöscht',
    userDeleteError: 'Fehler beim Löschen des Benutzers',
    cannotDeleteCurrentUser: 'Sie können den aktuellen Benutzer nicht löschen',
    uploadLogo: 'Logo hochladen',
    changeLogo: 'Logo ändern',
    selectLogo: 'Logo auswählen',
    removeLogo: 'Entfernen',
    companyInfo: 'Firmeninformationen',
    companyName: 'Firmenname',
    address: 'Adresse',
    postalCode: 'Postleitzahl',
    city: 'Stadt',
    phone: 'Telefon',
    email: 'E-Mail',
    website: 'Website',
    login: 'Anmelden',
    logout: 'Abmelden',
    loginSubtitle: 'Wählen Sie einen Benutzer oder erstellen Sie einen neuen, um zu beginnen',
    selectUser: 'Benutzer auswählen',
    pleaseLoginOrCreateUser: 'Melden Sie sich über das Menü "Benutzer" in der Seitenleiste an oder erstellen Sie einen neuen Benutzer.',
    pleaseCreateUser: 'Erstellen Sie einen neuen Benutzer über das Menü "Benutzer" in der Seitenleiste, um zu beginnen.',
    createFirstUser: 'Ersten Benutzer erstellen',
    noUsersYet: 'Es gibt noch keine Benutzer. Erstellen Sie einen neuen Benutzer, um zu beginnen.',
    whatDoYouWant: 'Was möchten Sie tun?',
    openProject: 'Ein Projekt öffnen',
    openTemplate: 'Eine Vorlage öffnen',
    startNewTemplateByExample: 'Eine neue Vorlage-by-Example-Konfiguration starten',
    selectProject: 'Ein Projekt auswählen',
    selectTemplate: 'Eine Vorlage auswählen',
    noProjectsAvailable: 'Keine Projekte verfügbar. Erstellen Sie zuerst ein Projekt.',
    noTemplatesAvailable: 'Keine Vorlagen verfügbar. Erstellen Sie zuerst eine Vorlage.',
    projectNameRequiredForDevices: 'Geben Sie einen Projektnamen ein, um mit dem Hinzufügen von Geräten fortzufahren.',
    reserve: 'Reserve',
    unused: 'Nicht verwendet',
    channelUnused: 'Kanal nicht verwendet',
    confirm: 'Bestätigen',
    dimGroup: 'Dimm-Gruppe',
    blindGroup: 'Jalousie / Rollladen Gruppe',
    analyzedPatternsPerMainFunction: 'Analysierte Muster pro Hauptfunktion',
    editPatterns: 'Muster Bearbeiten',
    editCategory: 'Bearbeiten',
    notUsed: 'Nicht verwendet',
    linkedToSwitching: 'Verknüpft mit Schalten',
    analyzedPattern: 'Analysiertes Muster:',
    pattern: 'Muster:',
    mainGroupFixed: 'Hauptgruppe: {main} (fest)',
    middleGroupPattern: 'Mittelgruppen-Muster:',
    subGroupPattern: 'Untergruppen-Muster:',
    sameForAllObjects: 'Gleich für alle Objekte',
    differentPerObjectType: 'Unterschiedlich pro Objekttyp',
    incrementing: 'Aufsteigend (+1)',
    offset: 'Offset (+{value})',
    sequence: 'Reihenfolge',
    objectsPerDevice: 'Objekte pro Gerät: {count}',
    startSubGroup: 'Start Untergruppe: {sub}',
    exampleAddresses: 'Beispiel-Adressen:',
    example: 'Beispiel:',
    object: 'Objekt',
    nextGroupAddress: 'Nächste Gruppenadresse',
    patternNotAnalyzed: 'Muster noch nicht analysiert',
    patternDimmingAndSwitching: 'Dimmen und Schalten Muster:',
    dimmingUsesSameAddresses: 'Dimmen verwendet dieselben Gruppenadressen wie Schalten.',
    dimmingAndSwitchingUseSameAddresses: 'Dimmen und Schalten verwenden dieselben Gruppenadressen.',
    skipSwitchingWhenUsingSameMainMiddleGroup: 'Wenn Sie Schalten und Dimmen in derselben Haupt-Mittelgruppe verwenden, überspringen Sie Schalten.',
    unusedObjectsInSwitchingGetDashName: 'Nicht verwendete Objekte in Schalten erhalten den Namen ---',
    analyzeSwitchingFirst: 'Analysieren Sie zuerst Schalten, um das Muster zu sehen.',
    unnamed: 'Unbenannt',
    dimmingConfiguration: 'Dimmen-Konfiguration',
    useSameAddressesAsSwitching: 'Verwenden Sie für Dimmen dieselben Gruppenadressen wie für Schalten?',
    yesDimEqualsSwitching: 'Ja (Dimmen = Schalten)',
    dimmingHasOwnAddresses: 'Dimmen hat eigene Gruppenadressen',
    onlyForDimming: 'Nur für Dimmen',
    forDimmingAndSwitching: 'Für Dimmen und Schalten',
    unusedAddressesShownAs: 'Nicht verwendete Gruppenadressen werden als --- angezeigt',
    editDimming: 'Dimmen Bearbeiten',
    exampleDeviceSwitching: '0.1 Eingang Wandlampe',
    exampleDeviceDimming: '0.1 Eingang Wandlampe',
    exampleDeviceShading: '0.2 Wohnzimmer Vorhang',
    exampleDeviceHvac: '0.3 Küche',
    allAddressValuesZero: 'Alle Adresswerte sind 0. Geben Sie eine gültige Adresse ein.',
    enterValidAddress: 'Geben Sie eine gültige Adresse ein.',
    blockedByHvacConfiguration: '(Durch HVAC-Konfiguration blockiert)',
    extraMainGroupsForZones: 'Zusätzliche Hauptgruppen für zusätzliche Zonen:',
    maxZones: 'max {count} Zonen',
    maximumNumberOfZones: 'Maximale Anzahl von Zonen',
    seeTemplateSettings: 'siehe Template-Einstellungen',
    whenMiddleGroupIncrementIs1: 'Wenn das Mittelgruppen-Inkrement +1 ist, können maximal 8 Zonen erstellt werden (Mittelgruppe 0-7).',
    forExtraZonesNextMainGroup: 'Für zusätzliche Zonen muss eine nächste Hauptgruppe angegeben werden.',
    theseMainGroupsBlockedInFixed: 'Diese Hauptgruppen werden automatisch in den festen Gruppenadressen blockiert.',
    ifYouSetMiddleGroupIncrementTo1: 'Wenn Sie das Mittelgruppen-Inkrement auf +1 setzen, können maximal 8 Zonen erstellt werden (Mittelgruppe 0-7).',
    forExtraZonesYouCanSpecifyNextMainGroup: 'Für zusätzliche Zonen können Sie hier eine nächste Hauptgruppe angeben.',
    fullyUse: 'Vollständig verwenden',
    basicUse: 'Grundlegend verwenden',
    notUse: 'Nicht verwenden',
    allObjectsGeneratedWithNames: 'Alle Objekte werden mit Namen generiert',
    noAddressesGeneratedForFunctionGroup: 'Keine Adressen werden für diese Funktionsgruppe generiert',
    continueButton: 'Weiter',
    selectThisOptionIfSameMainMiddleGroups: 'Wählen Sie diese Option, wenn Sie auch die gleichen Haupt- und Mittelgruppen für Dimmen verwenden.',
    continueToOverview: 'Weiter zur Übersicht',
    omhoogOmlaag: 'Auf/Ab',
    positie: 'Position',
    positieStatus: 'Positionsstatus',
    lamellenPositie: 'Lamellenposition',
    lamellenStatus: 'Lamellenpositionsstatus',
    gemetenTemp1: 'Gemessene Temp 1',
    gemetenTemp2: 'Gemessene Temp 2',
    setpointStatus: 'eingestellte Temperatur',
    modeStatus: 'Modusstatus',
    valueStatus: 'Wertstatus',
    setpointShiftStatus: 'Status Verschiebung gewünschte Temperatur',
    noMainGroupsAvailable: 'Keine Hauptgruppen verfügbar. Alle Hauptgruppen sind in Verwendung oder blockiert.',
    mainGroupName: 'Hauptgruppe',
    maxMiddleGroupsReached: 'Maximale Anzahl von Mittelgruppen erreicht (0-7) für diese Hauptgruppe. Alle Mittelgruppen sind in Verwendung oder blockiert.',
    middleGroupName: 'Mittelgruppe',
    maxSubGroupsReached: 'Maximale Anzahl von Untergruppen erreicht (0-255) für diese Mittelgruppe. Alle Untergruppen sind in Verwendung oder blockiert.',
    middleGroupInUse: 'Mittelgruppe {value} wird bereits von einer Hauptfunktion verwendet und kann nicht verwendet werden.',
    subGroupInUse: 'Untergruppe {value} wird bereits von einer Hauptfunktion verwendet und kann nicht verwendet werden.',
    autoGenerateRoomAddresses: 'Automatisch Gruppenadressen für eindeutige Räume generieren (zentral und Szenen)',
    autoGenerateRoomAddressesDescription: 'Wenn aktiviert, werden automatisch Gruppenadressen für jeden eindeutigen Raum in den Mittelgruppen zentral und Szenen erstellt. Die Unteradressen 0-99 in diesen Mittelgruppen werden dann für die manuelle Bearbeitung blockiert. Die Unteradressen 100-255 bleiben für die manuelle Hinzufügung verfügbar.',
    noFixedGroupAddresses: 'Keine festen Gruppenadressen. Klicken Sie auf "{addMainGroup}", um eine hinzuzufügen.',
    mainGroupLabel: 'Hauptgruppe {main}: {name}',
    middleGroupLabel: 'Mittelgruppe {middle}: {name}',
    remove: 'Entfernen',
    automaticallyGenerated: '(Automatisch generiert)',
    used: 'Verwendet',
    automatic: '(automatisch)',
    defaultObjectCannotDelete: 'Standardobjekt - kann nur deaktiviert werden',
    fixed: '(Fest)',
    standardCannotDelete: '(Standard - kann nur deaktiviert werden)',
    extraSubAddressesWarning: 'Es gibt {count} zusätzliche Unteradresse(n) in den Mittelgruppen "zentral" oder "Szenen":\n\n{list}\n\nDiese werden entfernt, wenn die automatische Generierung aktiviert wird. Sind Sie sicher?',
    sub: 'Unter',
    actions: 'Aktionen',
    configureAddressStructure: 'Konfigurieren Sie Ihre Gruppenadressstruktur, indem Sie ein Beispiel pro Hauptgruppe ausfüllen.',
    startWizard: 'Assistent starten',
    extraMainGroupsForZonesLabel: 'Zusätzliche Hauptgruppen für zusätzliche Zonen:',
    mainGroupMustBeBetween: 'Hauptgruppe muss zwischen 0 und 31 sein (aktuell: {current})',
    middleGroupMustBeBetween: 'Mittelgruppe muss zwischen 0 und 7 sein (aktuell: {current})',
    subGroupMustBeBetween: 'Untergruppe muss zwischen 0 und 255 sein (aktuell: {current})',
    groupAddressAlreadyUsed: 'Gruppenadresse {address} wird bereits von {objectName} in derselben Gruppe verwendet.',
    fillIncrementForExtraDevices: 'Geben Sie das Inkrement für zusätzliche Geräte/Zonen ein. Mindestens ein Inkrement (Hauptgruppe, Mittelgruppe oder Untergruppe) muss ausgefüllt werden.',
    extraObjectsNeedIncrement: 'Zusätzliche Objekte müssen auch ein Inkrement haben. Geben Sie das Inkrement für zusätzliche Geräte/Zonen ein.',
    extraObject: 'Zusätzliches Objekt',
    confirmDeleteGroup: 'Sind Sie sicher, dass Sie "{name}" löschen möchten?',
    confirmRemoveDevicesWhenNotUsed: 'Wenn Sie "{category}" auf "nicht verwenden" setzen, werden alle {category}-Geräte aus der Konfiguration entfernt. Sind Sie sicher, dass Sie fortfahren möchten?',
    fixedGroupAddressesLabel: 'Feste Gruppenadressen',
    startSubGroupLabel: 'Start Untergruppe: {sub}',
    extraObjects: 'Zusätzliche Objekte',
    addExtraObject: 'Zusätzliches Objekt hinzufügen',
    templateConfiguration: 'Template-Konfiguration',
    configureFixedAddressesAndViewPatterns: 'Konfigurieren Sie feste Gruppenadressen und sehen Sie analysierte Muster pro Hauptfunktion.',
    templateConfigurationComplete: 'Template-Konfiguration Abgeschlossen',
    templateOverview: 'Vorlagenübersicht',
    noTeachByExampleConfig: 'Keine Teach by Example-Konfiguration gefunden.',
    usage: 'Verwendung:',
    wizardConfiguration: 'Assistentenkonfiguration:',
    variable: 'Variabel',
    floor: 'Etage',
    groupNameLabel: 'Gruppenname:',
    groupNamePlaceholder: 'Z.B. {category} Erdgeschoss oder {category} 1. Stock',
    groupNameOverwriteNote: 'Hinweis: Der Gruppenname wird nur geändert, wenn er noch den Standardwert hat (Dimmer oder Dimmer / Schalter). Ein eigener Gruppenname bleibt erhalten.',
    note: 'Hinweis:',
    dimmingUsesSameAddressesAsSwitching: 'Dimmen verwendet dieselben Gruppenadressen wie Schalten.',
    switchingUsesSameAddressesAsDimming: 'Schalten verwendet dieselben Gruppenadressen wie Dimmen.',
    fillAddressesForBothSwitchingAndDimming: 'Geben Sie hier die Adressen ein, die sowohl für Schalten als auch für Dimmen verwendet werden.',
    fillForOneDeviceZone: 'Geben Sie alle Gruppenadressen für ein Gerät/Zone ein (H/M/S Format):',
    noteIncrementForExtraDevices: 'Für jedes zusätzliche Gerät/Zone muss das Inkrement der Hauptgruppe, Mittelgruppe und/oder Untergruppe ausgefüllt werden.',
    atLeastOneObjectMustHaveIncrement: 'Mindestens ein Objekt muss ein Inkrement haben.',
    mainGroupIncrement: 'Hauptgruppen-Inkrement',
    middleGroupIncrement: 'Mittelgruppen-Inkrement',
    subGroupIncrement: 'Untergruppen-Inkrement',
    extraMainGroupsConfiguration: 'Zusätzliche Hauptgruppen-Konfiguration',
    blockedMainGroups: 'Blockierte Hauptgruppen:',
    fillAddressesForOneDeviceZone: 'Geben Sie alle Gruppenadressen für ein Gerät/Zone ein (H/M/S Format):',
    addExtraGroup: 'Zusätzliche {category} Gruppe hinzufügen',
    removeGroup: 'Gruppe entfernen',
    addExtraMainMiddleGroup: 'Zusätzliche Haupt-/Mittelgruppe hinzufügen',
    configureCategory: '{category} konfigurieren',
    howDoYouWantToUseThisFunctionGroup: 'Wie möchten Sie diese Funktionsgruppe verwenden?',
    nextConfigureCategory: 'Weiter: {category} konfigurieren',
    whichStructureDoYouUse: 'Welche Struktur verwenden Sie?',
    newTemplateTeachByExample: 'Neue Vorlage (Durch Beispiel lehren)',
    whatShouldTemplateNameBe: 'Wie soll der Vorlagenname lauten?',
    analyzePattern: 'Muster analysieren',
    analyzeStructure: 'Struktur analysieren',
    defaultDimmerModel: 'Dimmer',
    defaultSwitchModel: 'Schaltaktor',
    defaultBlindModel: 'Jalousieaktor',
    updateAvailable: 'Update verfügbar',
    updateDescription: 'Eine neue Version ist verfügbar. Möchten Sie jetzt aktualisieren?',
    updateInstall: 'Jetzt aktualisieren',
    updateLater: 'Später',
    updateChecking: 'Nach Updates suchen...',
    updateCheckButton: 'Auf Updates prüfen',
    updateError: 'Update-Prüfung fehlgeschlagen',
    updateDownloading: 'Update wird heruntergeladen...',
    updateOffline: 'Keine Internetverbindung. Update-Prüfung übersprungen.',
    updateRestart: 'Die App wird neu gestartet, um das Update zu installieren.'
  }
};

export const getTranslation = (lang: Language): Translations => {
  return translations[lang];
};

export const getLanguageFromStorage = (): Language => {
  try {
    const stored = localStorage.getItem('knx-language');
    if (stored && (stored === 'nl' || stored === 'en' || stored === 'es' || stored === 'fr' || stored === 'de')) {
      return stored;
    }
  } catch (err) {
    console.error('Failed to read language from localStorage', err);
  }
  return 'nl'; // Default to Dutch
};

export const saveLanguageToStorage = (lang: Language) => {
  try {
    localStorage.setItem('knx-language', lang);
  } catch (err) {
    console.error('Failed to save language to localStorage', err);
  }
};

// Map of standard object names to translation keys
const objectNameMap: Record<string, keyof Translations> = {
  'Aan/Uit': 'onOff',
  'aan/uit': 'onOff',
  'aan / uit': 'onOff',
  'Aan / Uit': 'onOff',
  'Aan / uit': 'onOff',
  'On/Off': 'onOff',
  'on/off': 'onOff',
  'Encendido/Apagado': 'onOff',
  'encendido/apagado': 'onOff',
  'Marche/Arrêt': 'onOff',
  'marche/arrêt': 'onOff',
  'Ein/Aus': 'onOff',
  'ein/aus': 'onOff',
  'Status': 'status',
  'status': 'status',
  'state': 'status',  // English translation of status
  'State': 'status',
  'Estado': 'status',
  'estado': 'status',
  'État': 'status',
  'état': 'status',
  'Zustand': 'status',
  'zustand': 'status',
  'Dimmen': 'dimming',
  'dimmen': 'dimming',
  'Dimming': 'dimming',
  'dimming': 'dimming',
  'Atenuación': 'dimming',
  'atenuación': 'dimming',
  'Variation': 'dimming',
  'variation': 'dimming',
  'Waarde': 'value',
  'waarde': 'value',
  'Value': 'value',
  'value': 'value',
  'Valor': 'value',
  'valor': 'value',
  'Valeur': 'value',
  'valeur': 'value',
  'Wert': 'value',
  'wert': 'value',
  'Up/Down': 'upDown',
  'up/down': 'upDown',
  'Op/Neer': 'upDown',
  'op/neer': 'upDown',
  'Omhoog/Omlaag': 'upDown',
  'omhoog/omlaag': 'upDown',
  'Arriba/Abajo': 'upDown',
  'arriba/abajo': 'upDown',
  'Haut/Bas': 'upDown',
  'haut/bas': 'upDown',
  'Auf/Ab': 'upDown',
  'auf/ab': 'upDown',
  'Stop': 'stop',
  'stop': 'stop',
  'Detener': 'stop',
  'detener': 'stop',
  'Arrêt': 'stop',
  'arrêt': 'stop',
  'Stopp': 'stop',
  'stopp': 'stop',
  'Lamellen': 'slats',
  'lamellen': 'slats',
  'Slats': 'slats',
  'slats': 'slats',
  'Lamas': 'slats',
  'lamas': 'slats',
  'Lames': 'slats',
  'lames': 'slats',
  'Gemeten temperatuur': 'measuredTemp',
  'gemeten temperatuur': 'measuredTemp',
  'Measured Temperature': 'measuredTemp',
  'measured temperature': 'measuredTemp',
  'Temperatura Medida': 'measuredTemp',
  'temperatura medida': 'measuredTemp',
  'Température Mesurée': 'measuredTemp',
  'température mesurée': 'measuredTemp',
  'Gemessene Temperatur': 'measuredTemp',
  'gemessene temperatur': 'measuredTemp',
  'Gemeten temperatuur 2': 'measuredTemp2',
  'gemeten temperatuur 2': 'measuredTemp2',
  'Measured Temperature 2': 'measuredTemp2',
  'measured temperature 2': 'measuredTemp2',
  'Temperatura Medida 2': 'measuredTemp2',
  'temperatura medida 2': 'measuredTemp2',
  'Température Mesurée 2': 'measuredTemp2',
  'température mesurée 2': 'measuredTemp2',
  'Gemessene Temperatur 2': 'measuredTemp2',
  'gemessene temperatur 2': 'measuredTemp2',
  'gemeten temperatuur 1': 'measuredTemp',
  'Gemeten temperatuur 1': 'measuredTemp',
  'Measured Temperature 1': 'measuredTemp',
  'measured temperature 1': 'measuredTemp',
  'Temperatura Medida 1': 'measuredTemp',
  'temperatura medida 1': 'measuredTemp',
  'Température Mesurée 1': 'measuredTemp',
  'température mesurée 1': 'measuredTemp',
  'Gemessene Temperatur 1': 'measuredTemp',
  'gemessene temperatur 1': 'measuredTemp',
  'Setpoint': 'setpoint',
  'setpoint': 'setpoint',
  'Gewenste temperatuur': 'setpoint',
  'gewenste temperatuur': 'setpoint',
  'Desired temperature': 'setpoint',
  'desired temperature': 'setpoint',
  'Temperatura deseada': 'setpoint',
  'temperatura deseada': 'setpoint',
  'Température souhaitée': 'setpoint',
  'température souhaitée': 'setpoint',
  'Gewünschte Temperatur': 'setpoint',
  'gewünschte temperatur': 'setpoint',
  'Punto de Ajuste': 'setpoint',
  'punto de ajuste': 'setpoint',
  'Point de Consigne': 'setpoint',
  'point de consigne': 'setpoint',
  'Sollwert': 'setpoint',
  'sollwert': 'setpoint',
  'Mode': 'mode',
  'mode': 'mode',
  'Modus': 'mode',
  'modus': 'mode',
  'Modo': 'mode',
  'modo': 'mode',
  'Klepsturing': 'valveControl',
  'klepsturing': 'valveControl',
  'Ventiel sturing': 'valveControl',
  'ventiel sturing': 'valveControl',
  'Ventielsturing': 'valveControl',
  'ventielsturing': 'valveControl',
  'Valve Control': 'valveControl',
  'valve control': 'valveControl',
  'Control de Válvula': 'valveControl',
  'control de válvula': 'valveControl',
  'Contrôle de Vanne': 'valveControl',
  'contrôle de vanne': 'valveControl',
  'Ventilsteuerung': 'valveControl',
  'ventilsteuerung': 'valveControl',
  'Ventilsteuerung Status': 'valveControlStatus',
  'ventilsteuerung status': 'valveControlStatus',
  'Klepsturing status': 'valveControlStatus',
  'klepsturing status': 'valveControlStatus',
  'Ventiel sturing status': 'valveControlStatus',
  'ventiel sturing status': 'valveControlStatus',
  'Ventielsturing status': 'valveControlStatus',
  'ventielsturing status': 'valveControlStatus',
  'Valve Control Status': 'valveControlStatus',
  'valve control status': 'valveControlStatus',
  'Estado de Control de Válvula': 'valveControlStatus',
  'estado de control de válvula': 'valveControlStatus',
  'État de Contrôle de Vanne': 'valveControlStatus',
  'état de contrôle de vanne': 'valveControlStatus',
  'Melding verwarmen': 'heatingActive',
  'melding verwarmen': 'heatingActive',
  'Heating Active': 'heatingActive',
  'heating active': 'heatingActive',
  'Calefacción Activa': 'heatingActive',
  'calefacción activa': 'heatingActive',
  'Chauffage Actif': 'heatingActive',
  'chauffage actif': 'heatingActive',
  'Heizung aktiv': 'heatingActive',
  'heizung aktiv': 'heatingActive',
  'Melding koelen': 'coolingActive',
  'melding koelen': 'coolingActive',
  'Cooling Active': 'coolingActive',
  'cooling active': 'coolingActive',
  'Refrigeración Activa': 'coolingActive',
  'refrigeración activa': 'coolingActive',
  'Refroidissement Actif': 'coolingActive',
  'refroidissement actif': 'coolingActive',
  'Kühlung aktiv': 'coolingActive',
  'kühlung aktiv': 'coolingActive',
  'Setpoint shift': 'setpointShift',
  'setpoint shift': 'setpointShift',
  'Setpoint Shift': 'setpointShift',
  'Verschuiving gewenste temperatuur': 'setpointShift',
  'verschuiving gewenste temperatuur': 'setpointShift',
  'Desired temperature shift': 'setpointShift',
  'desired temperature shift': 'setpointShift',
  'Desplazamiento de temperatura deseada': 'setpointShift',
  'desplazamiento de temperatura deseada': 'setpointShift',
  'Décalage de température souhaitée': 'setpointShift',
  'décalage de température souhaitée': 'setpointShift',
  'Verschiebung gewünschte Temperatur': 'setpointShift',
  'verschiebung gewünschte temperatur': 'setpointShift',
  'Desplazamiento de Punto de Ajuste': 'setpointShift',
  'desplazamiento de punto de ajuste': 'setpointShift',
  'Décalage de Point de Consigne': 'setpointShift',
  'décalage de point de consigne': 'setpointShift',
  'Sollwert-Verschiebung': 'setpointShift',
  'sollwert-verschiebung': 'setpointShift',
  'Fan': 'fan',
  'fan': 'fan',
  'Ventilador': 'fan',
  'ventilador': 'fan',
  'Ventilateur': 'fan',
  'ventilateur': 'fan',
  'Lüfter': 'fan',
  'lüfter': 'fan',
  'Ventilator': 'fan',
  'ventilator': 'fan',
  'Ventilator snelheid': 'fanSpeed',
  'ventilator snelheid': 'fanSpeed',
  'Ventilator stand': 'fanStage',
  'ventilator stand': 'fanStage',
  'Fan speed': 'fanSpeed',
  'fan speed': 'fanSpeed',
  'Fan stage': 'fanStage',
  'fan stage': 'fanStage',
  'Velocidad del ventilador': 'fanSpeed',
  'velocidad del ventilador': 'fanSpeed',
  'Nivel de ventilador': 'fanStage',
  'nivel de ventilador': 'fanStage',
  'Vitesse du ventilateur': 'fanSpeed',
  'vitesse du ventilateur': 'fanSpeed',
  'Niveau de ventilation': 'fanStage',
  'niveau de ventilation': 'fanStage',
  'Lüftergeschwindigkeit': 'fanSpeed',
  'lüftergeschwindigkeit': 'fanSpeed',
  'Lüfterstufe': 'fanStage',
  'lüfterstufe': 'fanStage',
  'Lamellen positie': 'lamellenPositie',
  'lamellen positie': 'lamellenPositie',
  'Slats position': 'lamellenPositie',
  'slats position': 'lamellenPositie',
  'Posición de lamas': 'lamellenPositie',
  'posición de lamas': 'lamellenPositie',
  'Position des lames': 'lamellenPositie',
  'position des lames': 'lamellenPositie',
  'Lamellenposition': 'lamellenPositie',
  'lamellenposition': 'lamellenPositie',
  'Lamellen status': 'lamellenStatus',
  'lamellen status': 'lamellenStatus',
  'Lamellen positie status': 'lamellenStatus',
  'lamellen positie status': 'lamellenStatus',
  'Slats status': 'lamellenStatus',
  'slats status': 'lamellenStatus',
  'Slats position status': 'lamellenStatus',
  'slats position status': 'lamellenStatus',
  'Estado de lamas': 'lamellenStatus',
  'estado de lamas': 'lamellenStatus',
  'Estado de posición de lamas': 'lamellenStatus',
  'estado de posición de lamas': 'lamellenStatus',
  'État des lames': 'lamellenStatus',
  'état des lames': 'lamellenStatus',
  'État de position des lames': 'lamellenStatus',
  'état de position des lames': 'lamellenStatus',
  'Lamellenstatus': 'lamellenStatus',
  'lamellenstatus': 'lamellenStatus',
  'Lamellenpositionsstatus': 'lamellenStatus',
  'lamellenpositionsstatus': 'lamellenStatus',
  'Positie': 'positie',
  'positie': 'positie',
  'Position': 'positie',
  'position': 'positie',
  'Posición': 'positie',
  'posición': 'positie',
  'Positie status': 'positieStatus',
  'positie status': 'positieStatus',
  'Position status': 'positieStatus',
  'position status': 'positieStatus',
  'Estado de posición': 'positieStatus',
  'estado de posición': 'positieStatus',
  'État de position': 'positieStatus',
  'état de position': 'positieStatus',
  'Positionsstatus': 'positieStatus',
  'positionsstatus': 'positieStatus',
  'Ingestelde temperatuur': 'setTemperature',
  'ingestelde temperatuur': 'setTemperature',
  'Set temperature': 'setTemperature',
  'set temperature': 'setTemperature',
  'Temperatura establecida': 'setTemperature',
  'temperatura establecida': 'setTemperature',
  'Température réglée': 'setTemperature',
  'température réglée': 'setTemperature',
  'Eingestellte Temperatur': 'setTemperature',
  'eingestellte Temperatur': 'setTemperature',
  'Verschuiving gewenste temperatuur status': 'setpointShiftStatus',
  'verschuiving gewenste temperatuur status': 'setpointShiftStatus',
  'Desired temperature shift status': 'setpointShiftStatus',
  'desired temperature shift status': 'setpointShiftStatus',
  'Estado de desplazamiento de temperatura deseada': 'setpointShiftStatus',
  'estado de desplazamiento de temperatura deseada': 'setpointShiftStatus',
  'État de décalage de température souhaitée': 'setpointShiftStatus',
  'état de décalage de température souhaitée': 'setpointShiftStatus',
  'Verschiebung gewünschte Temperatur Status': 'setpointShiftStatus',
  'verschiebung gewünschte temperatur status': 'setpointShiftStatus',
  // Value status
  'Waarde status': 'valueStatus',
  'waarde status': 'valueStatus',
  'Value status': 'valueStatus',
  'value status': 'valueStatus',
  'Valor estado': 'valueStatus',
  'valor estado': 'valueStatus',
  'État de valeur': 'valueStatus',
  'état de valeur': 'valueStatus',
  'Wertstatus': 'valueStatus',
  'wertstatus': 'valueStatus',
  // Mode state
  'Modus status': 'modeStatus',
  'modus status': 'modeStatus',
  'Mode state': 'modeStatus',
  'mode state': 'modeStatus',
  'Estado del modo': 'modeStatus',
  'estado del modo': 'modeStatus',
  'État du mode': 'modeStatus',
  'état du mode': 'modeStatus',
  'Modusstatus': 'modeStatus',
  'modusstatus': 'modeStatus',
  // On/Off state (English) - these should map to onOffStatus, not onOff
  // Note: These are handled by the full name check first, so they should map correctly
  // But we keep these for backwards compatibility - they will be found by the full name check
  'On/Off state': 'onOffStatus',
  'on/off state': 'onOffStatus',
  'On / Off state': 'onOffStatus',
  'on / off state': 'onOffStatus',
  // Aan/uit status variants with spaces (Dutch) - these are compound names handled by translateObjectName
  // They will be recognized as "onOff" + "status" combination
  'aan / uit status': 'onOffStatus',
  'Aan / Uit status': 'onOffStatus',
  'Aan / uit status': 'onOffStatus',
  'aan/uit status': 'onOffStatus',
  'Aan/Uit status': 'onOffStatus',
  // Encendido/Apagado estado (Spanish) - compound name, will be handled by translateObjectName function
  // 'Encendido/Apagado estado': 'onOff',
  // 'encendido/apagado estado': 'onOff',
  // Estado del valor (Spanish)
  'Estado del valor': 'valueStatus',
  'estado del valor': 'valueStatus',
  // Status Verschiebung gewünschte Temperatur (German)
  'Status Verschiebung gewünschte Temperatur': 'setpointShiftStatus',
  'status verschiebung gewünschte temperatur': 'setpointShiftStatus',
  'Status verschiebung gewünschte temperatur': 'setpointShiftStatus',
  
  // Common sensors and actuators - Dutch
  'temperatuursensor': 'temperatureSensor',
  'Temperatuursensor': 'temperatureSensor',
  'bewegingsmelder': 'motionDetector',
  'Bewegingsmelder': 'motionDetector',
  'bewegingssensor': 'motionSensor',
  'Bewegingssensor': 'motionSensor',
  'windmeter': 'windSensor',
  'Windmeter': 'windSensor',
  'regensensor': 'rainSensor',
  'Regensensor': 'rainSensor',
  'lichtsensor': 'lightSensor',
  'Lichtsensor': 'lightSensor',
  'helderheidsdetector': 'brightnessDetector',
  'Helderheidsdetector': 'brightnessDetector',
  'helderheidssensor': 'brightnessSensor',
  'Helderheidssensor': 'brightnessSensor',
  'rookmelder': 'smokeDetector',
  'Rookmelder': 'smokeDetector',
  'co2 sensor': 'co2Sensor',
  'CO2 sensor': 'co2Sensor',
  'co2sensor': 'co2Sensor',
  'CO2sensor': 'co2Sensor',
  'vochtigheidssensor': 'humiditySensor',
  'Vochtigheidssensor': 'humiditySensor',
  'aanwezigheidssensor': 'presenceSensor',
  'Aanwezigheidssensor': 'presenceSensor',
  'aanwezigheidsmelder': 'presenceDetector',
  'Aanwezigheidsmelder': 'presenceDetector',
  'deurcontact': 'doorContact',
  'Deurcontact': 'doorContact',
  'raamcontact': 'windowContact',
  'Raamcontact': 'windowContact',
  'watermelder': 'waterDetector',
  'Watermelder': 'waterDetector',
  'lekkagedetector': 'leakageDetector',
  'Lekkagedetector': 'leakageDetector',
  'gasmelder': 'gasDetector',
  'Gasmelder': 'gasDetector',
  'brandmelder': 'fireDetector',
  'Brandmelder': 'fireDetector',
  'drukknop': 'pushButton',
  'Drukknop': 'pushButton',
  'schakelaar': 'switchSensor',
  'Schakelaar': 'switchSensor',
  'thermostaat': 'thermostat',
  'Thermostaat': 'thermostat',
  'klep': 'valve',
  'Klep': 'valve',
  'actuator': 'actuator',
  'Actuator': 'actuator',
  'relais': 'relay',
  'Relais': 'relay',
  
  // English
  'temperature sensor': 'temperatureSensor',
  'Temperature sensor': 'temperatureSensor',
  'motion detector': 'motionDetector',
  'Motion detector': 'motionDetector',
  'motion sensor': 'motionSensor',
  'Motion sensor': 'motionSensor',
  'wind sensor': 'windSensor',
  'Wind sensor': 'windSensor',
  'rain sensor': 'rainSensor',
  'Rain sensor': 'rainSensor',
  'light sensor': 'lightSensor',
  'Light sensor': 'lightSensor',
  'brightness detector': 'brightnessDetector',
  'Brightness detector': 'brightnessDetector',
  'brightness sensor': 'brightnessSensor',
  'Brightness sensor': 'brightnessSensor',
  'smoke detector': 'smokeDetector',
  'Smoke detector': 'smokeDetector',
  'humidity sensor': 'humiditySensor',
  'Humidity sensor': 'humiditySensor',
  'presence sensor': 'presenceSensor',
  'Presence sensor': 'presenceSensor',
  'presence detector': 'presenceDetector',
  'Presence detector': 'presenceDetector',
  'door contact': 'doorContact',
  'Door contact': 'doorContact',
  'window contact': 'windowContact',
  'Window contact': 'windowContact',
  'water detector': 'waterDetector',
  'Water detector': 'waterDetector',
  'leakage detector': 'leakageDetector',
  'Leakage detector': 'leakageDetector',
  'gas detector': 'gasDetector',
  'Gas detector': 'gasDetector',
  'fire detector': 'fireDetector',
  'Fire detector': 'fireDetector',
  'push button': 'pushButton',
  'Push button': 'pushButton',
  'switch': 'switchSensor',
  'Switch': 'switchSensor',
  'thermostat': 'thermostat',
  'Thermostat': 'thermostat',
  'valve': 'valve',
  'Valve': 'valve',
  'relay': 'relay',
  'Relay': 'relay',
  
  // German
  'temperatursensor': 'temperatureSensor',
  'Temperatursensor': 'temperatureSensor',
  'bewegungsmelder': 'motionDetector',
  'Bewegungsmelder': 'motionDetector',
  'bewegungssensor': 'motionSensor',
  'Bewegungssensor': 'motionSensor',
  'windsensor': 'windSensor',
  'Windsensor': 'windSensor',
  'helligkeitsdetektor': 'brightnessDetector',
  'Helligkeitsdetektor': 'brightnessDetector',
  'helligkeitssensor': 'brightnessSensor',
  'Helligkeitssensor': 'brightnessSensor',
  'rauchmelder': 'smokeDetector',
  'Rauchmelder': 'smokeDetector',
  'feuchtigkeitssensor': 'humiditySensor',
  'Feuchtigkeitssensor': 'humiditySensor',
  'anwesenheitssensor': 'presenceSensor',
  'Anwesenheitssensor': 'presenceSensor',
  'anwesenheitsmelder': 'presenceDetector',
  'Anwesenheitsmelder': 'presenceDetector',
  'türkontakt': 'doorContact',
  'Türkontakt': 'doorContact',
  'fensterkontakt': 'windowContact',
  'Fensterkontakt': 'windowContact',
  'wassermelder': 'waterDetector',
  'Wassermelder': 'waterDetector',
  'leckagemelder': 'leakageDetector',
  'Leckagemelder': 'leakageDetector',
  'drucktaste': 'pushButton',
  'Drucktaste': 'pushButton',
  'schalter': 'switchSensor',
  'Schalter': 'switchSensor',
  'ventil': 'valve',
  'Ventil': 'valve',
  'aktor': 'actuator',
  'Aktor': 'actuator',
  
  // French
  'capteur de température': 'temperatureSensor',
  'Capteur de température': 'temperatureSensor',
  'détecteur de mouvement': 'motionDetector',
  'Détecteur de mouvement': 'motionDetector',
  'capteur de mouvement': 'motionSensor',
  'Capteur de mouvement': 'motionSensor',
  'capteur de vent': 'windSensor',
  'Capteur de vent': 'windSensor',
  'capteur de pluie': 'rainSensor',
  'Capteur de pluie': 'rainSensor',
  'capteur de lumière': 'lightSensor',
  'Capteur de lumière': 'lightSensor',
  'détecteur de luminosité': 'brightnessDetector',
  'Détecteur de luminosité': 'brightnessDetector',
  'capteur de luminosité': 'brightnessSensor',
  'Capteur de luminosité': 'brightnessSensor',
  'détecteur de fumée': 'smokeDetector',
  'Détecteur de fumée': 'smokeDetector',
  'capteur co2': 'co2Sensor',
  'Capteur co2': 'co2Sensor',
  "capteur d'humidité": 'humiditySensor',
  "Capteur d'humidité": 'humiditySensor',
  'capteur de présence': 'presenceSensor',
  'Capteur de présence': 'presenceSensor',
  'détecteur de présence': 'presenceDetector',
  'Détecteur de présence': 'presenceDetector',
  'contact de porte': 'doorContact',
  'Contact de porte': 'doorContact',
  'contact de fenêtre': 'windowContact',
  'Contact de fenêtre': 'windowContact',
  "détecteur d'eau": 'waterDetector',
  "Détecteur d'eau": 'waterDetector',
  'détecteur de fuite': 'leakageDetector',
  'Détecteur de fuite': 'leakageDetector',
  'détecteur de gaz': 'gasDetector',
  'Détecteur de gaz': 'gasDetector',
  "détecteur d'incendie": 'fireDetector',
  "Détecteur d'incendie": 'fireDetector',
  'bouton poussoir': 'pushButton',
  'Bouton poussoir': 'pushButton',
  'interrupteur': 'switchSensor',
  'Interrupteur': 'switchSensor',
  'variateur': 'dimmerSensor',
  'Variateur': 'dimmerSensor',
  'actionneur': 'actuator',
  'Actionneur': 'actuator',
  
  // Spanish
  'sensor de temperatura': 'temperatureSensor',
  'Sensor de temperatura': 'temperatureSensor',
  'detector de movimiento': 'motionDetector',
  'Detector de movimiento': 'motionDetector',
  'sensor de movimiento': 'motionSensor',
  'Sensor de movimiento': 'motionSensor',
  'sensor de viento': 'windSensor',
  'Sensor de viento': 'windSensor',
  'sensor de lluvia': 'rainSensor',
  'Sensor de lluvia': 'rainSensor',
  'sensor de luz': 'lightSensor',
  'Sensor de luz': 'lightSensor',
  'detector de brillo': 'brightnessDetector',
  'Detector de brillo': 'brightnessDetector',
  'sensor de brillo': 'brightnessSensor',
  'Sensor de brillo': 'brightnessSensor',
  'detector de humo': 'smokeDetector',
  'Detector de humo': 'smokeDetector',
  'sensor co2': 'co2Sensor',
  'Sensor co2': 'co2Sensor',
  'sensor de humedad': 'humiditySensor',
  'Sensor de humedad': 'humiditySensor',
  'sensor de presencia': 'presenceSensor',
  'Sensor de presencia': 'presenceSensor',
  'detector de presencia': 'presenceDetector',
  'Detector de presencia': 'presenceDetector',
  'contacto de puerta': 'doorContact',
  'Contacto de puerta': 'doorContact',
  'contacto de ventana': 'windowContact',
  'Contacto de ventana': 'windowContact',
  'detector de agua': 'waterDetector',
  'Detector de agua': 'waterDetector',
  'detector de fugas': 'leakageDetector',
  'Detector de fugas': 'leakageDetector',
  'detector de gas': 'gasDetector',
  'Detector de gas': 'gasDetector',
  'detector de incendios': 'fireDetector',
  'Detector de incendios': 'fireDetector',
  'pulsador': 'pushButton',
  'Pulsador': 'pushButton',
  'interruptor': 'switchSensor',
  'Interruptor': 'switchSensor',
  'regulador': 'dimmerSensor',
  'Regulador': 'dimmerSensor',
  'termostato': 'thermostat',
  'Termostato': 'thermostat',
  'válvula': 'valve',
  'Válvula': 'valve',
  'actuador': 'actuator',
  'Actuador': 'actuator',
  'relé': 'relay',
  'Relé': 'relay',
  
  // Colors - Dutch
  'rood': 'red',
  'Rood': 'red',
  'blauw': 'blue',
  'Blauw': 'blue',
  'groen': 'green',
  'Groen': 'green',
  'geel': 'yellow',
  'Geel': 'yellow',
  'wit': 'white',
  'Wit': 'white',
  'zwart': 'black',
  'Zwart': 'black',
  'oranje': 'orange',
  'Oranje': 'orange',
  'paars': 'purple',
  'Paars': 'purple',
  'roze': 'pink',
  'Roze': 'pink',
  'bruin': 'brown',
  'Bruin': 'brown',
  'grijs': 'grey',
  'Grijs': 'grey',
  
  // Colors - English
  'red': 'red',
  'Red': 'red',
  'blue': 'blue',
  'Blue': 'blue',
  'green': 'green',
  'Green': 'green',
  'yellow': 'yellow',
  'Yellow': 'yellow',
  'white': 'white',
  'White': 'white',
  'black': 'black',
  'Black': 'black',
  'orange': 'orange',
  'Orange': 'orange',
  'purple': 'purple',
  'Purple': 'purple',
  'pink': 'pink',
  'Pink': 'pink',
  'brown': 'brown',
  'Brown': 'brown',
  'grey': 'grey',
  'Grey': 'grey',
  'gray': 'grey',
  'Gray': 'grey',
  
  // Colors - German
  'rot': 'red',
  'Rot': 'red',
  'blau': 'blue',
  'Blau': 'blue',
  'grün': 'green',
  'Grün': 'green',
  'gelb': 'yellow',
  'Gelb': 'yellow',
  'weiß': 'white',
  'Weiß': 'white',
  'weiss': 'white',
  'Weiss': 'white',
  'schwarz': 'black',
  'Schwarz': 'black',
  'lila': 'purple',
  'Lila': 'purple',
  'rosa': 'pink',
  'Rosa': 'pink',
  'braun': 'brown',
  'Braun': 'brown',
  'grau': 'grey',
  'Grau': 'grey',
  
  // Colors - French
  'rouge': 'red',
  'Rouge': 'red',
  'bleu': 'blue',
  'Bleu': 'blue',
  'vert': 'green',
  'Vert': 'green',
  'jaune': 'yellow',
  'Jaune': 'yellow',
  'blanc': 'white',
  'Blanc': 'white',
  'noir': 'black',
  'Noir': 'black',
  'violet': 'purple',
  'Violet': 'purple',
  'rose': 'pink',
  'Rose': 'pink',
  'marron': 'brown',
  'Marron': 'brown',
  'gris': 'grey',
  'Gris': 'grey',
  
  // Colors - Spanish
  'rojo': 'red',
  'Rojo': 'red',
  'azul': 'blue',
  'Azul': 'blue',
  'verde': 'green',
  'Verde': 'green',
  'amarillo': 'yellow',
  'Amarillo': 'yellow',
  'blanco': 'white',
  'Blanco': 'white',
  'negro': 'black',
  'Negro': 'black',
  'naranja': 'orange',
  'Naranja': 'orange',
  'morado': 'purple',
  'Morado': 'purple',
  'marrón': 'brown',
  'Marrón': 'brown',
  
  // Word "color/colour" - Dutch
  'kleur': 'color',
  'Kleur': 'color',
  
  // Word "color/colour" - English
  'color': 'color',
  'Color': 'color',
  'colour': 'color',
  'Colour': 'color',
  
  // Word "color/colour" - German
  'farbe': 'color',
  'Farbe': 'color',
  
  // Word "color/colour" - French
  'couleur': 'color',
  'Couleur': 'color',
  
  // Word "color/colour" - Spanish (already defined above in English section)
  
  // KNX Lighting objects - Dutch
  'helderheid': 'brightness',
  'Helderheid': 'brightness',
  'kleurtemperatuur': 'colorTemperature',
  'Kleurtemperatuur': 'colorTemperature',
  'rgb': 'rgb',
  'RGB': 'rgb',
  'rgbw': 'rgbw',
  'RGBW': 'rgbw',
  'Rgbw': 'rgbw',
  'rgb waarde': 'rgbValue',
  'RGB waarde': 'rgbValue',
  'rgbw waarde': 'rgbwValue',
  'RGBW waarde': 'rgbwValue',
  
  // KNX Lighting objects - English
  'brightness': 'brightness',
  'Brightness': 'brightness',
  'color temperature': 'colorTemperature',
  'Color temperature': 'colorTemperature',
  'rgb value': 'rgbValue',
  'RGB value': 'rgbValue',
  'rgbw value': 'rgbwValue',
  'RGBW value': 'rgbwValue',
  
  // KNX Lighting objects - German
  'helligkeit': 'brightness',
  'Helligkeit': 'brightness',
  'farbtemperatur': 'colorTemperature',
  'Farbtemperatur': 'colorTemperature',
  'rgb wert': 'rgbValue',
  'RGB wert': 'rgbValue',
  
  // KNX Lighting objects - French
  'luminosité': 'brightness',
  'Luminosité': 'brightness',
  'luminosite': 'brightness',
  'Luminosite': 'brightness',
  'température de couleur': 'colorTemperature',
  'Température de couleur': 'colorTemperature',
  'valeur rgb': 'rgbValue',
  'Valeur rgb': 'rgbValue',
  
  // KNX Lighting objects - Spanish
  'brillo': 'brightness',
  'Brillo': 'brightness',
  'temperatura de color': 'colorTemperature',
  'Temperatura de color': 'colorTemperature',
  'valor rgb': 'rgbValue',
  'Valor rgb': 'rgbValue',
  
  // KNX HVAC - Dutch
  'ventilatie': 'ventilation',
  'Ventilatie': 'ventilation',
  'verwarming': 'heating',
  'Verwarming': 'heating',
  'verwarmen': 'heating',
  'Verwarmen': 'heating',
  'koeling': 'cooling',
  'Koeling': 'cooling',
  'koelen': 'cooling',
  'Koelen': 'cooling',
  
  // KNX HVAC - English
  'ventilation': 'ventilation',
  'Ventilation': 'ventilation',
  'heating': 'heating',
  'Heating': 'heating',
  'cooling': 'cooling',
  'Cooling': 'cooling',
  
  // KNX HVAC - German
  'lüftung': 'ventilation',
  'Lüftung': 'ventilation',
  'heizung': 'heating',
  'Heizung': 'heating',
  'kühlung': 'cooling',
  'Kühlung': 'cooling',
  
  // KNX HVAC - French
  'chauffage': 'heating',
  'Chauffage': 'heating',
  'refroidissement': 'cooling',
  'Refroidissement': 'cooling',
  
  // KNX HVAC - Spanish
  'ventilación': 'ventilation',
  'Ventilación': 'ventilation',
  'calefacción': 'heating',
  'Calefacción': 'heating',
  'refrigeración': 'cooling',
  'Refrigeración': 'cooling',
  
  // KNX Energy - Dutch
  'vermogen': 'power',
  'Vermogen': 'power',
  'stroom': 'current',
  'Stroom': 'current',
  'spanning': 'voltage',
  'Spanning': 'voltage',
  'energie': 'energy',
  'Energie': 'energy',
  
  // KNX Energy - English
  'power': 'power',
  'Power': 'power',
  'current': 'current',
  'Current': 'current',
  'voltage': 'voltage',
  'Voltage': 'voltage',
  'energy': 'energy',
  'Energy': 'energy',
  
  // KNX Energy - German
  'leistung': 'power',
  'Leistung': 'power',
  'strom': 'current',
  'Strom': 'current',
  'spannung': 'voltage',
  'Spannung': 'voltage',
  
  // KNX Energy - French
  'puissance': 'power',
  'Puissance': 'power',
  'courant': 'current',
  'Courant': 'current',
  'tension': 'voltage',
  'Tension': 'voltage',
  'énergie': 'energy',
  'Énergie': 'energy',
  
  // KNX Energy - Spanish
  'potencia': 'power',
  'Potencia': 'power',
  'corriente': 'current',
  'Corriente': 'current',
  'voltaje': 'voltage',
  'Voltaje': 'voltage',
  'energía': 'energy',
  'Energía': 'energy',
  
  // KNX Scenes - Dutch
  'scène': 'scene',
  'Scène': 'scene',
  'scène nummer': 'sceneNumber',
  'Scène nummer': 'sceneNumber',
  
  // KNX Scenes - English
  'scene': 'scene',
  'Scene': 'scene',
  'scene number': 'sceneNumber',
  'Scene number': 'sceneNumber',
  
  // KNX Scenes - German
  'szene': 'scene',
  'Szene': 'scene',
  'szene nummer': 'sceneNumber',
  'Szene nummer': 'sceneNumber',
  
  // KNX Scenes - French
  'numéro de scène': 'sceneNumber',
  'Numéro de scène': 'sceneNumber',
  
  // KNX Scenes - Spanish
  'escena': 'scene',
  'Escena': 'scene',
  'número de escena': 'sceneNumber',
  'Número de escena': 'sceneNumber',
  
  // KNX Feedback - Dutch
  'terugmelding': 'feedback',
  'Terugmelding': 'feedback',
  'alarm': 'alarm',
  'Alarm': 'alarm',
  'waarschuwing': 'warning',
  'Waarschuwing': 'warning',
  'storing': 'fault',
  'Storing': 'fault',
  
  // KNX Feedback - English
  'feedback': 'feedback',
  'Feedback': 'feedback',
  'warning': 'warning',
  'Warning': 'warning',
  'fault': 'fault',
  'Fault': 'fault',
  
  // KNX Feedback - German
  'rückmeldung': 'feedback',
  'Rückmeldung': 'feedback',
  'warnung': 'warning',
  'Warnung': 'warning',
  'störung': 'fault',
  'Störung': 'fault',
  
  // KNX Feedback - French
  'retour': 'feedback',
  'Retour': 'feedback',
  'alarme': 'alarm',
  'Alarme': 'alarm',
  'avertissement': 'warning',
  'Avertissement': 'warning',
  'défaut': 'fault',
  'Défaut': 'fault',
  
  // KNX Feedback - Spanish
  'retroalimentación': 'feedback',
  'Retroalimentación': 'feedback',
  'alarma': 'alarm',
  'Alarma': 'alarm',
  'advertencia': 'warning',
  'Advertencia': 'warning',
  'falla': 'fault',
  'Falla': 'fault',
  
  // Additional object names - Dutch
  'algemeen': 'general',
  'Algemeen': 'general',
  'algemene': 'general',
  'Algemene': 'general',
  'centraal': 'central',
  'Centraal': 'central',
  'dag / nacht': 'dayNight',
  'Dag / Nacht': 'dayNight',
  'dag/nacht': 'dayNight',
  'Dag/Nacht': 'dayNight',
  'omschakelen': 'toggle',
  'Omschakelen': 'toggle',
  'lamp': 'light',
  'Lamp': 'light',
  'speciale opties': 'specialOptions',
  'Speciale opties': 'specialOptions',
  'Speciale Opties': 'specialOptions',
  'functies': 'functions',
  'Functies': 'functions',
  
  // Additional object names - English (only new ones, heating/cooling/general/central already exist above)
  'day / night': 'dayNight',
  'Day / Night': 'dayNight',
  'day/night': 'dayNight',
  'Day/Night': 'dayNight',
  'toggle': 'toggle',
  'Toggle': 'toggle',
  'light': 'light',
  'Light': 'light',
  'special options': 'specialOptions',
  'Special options': 'specialOptions',
  'Special Options': 'specialOptions',
  'functions': 'functions',
  'Functions': 'functions',
  
  // Additional object names - Spanish (only new ones, heating/cooling/general/central already exist above)
  'día / noche': 'dayNight',
  'Día / Noche': 'dayNight',
  'día/noche': 'dayNight',
  'Día/Noche': 'dayNight',
  'alternar': 'toggle',
  'Alternar': 'toggle',
  'luz': 'light',
  'Luz': 'light',
  'opciones especiales': 'specialOptions',
  'Opciones especiales': 'specialOptions',
  'Opciones Especiales': 'specialOptions',
  'funciones': 'functions',
  'Funciones': 'functions',
  
  // Additional object names - French (only new ones, heating/cooling/general/central already exist above)
  'jour / nuit': 'dayNight',
  'Jour / Nuit': 'dayNight',
  'jour/nuit': 'dayNight',
  'Jour/Nuit': 'dayNight',
  'basculer': 'toggle',
  'Basculer': 'toggle',
  'lumière': 'light',
  'Lumière': 'light',
  'options spéciales': 'specialOptions',
  'Options spéciales': 'specialOptions',
  'Options Spéciales': 'specialOptions',
  'fonctions': 'functions',
  'Fonctions': 'functions',
  
  // Additional object names - German (only new ones, heating/cooling/general/central already exist above)
  'tag / nacht': 'dayNight',
  'Tag / Nacht': 'dayNight',
  'tag/nacht': 'dayNight',
  'Tag/Nacht': 'dayNight',
  'umschalten': 'toggle',
  'Umschalten': 'toggle',
  'lampe': 'light',
  'Lampe': 'light',
  'besondere Optionen': 'specialOptions',
  'Besondere Optionen': 'specialOptions',
  'Besondere optionen': 'specialOptions',
  'Funktionen': 'functions',
  'funktionen': 'functions'
};

// Helper function to translate standard object names
export const translateObjectName = (name: string, lang: Language): string => {
  if (!name) return '';
  if (typeof name !== 'string') return '';
  
  // Normalize the name for comparison (lowercase, trim)
  const normalizedName = name.toLowerCase().trim();
  
  // First check if the full name is in the map (e.g., "aan/uit status" or "aan / uit status")
  // Check both original case and normalized, and also try without spaces
  // Also try with first letter capitalized and all possible case variants
  const nameWithFirstCapital = normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);
  const nameTrimmed = name.trim();
  
  // Try multiple lookup strategies
  let translationKey = objectNameMap[name] || 
                       objectNameMap[normalizedName] || 
                       objectNameMap[normalizedName.replace(/\s+/g, '')] ||
                       objectNameMap[nameWithFirstCapital] ||
                       objectNameMap[nameTrimmed] ||
                       objectNameMap[nameTrimmed.toLowerCase()] ||
                       objectNameMap[nameTrimmed.replace(/\s+/g, '')] ||
                       objectNameMap[nameTrimmed.replace(/\s+/g, '').toLowerCase()];
  
  if (translationKey) {
    const t = getTranslation(lang);
    const translation = t[translationKey as keyof Translations];
    if (translation && typeof translation === 'string') {
      // Always return in lowercase for object names
      return translation.toLowerCase();
    }
  }
  
  // Handle compound names like "aan/uit status", "aan / uit status", "on/off state", "estado del valor", etc.
  const parts = normalizedName.split(' ').filter(p => p.length > 0);
  const lastPart = parts[parts.length - 1];
  
  // Check if the last part is a status suffix in any language
  const statusSuffixes = ['status', 'state', 'estado', 'état', 'zustand'];
  const isStatusSuffix = statusSuffixes.includes(lastPart);
  
  if (parts.length >= 2 && isStatusSuffix) {
    const firstPart = parts.slice(0, -1).join(' ');
    // Try both with and without spaces in the first part
    const firstPartKey = objectNameMap[firstPart] || objectNameMap[firstPart.replace(/\s+/g, '')];
    if (firstPartKey) {
      const t = getTranslation(lang);
      // Always return in lowercase for object names
      return `${t[firstPartKey as keyof Translations].toLowerCase()} ${t.status.toLowerCase()}`;
    }
  }
  
  // Handle compound names with "del" or "de" in Spanish/French (e.g., "estado del valor")
  if (parts.length >= 3 && (parts[parts.length - 2] === 'del' || parts[parts.length - 2] === 'de' || parts[parts.length - 2] === 'du')) {
    const lastPart = parts[parts.length - 1];
    if (statusSuffixes.includes(lastPart)) {
      const firstPart = parts.slice(0, -2).join(' ');
      const firstPartKey = objectNameMap[firstPart];
      if (firstPartKey) {
        const t = getTranslation(lang);
        // Always return in lowercase for object names
        return `${t[firstPartKey].toLowerCase()} ${t.status.toLowerCase()}`;
      }
    }
  }
  
  // Try to translate compound names word by word (e.g., "rgbw kleur" -> "rgbw color")
  // Or single words that might be translations themselves (e.g., "state" -> "status")
  // Split the name into words and try to translate each word separately
  const words = normalizedName.split(/\s+/);
  const translatedWords = words.map(word => {
    // Try to find translation for this word via objectNameMap first
    const wordKey = objectNameMap[word] || objectNameMap[word.toLowerCase()];
    if (wordKey) {
      const t = getTranslation(lang);
      const translation = t[wordKey as keyof Translations];
      if (translation && typeof translation === 'string') {
        return translation.toLowerCase();
      }
    }
    
    // If not in map, search through all translation keys to find matching word
    // This handles cases where a translated word (like "state") needs to be re-translated
    const tNL = getTranslation('nl');
    const translationKeys = Object.keys(tNL) as Array<keyof Translations>;
    
    for (const translationKey of translationKeys) {
      // Check if the word matches a translation in any language
      for (const checkLang of ['nl', 'en', 'es', 'fr', 'de'] as const) {
        const tLang = getTranslation(checkLang);
        const translationValue = tLang[translationKey];
        if (!translationValue || typeof translationValue !== 'string') continue;
        
        // Check if this word matches the translation (case-insensitive)
        if (translationValue.toLowerCase() === word) {
          // Found a match - return the translation for the target language
          const targetTranslation = getTranslation(lang)[translationKey];
          if (targetTranslation && typeof targetTranslation === 'string') {
            return targetTranslation.toLowerCase();
          }
        }
      }
    }
    
    // If no translation found, keep the original word
    return word;
  });
  
  // Return the translated result (will be same as original if no translation found)
  return translatedWords.join(' ');
};

// Helper function to get standard (Dutch) object name from any translated name
export const getStandardObjectName = (name: string): string => {
  if (!name) return '';
  if (typeof name !== 'string') return '';
  
  // Normalize the name for comparison (lowercase, trim)
  const normalizedName = name.toLowerCase().trim();
  
  // Get Dutch translation to find the standard form
  const tNL = getTranslation('nl');
  
  // Check if the name is already in the map (could be any language variant)
  if (objectNameMap[normalizedName] || objectNameMap[name]) {
    const translationKey = objectNameMap[normalizedName] || objectNameMap[name];
    // Return Dutch (standard) version
    return tNL[translationKey as keyof Translations].toLowerCase();
  }
  
  // Try to find by matching against all language translations
  // Iterate through all translation keys and check all language variants
  const translationKeys = new Set(Object.values(objectNameMap));
  for (const translationKey of translationKeys) {
    // Check all languages to see if name matches this key
    for (const lang of ['nl', 'en', 'es', 'fr', 'de'] as const) {
      const tLang = getTranslation(lang);
      const translationValue = tLang[translationKey as keyof Translations];
      // Skip if translation doesn't exist
      if (!translationValue || typeof translationValue !== 'string') continue;
      const translated = translationValue.toLowerCase();
      if (normalizedName === translated) {
        // Found a match - return Dutch version
        const nlValue = tNL[translationKey as keyof Translations];
        if (nlValue && typeof nlValue === 'string') {
          return nlValue.toLowerCase();
        }
      }
    }
  }
  
  // Handle compound names like "aan/uit status", "on/off state", etc.
  const parts = normalizedName.split(' ');
  const lastPart = parts[parts.length - 1];
  
  // Check if the last part is a status suffix in any language
  const statusSuffixes = ['status', 'state', 'estado', 'état', 'zustand'];
  const isStatusSuffix = statusSuffixes.includes(lastPart);
  
  if (parts.length >= 2 && isStatusSuffix) {
    const firstPart = parts.slice(0, -1).join(' ');
    // Check if firstPart matches any translated object name
    for (const translationKey of translationKeys) {
      // Get all language translations for this key
      for (const lang of ['nl', 'en', 'es', 'fr', 'de'] as const) {
        const tLang = getTranslation(lang);
        const translationValue = tLang[translationKey as keyof Translations];
        // Skip if translation doesn't exist
        if (!translationValue || typeof translationValue !== 'string') continue;
        const translated = translationValue.toLowerCase();
        if (firstPart === translated) {
          // Found a match - return Dutch version + "status"
          const nlTranslation = tNL[translationKey as keyof Translations];
          if (nlTranslation && typeof nlTranslation === 'string') {
            const nlStatus = tNL.status.toLowerCase();
            return `${nlTranslation.toLowerCase()} ${nlStatus}`;
          }
        }
      }
    }
  }
  
  // Try to convert compound names word by word (e.g., "rgbw color" -> "rgbw kleur")
  // Split the name into words and try to convert each word separately to Dutch
  const words = normalizedName.split(/\s+/);
  if (words.length > 1) {
    const standardWords = words.map(word => {
      // Try to find translation key for this word in any language
      for (const lang of ['nl', 'en', 'es', 'fr', 'de'] as const) {
        const tLang = getTranslation(lang);
        // Search through translation keys to find a match
        for (const [checkName, key] of Object.entries(objectNameMap)) {
          if (checkName.toLowerCase() === word) {
            // Found a match - return Dutch version
            const nlValue = tNL[key as keyof Translations];
            if (nlValue && typeof nlValue === 'string') {
              return nlValue.toLowerCase();
            }
          }
        }
      }
      // If no translation found, keep the original word
      return word;
    });
    return standardWords.join(' ');
  }
  
  // If not found, return original name (might be user-defined)
  return name.toLowerCase();
};

// Helper function to get the standard translation key from any variant of a fixed address name
export const getFixedAddressKey = (name: string): keyof Translations | null => {
  // First fix encoding issues before normalizing
  let fixedName = name;
  if (fixedName.includes('Ã')) {
    fixedName = fixedName.replace(/scÃ¨nes/gi, 'scènes')
                         .replace(/scÃ©nes/gi, 'scènes')
                         .replace(/scÃ¨ne/gi, 'scène')
                         .replace(/scÃ©ne/gi, 'scène')
                         .replace(/Ã¨/g, 'è')
                         .replace(/Ã©/g, 'é');
  }
  
  const nameLower = fixedName.toLowerCase().trim();
  
  // Map of all variants to their translation keys
  const fixedAddressMap: Record<string, keyof Translations> = {
    // General variants
    'algemeen': 'general',
    'general': 'general',
    'allgemein': 'general',
    'général': 'general',
    // Central variants
    'centraal': 'central',
    'centraal objecten': 'central',
    'central': 'central',
    'central objects': 'central',
    'zentral': 'central',
    'zentrale objekte': 'central',
    'objets centraux': 'central',
    'objetos centrales': 'central',
    'objetos central': 'central',
    // Scene variants - include corrupted versions
    'scÃ¨nes': 'scene',  // Add corrupted version
    'scÃ©nes': 'scene',  // Add corrupted version
    'scène\'s': 'scene',
    'scenes': 'scene',
    'scene': 'scene',
    'szenen': 'scene',
    'scènes': 'scene',
    'escenas': 'scene',
    'escena': 'scene',
    // All off variants
    'alles uit': 'allOff',
    'all off': 'allOff',
    'alles aus': 'allOff',
    'todo apagado': 'allOff',
    'tout éteindre': 'allOff',
    // Welcome variants
    'welkom': 'welcome',
    'welcome': 'welcome',
    'willkommen': 'welcome',
    'bienvenido': 'welcome',
    'bienvenue': 'welcome'
  };
  
  return fixedAddressMap[nameLower] || null;
};

// Fix encoding issues where UTF-8 characters are incorrectly decoded
// Fixes all UTF-8 misinterpretations, not just "scÃ¨nes"
const fixEncodingInTranslations = (str: string): string => {
  if (!str) return str;
  
  // If no mojibake patterns detected, return as-is
  if (!str.includes('Ã')) {
    return str;
  }
  
  let fixed = str;
  
  // Fix all UTF-8 misinterpretations systematically
  // Spanish/French accented characters
  fixed = fixed.replace(/Ã¡/g, 'á')   // á = UTF-8 C3 A1
               .replace(/Ã©/g, 'é')   // é = UTF-8 C3 A9
               .replace(/Ã­/g, 'í')   // í = UTF-8 C3 AD
               .replace(/Ã³/g, 'ó')   // ó = UTF-8 C3 B3
               .replace(/Ãº/g, 'ú')   // ú = UTF-8 C3 BA
               .replace(/Ã±/g, 'ñ')   // ñ = UTF-8 C3 B1
               .replace(/Ã /g, 'à')   // à = UTF-8 C3 A0
               .replace(/Ã¨/g, 'è')   // è = UTF-8 C3 A8
               .replace(/Ã¬/g, 'ì')   // ì = UTF-8 C3 AC
               .replace(/Ã²/g, 'ò')   // ò = UTF-8 C3 B2
               .replace(/Ã¹/g, 'ù')   // ù = UTF-8 C3 B9
               .replace(/Ã¢/g, 'â')   // â = UTF-8 C3 A2
               .replace(/Ãª/g, 'ê')   // ê = UTF-8 C3 AA
               .replace(/Ã®/g, 'î')   // î = UTF-8 C3 AE
               .replace(/Ã´/g, 'ô')   // ô = UTF-8 C3 B4
               .replace(/Ã»/g, 'û')   // û = UTF-8 C3 BB
               .replace(/Ã¤/g, 'ä')   // ä = UTF-8 C3 A4
               .replace(/Ã«/g, 'ë')   // ë = UTF-8 C3 AB
               .replace(/Ã¯/g, 'ï')   // ï = UTF-8 C3 AF
               .replace(/Ã¶/g, 'ö')   // ö = UTF-8 C3 B6
               .replace(/Ã¼/g, 'ü')   // ü = UTF-8 C3 BC
               .replace(/Ã¿/g, 'ÿ')   // ÿ = UTF-8 C3 BF
               .replace(/Ã§/g, 'ç');  // ç = UTF-8 C3 A7
  
  // Specific common word fixes
  fixed = fixed.replace(/scÃ¨nes/gi, 'scènes')
               .replace(/scÃ©nes/gi, 'scènes')
               .replace(/atenuaciÃ³n/gi, 'atenuación')
               .replace(/posiciÃ³n/gi, 'posición');
  
  return fixed;
};

// Helper function to translate standard fixed address names
export const translateFixedAddressName = (name: string, lang: Language): string => {
  // First fix any encoding issues in the input name
  const fixedInputName = fixEncodingInTranslations(name);
  
  const translationKey = getFixedAddressKey(fixedInputName);
  
  if (translationKey) {
    // Special handling for "central" and "scene" - use specific translations for middle group names
    if (translationKey === 'central') {
      const centralTranslations: Record<Language, string> = {
        nl: 'centraal',
        en: 'central',
        es: 'central',
        fr: 'central',
        de: 'zentral'
      };
      return centralTranslations[lang];
    }
    if (translationKey === 'scene') {
      // Explicitly return the correct UTF-8 string using Unicode escape
      // This ensures the string is always correctly encoded
      const sceneTranslations: Record<Language, string> = {
        nl: 'sc\u00E8nes',  // Explicit Unicode escape for è (U+00E8) = scènes
        en: 'scenes',
        es: 'escenas',
        fr: 'sc\u00E8nes',  // Explicit Unicode escape for è (U+00E8) = scènes
        de: 'szenen'
      };
      const result = sceneTranslations[lang];
      // Double-check and fix encoding issues in the result (shouldn't be needed, but just in case)
      return fixEncodingInTranslations(result);
    }
    
    // For other keys, use the translations object
    const t = getTranslation(lang);
    if (t[translationKey]) {
      const result = t[translationKey];
      // Fix encoding issues in the result
      return fixEncodingInTranslations(result);
    }
  }
  
  // Return original name if not found, but fix encoding issues first
  return fixEncodingInTranslations(name);
};

// Helper function to translate sub names that could be either fixed address names or object names
export const translateSubName = (name: string, lang: Language): string => {
  if (!name) return name;
  
  // Normalize the input name (lowercase, trim) for lookup
  const normalizedName = name.toLowerCase().trim();
  
  // First try translateFixedAddressName (for names like "centraal", "scènes", "alles uit", "welkom")
  const fixedAddressTranslation = translateFixedAddressName(normalizedName, lang);
  if (fixedAddressTranslation !== normalizedName) {
    return fixedAddressTranslation;
  }
  
  // If not a fixed address name, try translateObjectName (for object names like "on/off", "status")
  const objectNameTranslation = translateObjectName(normalizedName, lang);
  if (objectNameTranslation !== normalizedName) {
    return objectNameTranslation;
  }
  
  // If neither translation worked, return original name (preserve original casing)
  return name;
};

// Helper function to get the standard name from any variant (for storing)
export const getStandardFixedAddressName = (name: string, lang: Language): string => {
  const translationKey = getFixedAddressKey(name);
  
  if (translationKey) {
    // Return the Dutch version as the standard (since that's what's stored in store.ts)
    const t = getTranslation('nl');
    return t[translationKey];
  }
  
  // Return original name if not a standard name
  return name;
};

// Function to translate a template when language changes
export const translateTemplate = (template: any, lang: Language): any => {
  if (!template || !template.teachByExampleConfig) {
    return template;
  }
  
  const t = getTranslation(lang);
  const translatedTemplate = { ...template };
  
  // Translate teachByExampleConfig
  if (translatedTemplate.teachByExampleConfig) {
    const config = { ...translatedTemplate.teachByExampleConfig };
    
    // Translate category configurations
    if (config.categories) {
      const categories = { ...config.categories };
      
      // Helper to translate a category config
      const translateCategory = (category: any): any => {
        if (!category) return category;
        
        // Handle array of categories
        if (Array.isArray(category)) {
          return category.map(translateCategory);
        }
        
        const translated = { ...category };
        
        // Translate object names in exampleAddresses (only if they are standard names)
        // First convert to standard (Dutch) form, then translate to target language
        if (translated.exampleAddresses && Array.isArray(translated.exampleAddresses)) {
          translated.exampleAddresses = translated.exampleAddresses.map((addr: any) => {
            const currentName = addr.objectName || '';
            // First convert to standard (Dutch) form
            const standardName = getStandardObjectName(currentName);
            // Then translate to target language
            const translatedName = translateObjectName(standardName, lang);
            return {
              ...addr,
              objectName: translatedName
            };
          });
        }
        
        // Translate object names in extraObjects (only if they are standard names)
        // First convert to standard (Dutch) form, then translate to target language
        if (translated.extraObjects && Array.isArray(translated.extraObjects)) {
          translated.extraObjects = translated.extraObjects.map((obj: any) => {
            const currentName = obj.name || '';
            // First convert to standard (Dutch) form
            const standardName = getStandardObjectName(currentName);
            // Then translate to target language
            const translatedName = translateObjectName(standardName, lang);
            return {
              ...obj,
              name: translatedName
            };
          });
        }
        
        return translated;
      };
      
      // Translate each category
      if (categories.switching) {
        categories.switching = translateCategory(categories.switching);
      }
      if (categories.dimming) {
        categories.dimming = translateCategory(categories.dimming);
      }
      if (categories.shading) {
        categories.shading = translateCategory(categories.shading);
      }
      if (categories.hvac) {
        categories.hvac = translateCategory(categories.hvac);
      }
      
      config.categories = categories;
    }
    
    translatedTemplate.teachByExampleConfig = config;
  }
  
  // Translate fixed addresses
  if (translatedTemplate.devices && translatedTemplate.devices.fixed) {
    const fixed = { ...translatedTemplate.devices.fixed };
    
    if (fixed.mainGroups && Array.isArray(fixed.mainGroups)) {
      fixed.mainGroups = fixed.mainGroups.map((mainGroup: any) => {
        const translatedMain = { ...mainGroup };
        
        // Translate main group name if it's a standard name
        const originalMainName = translatedMain.name;
        const translatedMainName = translateFixedAddressName(originalMainName, lang);
        translatedMain.name = translatedMainName !== originalMainName ? translatedMainName : originalMainName;
        
        // Translate middle groups
        if (translatedMain.middleGroups && Array.isArray(translatedMain.middleGroups)) {
          translatedMain.middleGroups = translatedMain.middleGroups.map((middleGroup: any) => {
            const translatedMiddle = { ...middleGroup };
            
            // Translate middle group name if it's a standard name
            const originalMiddleName = translatedMiddle.name;
            const translatedMiddleName = translateFixedAddressName(originalMiddleName, lang);
            translatedMiddle.name = translatedMiddleName !== originalMiddleName ? translatedMiddleName : originalMiddleName;
            
            // Translate sub addresses
            if (translatedMiddle.subs && Array.isArray(translatedMiddle.subs)) {
              translatedMiddle.subs = translatedMiddle.subs.map((sub: any) => {
                const translatedSub = { ...sub };
                
                // Translate sub name if it's a standard name
                const originalSubName = translatedSub.name;
                const translatedSubName = translateFixedAddressName(originalSubName, lang);
                translatedSub.name = translatedSubName !== originalSubName ? translatedSubName : originalSubName;
                
                return translatedSub;
              });
            }
            
            return translatedMiddle;
          });
        }
        
        return translatedMain;
      });
    }
    
    translatedTemplate.devices.fixed = fixed;
  }
  
  return translatedTemplate;
};

// NOTE: User input translation functions and maps have been moved to userInputTranslations.ts
// The following code has been commented out to prevent circular dependencies and initialization issues
// All user input translation functions should be imported from userInputTranslations.ts instead
/*
const userInputTranslationMap: Record<string, string> = {
  // Room names - Dutch
  'entree': 'entree',
  'keuken': 'keuken',
  'eetkamer': 'eetkamer',
  'woonkamer': 'woonkamer',
  'slaapkamer': 'slaapkamer',
  'badkamer': 'badkamer',
  'toilet': 'toilet',
  'gang': 'gang',
  'hal': 'hal',
  'berging': 'berging',
  'zolder': 'zolder',
  'kelder': 'kelder',
  'bureau': 'bureau',
  'kantoor': 'kantoor',
  // Room names - English
  'kitchen': 'keuken',
  'dining room': 'eetkamer',
  'living room': 'woonkamer',
  'bedroom': 'slaapkamer',
  'bathroom': 'badkamer',
  'corridor': 'gang',
  'hallway': 'hal',
  'storage': 'berging',
  'attic': 'zolder',
  'basement': 'kelder',
  'office': 'kantoor',
  // Room names - Spanish
  'hall': 'entree',
  'cocina': 'keuken',
  'comedor': 'eetkamer',
  'sala': 'woonkamer',
  'dormitorio': 'slaapkamer',
  'baño': 'badkamer',
  'aseo': 'toilet',
  'pasillo': 'gang',
  'despensa': 'berging',
  'ático': 'zolder',
  'sótano': 'kelder',
  'oficina': 'kantoor',
  // Room names - French
  'cuisine': 'keuken',
  'salle à manger': 'eetkamer',
  'salon': 'woonkamer',
  'chambre': 'slaapkamer',
  'salle de bain': 'badkamer',
  'toilettes': 'toilet',
  'couloir': 'gang',
  'débarras': 'berging',
  'grenier': 'zolder',
  'cave': 'kelder',
  // Room names - German
  'Halle': 'entree',
  'halle': 'entree',
  'Küche': 'keuken',
  'küche': 'keuken',
  'Esszimmer': 'eetkamer',
  'esszimmer': 'eetkamer',
  'Wohnzimmer': 'woonkamer',
  'wohnzimmer': 'woonkamer',
  'Schlafzimmer': 'slaapkamer',
  'schlafzimmer': 'slaapkamer',
  'Badezimmer': 'badkamer',
  'badezimmer': 'badkamer',
  'Toilette': 'toilet',
  'toilette': 'toilet',
  'Flur': 'gang',
  'flur': 'gang',
  'Speicher': 'berging',
  'speicher': 'berging',
  'Dachboden': 'zolder',
  'dachboden': 'zolder',
  'Keller': 'kelder',
  'keller': 'kelder',
  'Büro': 'kantoor',
  'büro': 'kantoor',
  
  // Fixture names - Dutch
  'wandlamp': 'wandlamp',
  'plafondlamp': 'plafondlamp',
  'hanglamp': 'hanglamp',
  'staande lamp': 'staande lamp',
  'bureaulamp': 'bureaulamp',
  'spots': 'spots',
  'led strip': 'led strip',
  'buitenlamp': 'buitenlamp',
  'tuinlamp': 'tuinlamp',
  // Fixture names - English
  'wall light': 'wandlamp',
  'ceiling light': 'plafondlamp',
  'pendant light': 'hanglamp',
  'floor lamp': 'staande lamp',
  'desk lamp': 'bureaulamp',
  'spotlights': 'spots',
  'outdoor light': 'buitenlamp',
  'garden light': 'tuinlamp',
  // Fixture names - Spanish
  'luz de pared': 'wandlamp',
  'luz de techo': 'plafondlamp',
  'lámpara colgante': 'hanglamp',
  'lámpara de pie': 'staande lamp',
  'lámpara de escritorio': 'bureaulamp',
  'focos': 'spots',
  'tira led': 'led strip',
  'luz exterior': 'buitenlamp',
  'luz de jardín': 'tuinlamp',
  // Fixture names - French
  'lumière murale': 'wandlamp',
  'plafonnier': 'plafondlamp',
  'suspension': 'hanglamp',
  'lampe sur pied': 'staande lamp',
  'lampe de bureau': 'bureaulamp',
  'bande led': 'led strip',
  'éclairage extérieur': 'buitenlamp',
  'éclairage de jardin': 'tuinlamp',
  // Fixture names - German
  'Wandlampe': 'wandlamp',
  'wandlampe': 'wandlamp',
  'Deckenleuchte': 'plafondlamp',
  'deckenleuchte': 'plafondlamp',
  'Hängelampe': 'hanglamp',
  'hängelampe': 'hanglamp',
  'Stehlampe': 'staande lamp',
  'stehlampe': 'staande lamp',
  'Schreibtischlampe': 'bureaulamp',
  'schreibtischlampe': 'bureaulamp',
  'Spots': 'spots',
  'LED-Streifen': 'led strip',
  'led-streifen': 'led strip',
  'Außenleuchte': 'buitenlamp',
  'außenleuchte': 'buitenlamp',
  'Gartenleuchte': 'tuinlamp',
  'gartenleuchte': 'tuinlamp'
};

// Translation map from Dutch base terms to other languages
const roomNameTranslations: Record<string, Record<Language, string>> = {
  'entree': { nl: 'entree', en: 'hall', es: 'hall', fr: 'hall', de: 'Halle' },
  'keuken': { nl: 'keuken', en: 'kitchen', es: 'cocina', fr: 'cuisine', de: 'Küche' },
  'eetkamer': { nl: 'eetkamer', en: 'dining room', es: 'comedor', fr: 'salle à manger', de: 'Esszimmer' },
  'woonkamer': { nl: 'woonkamer', en: 'living room', es: 'sala', fr: 'salon', de: 'Wohnzimmer' },
  'slaapkamer': { nl: 'slaapkamer', en: 'bedroom', es: 'dormitorio', fr: 'chambre', de: 'Schlafzimmer' },
  'badkamer': { nl: 'badkamer', en: 'bathroom', es: 'baño', fr: 'salle de bain', de: 'Badezimmer' },
  'toilet': { nl: 'toilet', en: 'toilet', es: 'aseo', fr: 'toilettes', de: 'Toilette' },
  'gang': { nl: 'gang', en: 'corridor', es: 'pasillo', fr: 'couloir', de: 'Flur' },
  'hal': { nl: 'hal', en: 'hallway', es: 'hall', fr: 'hall', de: 'Halle' },
  'berging': { nl: 'berging', en: 'storage', es: 'despensa', fr: 'débarras', de: 'Speicher' },
  'zolder': { nl: 'zolder', en: 'attic', es: 'ático', fr: 'grenier', de: 'Dachboden' },
  'kelder': { nl: 'kelder', en: 'basement', es: 'sótano', fr: 'cave', de: 'Keller' },
  'kantoor': { nl: 'kantoor', en: 'office', es: 'oficina', fr: 'bureau', de: 'Büro' }
};

const fixtureTranslations: Record<string, Record<Language, string>> = {
  'wandlamp': { nl: 'wandlamp', en: 'wall light', es: 'luz de pared', fr: 'lumière murale', de: 'Wandlampe' },
  'plafondlamp': { nl: 'plafondlamp', en: 'ceiling light', es: 'luz de techo', fr: 'plafonnier', de: 'Deckenleuchte' },
  'hanglamp': { nl: 'hanglamp', en: 'pendant light', es: 'lámpara colgante', fr: 'suspension', de: 'Hängelampe' },
  'staande lamp': { nl: 'staande lamp', en: 'floor lamp', es: 'lámpara de pie', fr: 'lampe sur pied', de: 'Stehlampe' },
  'bureaulamp': { nl: 'bureaulamp', en: 'desk lamp', es: 'lámpara de escritorio', fr: 'lampe de bureau', de: 'Schreibtischlampe' },
  'spots': { nl: 'spots', en: 'spotlights', es: 'focos', fr: 'spots', de: 'Spots' },
  'led strip': { nl: 'led strip', en: 'led strip', es: 'tira led', fr: 'bande led', de: 'LED-Streifen' },
  'buitenlamp': { nl: 'buitenlamp', en: 'outdoor light', es: 'luz exterior', fr: 'éclairage extérieur', de: 'Außenleuchte' },
  'tuinlamp': { nl: 'tuinlamp', en: 'garden light', es: 'luz de jardín', fr: 'éclairage de jardin', de: 'Gartenleuchte' }
};
*/

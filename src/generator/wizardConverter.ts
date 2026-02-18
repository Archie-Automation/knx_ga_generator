import {
  TemplateConfig,
  DeviceObjectTemplate,
  WizardTemplateConfig,
  WizardAddressingMode,
  WizardSwitchConfig,
  WizardDimmerConfig,
  WizardBlindConfig,
  WizardHvacConfig,
  AddressingConfig,
  AddressingMode
} from '../types/common';
import { uid } from '../utils/id';

// Convert wizard mode (A/B/C) to addressing mode (mode1/mode2/mode3)
const convertWizardMode = (mode: WizardAddressingMode): AddressingMode => {
  switch (mode) {
    case 'A': return 'mode1';
    case 'B': return 'mode2';
    case 'C': return 'mode3';
    default: return 'mode1';
  }
};

// Convert wizard switch config to DeviceObjectTemplate objects
export const convertWizardSwitchConfig = (
  wizardConfig: WizardSwitchConfig,
  startChannel: number
): DeviceObjectTemplate[] => {
  const objects: DeviceObjectTemplate[] = [];
  
  if (wizardConfig.mode === 'A') {
    // MODE A: Functie / Type / Device
    const func = wizardConfig.functionNumber || 3;
    const onoffMiddle = wizardConfig.typeGroups?.onoff || 1;
    const statusMiddle = wizardConfig.typeGroups?.status || 2;
    const startSub = wizardConfig.startSub || 1;
    
    objects.push({
      id: uid(),
      name: 'aan/uit',
      dpt: 'DPT1.001',
      main: func,
      middle: onoffMiddle,
      start: startSub,
      enabled: true,
      isDefault: true
    });
    
    objects.push({
      id: uid(),
      name: 'aan/uit status',
      dpt: 'DPT1.002',
      main: func,
      middle: statusMiddle,
      start: startSub,
      enabled: true,
      isDefault: true
    });
  } else if (wizardConfig.mode === 'B' || wizardConfig.mode === 'C') {
    // MODE B/C: Verdieping / Functie / Device
    const floor = typeof wizardConfig.floor === 'number' ? wizardConfig.floor : 0;
    const func = wizardConfig.functionNumber || 1;
    const startSub = wizardConfig.startSub || 1;
    
    objects.push({
      id: uid(),
      name: 'aan/uit',
      dpt: 'DPT1.001',
      main: floor,
      middle: func,
      start: startSub,
      enabled: true,
      isDefault: true
    });
    
    if (wizardConfig.mode === 'B' && wizardConfig.statusStrategy === '+1') {
      objects.push({
        id: uid(),
        name: 'aan/uit status',
        dpt: 'DPT1.002',
        main: floor,
        middle: func,
        start: startSub + 1,
        enabled: true,
        isDefault: true
      });
    } else if (wizardConfig.mode === 'C') {
      const offset = wizardConfig.statusOffset || 100;
      objects.push({
        id: uid(),
        name: 'aan/uit status',
        dpt: 'DPT1.002',
        main: floor,
        middle: func,
        start: startSub + offset,
        enabled: true,
        isDefault: true
      });
    }
  }
  
  return objects;
};

// Convert wizard dimmer config to DeviceObjectTemplate objects
export const convertWizardDimmerConfig = (
  wizardConfig: WizardDimmerConfig,
  switchConfig: WizardSwitchConfig | undefined,
  startChannel: number
): DeviceObjectTemplate[] => {
  const objects: DeviceObjectTemplate[] = [];
  
  if (wizardConfig.inheritFromSwitching && switchConfig) {
    // Inherit from switch config
    if (wizardConfig.inheritMode === 'exact') {
      // Exact same structure, but addresses will be marked as disabled/hidden
      const switchObjects = convertWizardSwitchConfig(switchConfig, startChannel);
      return switchObjects.map(obj => ({
        ...obj,
        name: obj.name.replace('aan/uit', 'dimmen').replace('Aan/Uit', 'Dimmen'),
        dpt: obj.name.includes('status') ? 'DPT5.001' : 'DPT5.001',
        enabled: false // Will be generated with name "---"
      }));
    } else if (wizardConfig.inheritMode === 'extended') {
      // Same structure + extra objects
      const switchObjects = convertWizardSwitchConfig(switchConfig, startChannel);
      const baseObjects = switchObjects.map(obj => ({
        ...obj,
        name: obj.name.replace('aan/uit', 'dimmen').replace('Aan/Uit', 'Dimmen'),
        dpt: obj.name.includes('status') ? 'DPT5.001' : 'DPT5.001',
        enabled: false
      }));
      
      // Add extra objects based on strategy
      const extraObjects = wizardConfig.extraObjects?.enabledObjects || [];
      // TODO: Implement extra objects based on strategy
      
      return [...baseObjects];
    }
  } else {
    // Own structure - convert similar to switch
    if (wizardConfig.mode === 'A') {
      const func = wizardConfig.functionNumber || 2;
      const onoffMiddle = wizardConfig.typeGroups?.onoff || 1;
      const statusMiddle = wizardConfig.typeGroups?.status || 4;
      const startSub = wizardConfig.startSub || 1;
      
      objects.push({
        id: uid(),
        name: 'aan/uit',
        dpt: 'DPT1.001',
        main: func,
        middle: onoffMiddle,
        start: startSub,
        enabled: true,
        isDefault: true
      });
      
      objects.push({
        id: uid(),
        name: 'dimmen',
        dpt: 'DPT3.007',
        main: func,
        middle: onoffMiddle + 1,
        start: startSub,
        enabled: true,
        isDefault: true
      });
      
      objects.push({
        id: uid(),
        name: 'waarde',
        dpt: 'DPT5.001',
        main: func,
        middle: onoffMiddle + 2,
        start: startSub,
        enabled: true,
        isDefault: true
      });
      
      objects.push({
        id: uid(),
        name: 'aan/uit status',
        dpt: 'DPT1.002',
        main: func,
        middle: statusMiddle,
        start: startSub,
        enabled: true,
        isDefault: true
      });
      
      objects.push({
        id: uid(),
        name: 'waarde status',
        dpt: 'DPT5.001',
        main: func,
        middle: statusMiddle + 1,
        start: startSub,
        enabled: true,
        isDefault: true
      });
    }
    // TODO: Add MODE B and C for dimmer
  }
  
  return objects;
};

// Convert wizard blind config to DeviceObjectTemplate objects
export const convertWizardBlindConfig = (
  wizardConfig: WizardBlindConfig,
  startChannel: number
): DeviceObjectTemplate[] => {
  const objects: DeviceObjectTemplate[] = [];
  
  if (wizardConfig.mode === 'A') {
    const func = wizardConfig.functionNumber || 3;
    const updown = wizardConfig.typeGroups?.updown || 1;
    const stop = wizardConfig.typeGroups?.stop || 2;
    const position = wizardConfig.typeGroups?.position || 3;
    const status = wizardConfig.typeGroups?.status || 4;
    const startSub = wizardConfig.startSub || 1;
    
    objects.push({
      id: uid(),
      name: 'op/neer',
      dpt: 'DPT1.008',
      main: func,
      middle: updown,
      start: startSub,
      enabled: true,
      isDefault: true
    });
    
    objects.push({
      id: uid(),
      name: 'stop',
      dpt: 'DPT1.010',
      main: func,
      middle: stop,
      start: startSub,
      enabled: true,
      isDefault: true
    });
    
    objects.push({
      id: uid(),
      name: 'waarde',
      dpt: 'DPT5.001',
      main: func,
      middle: position,
      start: startSub,
      enabled: true,
      isDefault: true
    });
    
    objects.push({
      id: uid(),
      name: 'waarde status',
      dpt: 'DPT5.001',
      main: func,
      middle: status,
      start: startSub,
      enabled: true,
      isDefault: true
    });
    
    objects.push({
      id: uid(),
      name: 'lamellen',
      dpt: 'DPT5.001',
      main: func,
      middle: position + 1,
      start: startSub,
      enabled: true,
      isDefault: true
    });
    
    objects.push({
      id: uid(),
      name: 'lamellen positie status',
      dpt: 'DPT5.001',
      main: func,
      middle: status + 1,
      start: startSub,
      enabled: true,
      isDefault: true
    });
  }
  // TODO: Add MODE B and C for blind
  
  return objects;
};

// Convert wizard HVAC config to DeviceObjectTemplate objects
export const convertWizardHvacConfig = (
  wizardConfig: WizardHvacConfig,
  startChannel: number
): DeviceObjectTemplate[] => {
  const objects: DeviceObjectTemplate[] = [];
  
  // HVAC objects based on zoneObjects configuration
  const zoneObjects = wizardConfig.zoneObjects || ['setpoint', 'actual temp', 'mode', 'fan speed', 'status'];
  
  if (wizardConfig.mode === 'A') {
    const func = wizardConfig.functionNumber || 4;
    const startSub = wizardConfig.startSub || 1;
    
    let middleCounter = 1;
    zoneObjects.forEach((objName, idx) => {
      let dpt = 'DPT9.001'; // Default for temperature
      if (objName === 'mode') dpt = 'DPT20.102';
      else if (objName === 'fan speed') dpt = 'DPT5.001';
      else if (objName === 'status') dpt = 'DPT1.001';
      
      objects.push({
        id: uid(),
        name: objName === 'actual temp' ? 'gemeten temperatuur' : objName,
        dpt,
        main: func,
        middle: middleCounter++,
        start: startSub,
        enabled: true,
        isDefault: true
      });
    });
  } else if (wizardConfig.mode === 'B' || wizardConfig.mode === 'C') {
    const floor = typeof wizardConfig.floor === 'number' ? wizardConfig.floor : 0;
    const func = wizardConfig.functionNumber || 4;
    const startSub = wizardConfig.startSub || 1;
    
    zoneObjects.forEach((objName, idx) => {
      let dpt = 'DPT9.001';
      if (objName === 'mode') dpt = 'DPT20.102';
      else if (objName === 'fan speed') dpt = 'DPT5.001';
      else if (objName === 'status') dpt = 'DPT1.001';
      
      objects.push({
        id: uid(),
        name: objName === 'actual temp' ? 'gemeten temperatuur' : objName,
        dpt,
        main: floor,
        middle: func,
        start: startSub + idx,
        enabled: true,
        isDefault: true
      });
    });
  }
  
  return objects;
};

// Convert wizard config to AddressingConfig
export const convertWizardToAddressingConfig = (
  wizardConfig: WizardSwitchConfig | WizardDimmerConfig | WizardBlindConfig | WizardHvacConfig,
  startChannel: number
): AddressingConfig => {
  return {
    mode: convertWizardMode(wizardConfig.mode),
    functionNumber: wizardConfig.functionNumber,
    typeOnOff: 'typeGroups' in wizardConfig && wizardConfig.typeGroups ? 
      (wizardConfig.typeGroups as any).onoff : undefined,
    typeStatus: 'typeGroups' in wizardConfig && wizardConfig.typeGroups ? 
      (wizardConfig.typeGroups as any).status : undefined,
    statusOffset: wizardConfig.statusOffset,
    startChannelNumber: wizardConfig.startSub || startChannel,
    channelIncrement: true
  };
};

// Main converter: convert wizard template config to regular template config
export const convertWizardTemplateToTemplate = (
  wizardConfig: WizardTemplateConfig,
  existingTemplate?: TemplateConfig
): TemplateConfig => {
  const template: TemplateConfig = existingTemplate || {
    name: wizardConfig.templateName || 'Project template',
    addressStructure: 'three-level',
    nameTemplate: {
      pattern: '<roomAddress> <roomName> <fixture> <switchCode> <function>',
      defaultOrder: ['roomAddress', 'roomName', 'fixture', 'switchCode', 'function']
    },
    commentTemplate: '<physical> – <channel>',
    devices: {
      switch: { objects: [] },
      dimmer: { objects: [] },
      blind: { objects: [] },
      hvac: { objects: [], valveControlType: 'bit' },
      fixed: { mainGroups: [] },
      customGroups: []
    },
    createdAt: new Date().toISOString()
  };
  
  // Update template name
  template.name = wizardConfig.templateName || template.name;
  
  // Convert switch config
  if (wizardConfig.schakelen) {
    template.devices.switch.objects = convertWizardSwitchConfig(
      wizardConfig.schakelen,
      wizardConfig.startChannelNumber || 1
    );
    template.devices.switch.addressing = convertWizardToAddressingConfig(
      wizardConfig.schakelen,
      wizardConfig.startChannelNumber || 1
    );
    template.devices.switch.wizardConfig = wizardConfig.schakelen;
  }
  
  // Convert dimmer config
  if (wizardConfig.dimmen) {
    template.devices.dimmer.objects = convertWizardDimmerConfig(
      wizardConfig.dimmen,
      wizardConfig.schakelen,
      wizardConfig.startChannelNumber || 1
    );
    if (!wizardConfig.dimmen.inheritFromSwitching && wizardConfig.dimmen.mode) {
      template.devices.dimmer.addressing = convertWizardToAddressingConfig(
        wizardConfig.dimmen,
        wizardConfig.startChannelNumber || 1
      );
    } else if (wizardConfig.schakelen) {
      // Inherit addressing from switch
      template.devices.dimmer.addressing = template.devices.switch.addressing;
    }
    template.devices.dimmer.wizardConfig = wizardConfig.dimmen;
  }
  
  // Convert blind config
  if (wizardConfig.jaloezie) {
    template.devices.blind.objects = convertWizardBlindConfig(
      wizardConfig.jaloezie,
      wizardConfig.startChannelNumber || 1
    );
    template.devices.blind.addressing = convertWizardToAddressingConfig(
      wizardConfig.jaloezie,
      wizardConfig.startChannelNumber || 1
    );
    template.devices.blind.wizardConfig = wizardConfig.jaloezie;
  }
  
  // Convert HVAC config
  if (wizardConfig.hvac) {
    template.devices.hvac.objects = convertWizardHvacConfig(
      wizardConfig.hvac,
      wizardConfig.startChannelNumber || 1
    );
    template.devices.hvac.addressing = convertWizardToAddressingConfig(
      wizardConfig.hvac,
      wizardConfig.startChannelNumber || 1
    );
    template.devices.hvac.wizardConfig = wizardConfig.hvac;
  }
  
  // Store wizard config in template
  template.wizardConfig = wizardConfig;
  
  return template;
};
























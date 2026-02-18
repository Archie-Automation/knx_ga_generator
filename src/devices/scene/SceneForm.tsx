import { useState } from 'react';
import { SceneDevice, SceneOutput } from '../../types/common';
import { uid } from '../../utils/id';

// Validate physical address format: X.Y.Z where X and Y are 0-15, Z is 0-255
// Always requires exactly 3 numbers with dots: 0.0.0 to 15.15.255
const validatePhysicalAddress = (value: string): string => {
  // Remove any characters that are not digits or dots
  let cleaned = value.replace(/[^0-9.]/g, '');
  
  // Split by dots to validate each part
  const parts = cleaned.split('.');
  
  // Limit to 3 parts maximum
  if (parts.length > 3) {
    parts.splice(3);
  }
  
  // Validate and limit each part, always ensure we have 3 parts
  const validatedParts: string[] = [];
  for (let i = 0; i < 3; i++) {
    let part = parts[i] || '';
    
    if (part === '') {
      // If part is empty and we're building the address, keep it empty for typing
      validatedParts.push('');
      continue;
    }
    
    const num = parseInt(part, 10);
    if (isNaN(num)) {
      validatedParts.push('');
    } else if (i < 2) {
      // First two parts: 0-15
      validatedParts.push(Math.min(15, Math.max(0, num)).toString());
    } else {
      // Third part: 0-255
      validatedParts.push(Math.min(255, Math.max(0, num)).toString());
    }
  }
  
  return validatedParts.join('.');
};

interface Props {
  onSave: (device: SceneDevice) => void;
}

export const SceneForm = ({ onSave }: Props) => {
  const [manufacturer, setManufacturer] = useState('Universeel');
  const [model, setModel] = useState('Scene module');
  const [physicalAddress, setPhysicalAddress] = useState('1.1.40');
  const [outputs, setOutputs] = useState<SceneOutput[]>([]);

  const addScene = () => {
    const nextIdx = outputs.length + 1;
    setOutputs([
      ...outputs,
      {
        id: uid(),
        floor: '0',
        roomNumber: `${nextIdx}`,
        roomName: 'Ruimte',
        fixture: `Scene`,
        sceneNumber: nextIdx
      }
    ]);
  };

  const updateOutput = (id: string, key: keyof SceneOutput, value: string | number) => {
    setOutputs((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [key]: value as never } : o))
    );
  };

  const save = () => {
    const device: SceneDevice = {
      id: uid(),
      category: 'scene',
      manufacturer,
      model,
      physicalAddress,
      outputs
    };
    onSave(device);
    setOutputs([]);
  };

  return (
    <div className="card">
      <div className="flex-between">
        <h4>Scenes</h4>
        <button className="button ghost" onClick={addScene}>
          + Scene
        </button>
      </div>
      <div className="grid grid-3">
        <input className="input" value={manufacturer} onChange={(e) => setManufacturer(e.target.value.toLowerCase())} />
        <input className="input" value={model} onChange={(e) => setModel(e.target.value.toLowerCase())} />
        <input className="input" value={physicalAddress} onChange={(e) => {
          const validated = validatePhysicalAddress(e.target.value);
          setPhysicalAddress(validated);
        }} />
      </div>
      {outputs.map((output, idx) => (
        <div key={output.id} className="card">
          <div className="label">Scene {idx + 1}</div>
          <div className="grid grid-3">
            <input
              className="input"
              value={output.sceneNumber}
              type="number"
              onChange={(e) => updateOutput(output.id, 'sceneNumber', Number(e.target.value))}
            />
            <input
              className="input"
              placeholder="Verdieping"
              value={output.floor}
              onChange={(e) => updateOutput(output.id, 'floor', e.target.value)}
            />
            <input
              className="input"
              placeholder="Ruimte nr"
              value={output.roomNumber}
              onChange={(e) => updateOutput(output.id, 'roomNumber', e.target.value)}
            />
            <input
              className="input"
              placeholder="Ruimte naam"
              value={output.roomName}
              onChange={(e) => updateOutput(output.id, 'roomName', e.target.value.toLowerCase())}
            />
            <input
              className="input"
              placeholder="Naam"
              value={output.fixture}
              onChange={(e) => updateOutput(output.id, 'fixture', e.target.value.toLowerCase())}
            />
          </div>
        </div>
      ))}
      <div className="flex" style={{ marginTop: 12 }}>
        <button className="button primary" onClick={save} disabled={outputs.length === 0}>
          Bewaar scenes
        </button>
      </div>
    </div>
  );
};




















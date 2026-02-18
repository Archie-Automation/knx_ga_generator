/**
 * Generate channel name based on manufacturer and channel index (1-based).
 * Used for switch, blind, dimmer actuators and floor distributor actuators.
 */
export function generateChannelName(
  manufacturer: string,
  channelIndex: number,
  isDimmer: boolean = false,
  channelCount: number = 0
): string {
  const mfr = manufacturer.toLowerCase().trim();

  // Special case for dimmers with more than 8 channels
  if (isDimmer && channelCount > 8) {
    const group = Math.floor((channelIndex - 1) / 16) + 1;
    const channelInGroup = ((channelIndex - 1) % 16) + 1;
    return `Da${group}.${channelInGroup}`;
  }

  // Gira or Jung: A1, A2, A3, etc.
  if (mfr === 'gira' || mfr === 'jung') {
    return `A${channelIndex}`;
  }

  // MDT or ABB: A, B, C, etc. (alphabetic)
  if (mfr === 'mdt' || mfr === 'abb') {
    const letter = String.fromCharCode(64 + channelIndex);
    return letter;
  }

  // Theben, Hager, Zennio, or Berker: C1, C2, C3, etc.
  if (mfr === 'theben' || mfr === 'hager' || mfr === 'zennio' || mfr === 'berker') {
    return `C${channelIndex}`;
  }

  // Siemens and default: K1, K2, K3, etc.
  return `K${channelIndex}`;
}

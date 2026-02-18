/**
 * DeviceService – register, list, delete devices (public.devices). Max 2 per user enforced by backend.
 */

import { supabase } from "../lib/supabase";
import type { DeviceRow } from "./types";

export const DeviceService = {
  /**
   * Register current device. Backend/RLS should enforce max 2 per user.
   */
  async registerDevice(payload: {
    user_id: string;
    device_hash: string;
    device_name?: string | null;
    app_version?: string | null;
  }): Promise<void> {
    const { data: existing } = await supabase
      .from("devices")
      .select("id")
      .eq("user_id", payload.user_id)
      .eq("device_hash", payload.device_hash)
      .maybeSingle();

    const now = new Date().toISOString();
    if (existing) {
      const { error } = await supabase
        .from("devices")
        .update({ last_seen: now, device_name: payload.device_name ?? undefined, app_version: payload.app_version ?? undefined })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { count } = await supabase
        .from("devices")
        .select("id", { count: "exact", head: true })
        .eq("user_id", payload.user_id);
      if ((count ?? 0) >= 2) {
        throw new Error("DEVICE_LIMIT_REACHED");
      }
      const { error } = await supabase.from("devices").insert({
        user_id: payload.user_id,
        device_hash: payload.device_hash,
        device_name: payload.device_name ?? null,
        app_version: payload.app_version ?? null,
        last_seen: now,
      });
      if (error) throw error;
    }
  },

  /**
   * List devices for current user.
   */
  async getDevices(): Promise<DeviceRow[]> {
    const { data, error } = await supabase
      .from("devices")
      .select("id, user_id, device_hash, device_name, app_version, created_at, last_seen")
      .order("last_seen", { ascending: false });

    if (error) throw error;
    return (data ?? []) as DeviceRow[];
  },

  /**
   * Delete device by id.
   */
  async deleteDevice(deviceId: string): Promise<void> {
    const { error } = await supabase.from("devices").delete().eq("id", deviceId);
    if (error) throw error;
  },

  /**
   * Update the display name of a device (user-facing label only).
   * Only device_name is updated; device_hash (fingerprint) is never exposed or changed.
   */
  async updateDeviceName(deviceId: string, deviceName: string | null): Promise<void> {
    const { error } = await supabase
      .from("devices")
      .update({ device_name: deviceName?.trim() || null })
      .eq("id", deviceId);
    if (error) throw error;
  },
};

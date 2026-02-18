/**
 * AuthService – Supabase auth session and sign out.
 */

import { supabase } from "../lib/supabase";

export const AuthService = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async signOut() {
    await supabase.auth.signOut();
  },
};

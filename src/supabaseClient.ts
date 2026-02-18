import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ajdaacuzcqhuzfmaibpq.supabase.co'
const supabaseKey = 'sb_publishable_rKXK05DQDHUdRXlD34-oyA_2K2RnxBy'
export const supabase = createClient(supabaseUrl, supabaseKey)

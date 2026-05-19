import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Colocando as credenciais diretamente (em formato de texto com aspas)
const supabaseUrl = "https://lpkmrajvwzdjydkyyqzb.supabase.co";
const supabaseKey = "sb_publishable_eJD5CGmw4vvvIBOrq2K2GA_k16eeeyL";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

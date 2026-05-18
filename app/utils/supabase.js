import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Colocando as credenciais diretamente (em formato de texto com aspas)
const supabaseUrl = "https://lpkmrajvwzdjydkyyqzb.supabase.co";
const supabaseKey = "Sua_Chave_Gigante_Aqui";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

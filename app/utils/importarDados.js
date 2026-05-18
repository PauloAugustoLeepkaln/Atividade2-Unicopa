import { Alert } from "react-native";
import copaData from "../assets/data/copaData.json"; // Ajuste esse caminho se a sua pasta assets estiver em outro nível
import { supabase } from "./supabase"; // Apontando para o arquivo que você já tem!

export const sincronizarJogosComBanco = async () => {
  try {
    const jogosParaImportar = copaData.jogos;

   const { error } = await supabase
      .from('jogos_copa') 
      .upsert(jogosParaImportar, { onConflict: 'id' });
      
    if (error) {
      console.error("Erro do Supabase:", error);
      Alert.alert("Erro", "Não foi possível enviar os jogos para o banco.");
      return;
    }

    Alert.alert("Sucesso");

  } catch (erroInesperado) {
    console.error("Erro no código:", erroInesperado);
    Alert.alert("Erro", "Aconteceu um problema inesperado ao tentar importar.");
  }
};
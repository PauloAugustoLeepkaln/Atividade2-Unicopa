import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function LoginCard({ onLoginSuccess, onNavigateToRegister }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Validação do formato do e-mail
  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const lidarComLogin = async () => {
    // Critério: Validar campos obrigatórios
    if (!email.trim() || !senha.trim()) {
      Alert.alert(
        "Campos Obrigatórios",
        "Por favor, preencha o e-mail e a senha.",
      );
      return;
    }

    // Critério: Validar formato de e-mail
    if (!validarEmail(email.trim())) {
      Alert.alert(
        "E-mail Inválido",
        "Por favor, insira um formato de e-mail válido.",
      );
      return;
    }

    try {
      setCarregando(true);

      // Critério: Integrar autenticação com Supabase (sign in)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) throw error;

      // Critério: Em caso de sucesso, atualiza o estado para redirecionar
      if (data?.session) {
        onLoginSuccess(data.session.user);
      }
    } catch (error) {
      // Critério: Em caso de erro, exibir mensagem amigável
      let mensagemAmigavel =
        "Não foi possível realizar o login. Verifique sua conexão.";

      if (error.message === "Invalid login credentials") {
        mensagemAmigavel = "E-mail ou senha incorretos. Tente novamente.";
      } else if (error.message === "Email not confirmed") {
        mensagemAmigavel =
          "Por favor, confirme seu e-mail antes de realizar o login.";
      }

      Alert.alert("Falha no Login", mensagemAmigavel);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Entrar na Conta</Text>

      <Text style={styles.label}>E-mail</Text>
      <TextInput
        style={styles.input}
        placeholder="Seu e-mail"
        placeholderTextColor="#8fa3b8"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Senha</Text>
      <TextInput
        style={styles.input}
        placeholder="Sua senha"
        placeholderTextColor="#8fa3b8"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={styles.botao}
        onPress={lidarComLogin}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color="#040b13" />
        ) : (
          <Text style={styles.botaoTexto}>ENTRAR</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 20, alignItems: "center" }} onPress={onNavigateToRegister}>
        <Text style={{ color: "#8fa3b8", fontSize: 14 }}>
          Não tem uma conta? <Text style={{ color: "#f2cc2f", fontWeight: "bold" }}>Registre-se</Text>
        </Text>
      </TouchableOpacity>
      
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111c2a",
    borderColor: "#1e2d3d",
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  titulo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    color: "#8fa3b8",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#040b13",
    borderColor: "#1e2d3d",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 16,
  },
  botao: {
    backgroundColor: "#f2cc2f",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoTexto: {
    color: "#040b13",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

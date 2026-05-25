import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function RegisterCard({ onGoBack }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState({ texto: "", tipo: "" });

  const handleRegister = async () => {
    // Validações básicas
    if (!email || !senha || !confirmarSenha) {
      setMensagem({
        texto: "E-mail, senha e confirmação são obrigatórios.",
        tipo: "erro",
      });
      return;
    }
    if (senha.length < 6) {
      setMensagem({
        texto: "A senha deve ter pelo menos 6 caracteres.",
        tipo: "erro",
      });
      return;
    }
    if (senha !== confirmarSenha) {
      setMensagem({ texto: "As senhas não coincidem.", tipo: "erro" });
      return;
    }

    setCarregando(true);
    setMensagem({ texto: "", tipo: "" });

    // Integração com o Supabase (Sign Up)
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: senha,
      options: {
        data: {
          nome: nome, // Salva o nome nos metadados do usuário (opcional)
        },
      },
    });

    setCarregando(false);

    if (error) {
      setMensagem({ texto: error.message, tipo: "erro" });
    } else {
      setMensagem({
        texto: "Cadastro realizado com sucesso! Você já pode fazer login.",
        tipo: "sucesso",
      });
      // Limpa os campos após sucesso
      setNome("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Criar Conta</Text>

      {mensagem.texto !== "" && (
        <Text
          style={[
            styles.mensagem,
            mensagem.tipo === "erro" ? styles.erro : styles.sucesso,
          ]}
        >
          {mensagem.texto}
        </Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Nome (Opcional)"
        placeholderTextColor="#8fa3b8"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor="#8fa3b8"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#8fa3b8"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar Senha"
        placeholderTextColor="#8fa3b8"
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.btnAcao}
        onPress={handleRegister}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color="#040b13" />
        ) : (
          <Text style={styles.btnAcaoTexto}>Cadastrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnVoltar} onPress={onGoBack}>
        <Text style={styles.btnVoltarTexto}>
          Já tem uma conta? <Text style={styles.destaque}>Faça login</Text>
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
    maxWidth: 400, // Responsividade para PC
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#040b13",
    color: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1e2d3d",
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  btnAcao: {
    backgroundColor: "#f2cc2f",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  btnAcaoTexto: {
    color: "#040b13",
    fontWeight: "bold",
    fontSize: 16,
  },
  btnVoltar: {
    marginTop: 20,
    alignItems: "center",
  },
  btnVoltarTexto: {
    color: "#8fa3b8",
    fontSize: 14,
  },
  destaque: {
    color: "#f2cc2f",
    fontWeight: "bold",
  },
  mensagem: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  erro: {
    color: "#ff4d4d",
  },
  sucesso: {
    color: "#28a745",
  },
});

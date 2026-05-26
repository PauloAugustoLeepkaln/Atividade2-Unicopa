import {
  StyleSheet,
  Text,
  Image,
  ImageBackground,
  FlatList,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";

import DiaCard from "./app/components/DiaCard";
import LoginCard from "./app/components/LoginCard";
import RegisterCard from "./app/components/RegisterCard";
import { agruparPorData } from "./app/utils/funcoes";
import { sincronizarJogosComBanco } from "./app/utils/importarDados";
import { supabase } from "./app/utils/supabase";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [telaAuth, setTelaAuth] = useState("login");
  const [palpites, setPalpites] = useState([]);

  const [jogos, setJogos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [favoritos, setFavoritos] = useState([]);
  const [grupoFiltro, setGrupoFiltro] = useState("Todos");

  const gruposDaCopa = ["Todos", "A", "B", "C", "D", "E", "F", "G", "H"];

  // Monitora o estado de autenticação do Supabase em tempo real
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUsuario(session.user);
      }
      setVerificandoSessao(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUsuario(session.user);
      } else {
        setUsuario(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Busca os jogos e favoritos APENAS se o usuário estiver logado
  useEffect(() => {
    if (usuario) {
      buscarJogosDoBanco();
      buscarFavoritosDoBanco(usuario.id);
      buscarPalpitesDoBanco(usuario.id); // Puxa os palpites ao logar
    } else {
      setFavoritos([]);
      setPalpites([]); // Limpa os palpites ao fazer logout
    }
  }, [usuario]);

  // Busca os jogos e normaliza os dados
  async function buscarJogosDoBanco() {
    try {
      setCarregando(true);
      const { data, error } = await supabase.from("jogos_copa").select("*");

      if (error) throw error;

      const dadosNormalizados = (data || []).map((jogo) => ({
        ...jogo,
        data: jogo.data_brasilia,
        hora_brasilia: jogo.hora_brasilia
          ? jogo.hora_brasilia.substring(0, 5)
          : "",
      }));

      setJogos(dadosNormalizados);
    } catch (error) {
      console.error("Erro ao buscar jogos do banco:", error.message);
    } finally {
      setCarregando(false);
    }
  }

  async function buscarPalpitesDoBanco(userId) {
    try {
      const { data, error } = await supabase
        .from("palpites")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      setPalpites(data || []);
    } catch (error) {
      console.error("Erro ao buscar palpites:", error.message);
    }
  }

  const salvarPalpite = async (jogoId, golsCasa, golsFora) => {
    if (!usuario) return;

    try {
      const { error } = await supabase.from("palpites").upsert(
        {
          user_id: usuario.id,
          id_jogo: jogoId,
          placar_time_casa: golsCasa,
          placar_time_fora: golsFora,
        },
        {
          onConflict: "user_id, id_jogo", // Diz ao banco qual é a regra de duplicidade
        },
      );

      if (error) throw error;

      // Atualiza a lista de palpites localmente para a tela reagir
      buscarPalpitesDoBanco(usuario.id);
    } catch (error) {
      console.error("Erro ao salvar palpite:", error.message);
      alert("Erro ao salvar seu palpite.");
    }
  };

  // Busca os favoritos salvos no Supabase filtrando pelo usuário
  async function buscarFavoritosDoBanco(userId) {
    try {
      const { data, error } = await supabase
        .from("favoritos")
        .select("jogo_id")
        .eq("user_id", userId); // <- FILTRA PELO USUÁRIO LOGADO

      if (error) throw error;

      const idsFavoritos = (data || []).map((f) => f.jogo_id);
      setFavoritos(idsFavoritos);
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error.message);
    }
  }

  // Salva ou remove o favorito no Supabase e na tela
  const toggleFavorito = async (jogoId) => {
    if (!usuario) return; // Segurança extra

    const jaEhFavorito = favoritos.includes(jogoId);

    // 1. Atualiza a tela imediatamente para não parecer lento
    if (jaEhFavorito) {
      setFavoritos((prev) => prev.filter((id) => id !== jogoId));
    } else {
      setFavoritos((prev) => [...prev, jogoId]);
    }

    // 2. Envia para o Supabase
    try {
      if (jaEhFavorito) {
        const { error } = await supabase
          .from("favoritos")
          .delete()
          .match({ user_id: usuario.id, jogo_id: jogoId }); // <- APAGA O MATCH EXATO

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favoritos")
          .insert({ user_id: usuario.id, jogo_id: jogoId }); // <- INSERE COM O USER_ID

        if (error) throw error;
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito no banco:", error.message);
      // Reverte a tela caso dê erro no banco de dados
      if (jaEhFavorito) {
        setFavoritos((prev) => [...prev, jogoId]);
      } else {
        setFavoritos((prev) => prev.filter((id) => id !== jogoId));
      }
      alert("Erro de conexão ao salvar favorito.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (verificandoSessao) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#f2cc2f" />
      </View>
    );
  }

  const jogosFiltrados =
    grupoFiltro === "Todos"
      ? jogos
      : jogos.filter((jogo) => jogo.grupo === grupoFiltro);

  const jogosAgrupados = agruparPorData(jogosFiltrados);

  const jogosTratados = Object.keys(jogosAgrupados).map((data) => {
    return {
      title: data,
      data: jogosAgrupados[data],
    };
  });

  return (
    <ImageBackground
      style={styles.container}
      source={require("./app/assets/bg-overlay.png")}
      resizeMode="cover"
    >
      <Image style={styles.logo} source={require("./app/assets/unicopa.png")} />

      {!usuario ? (
        <View style={styles.loginContainer}>
          {telaAuth === "login" ? (
            <LoginCard
              onLoginSuccess={(user) => setUsuario(user)}
              onNavigateToRegister={() => setTelaAuth("register")}
            />
          ) : (
            <RegisterCard onGoBack={() => setTelaAuth("login")} />
          )}
        </View>
      ) : (
        <>
          <View style={styles.headerAcoes}>
            <Text style={styles.title}>CALENDÁRIO</Text>
            <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
              <Text style={styles.btnLogoutTexto}>Sair 🚪</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filtrosContainer}>
            <View style={styles.botoesWrapper}>
              {gruposDaCopa.map((grupo) => (
                <TouchableOpacity
                  key={grupo}
                  style={[
                    styles.filtroBtn,
                    grupoFiltro === grupo && styles.filtroBtnAtivo,
                  ]}
                  onPress={() => setGrupoFiltro(grupo)}
                >
                  <Text
                    style={[
                      styles.filtroTexto,
                      grupoFiltro === grupo && styles.filtroTextoAtivo,
                    ]}
                  >
                    {grupo === "Todos" ? "Todos" : `Grupo ${grupo}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.btnSupabase}
            onPress={async () => {
              await sincronizarJogosComBanco();
              buscarJogosDoBanco();
            }}
          >
            <Text style={styles.btnSupabaseTexto}>☁️ Enviar para Supabase</Text>
          </TouchableOpacity>

          {carregando ? (
            <ActivityIndicator
              size="large"
              color="#f2cc2f"
              style={{ marginTop: 50 }}
            />
          ) : jogosTratados.length === 0 ? (
            <View style={styles.cardVazio}>
              <Text style={styles.cardVazioTexto}>
                ⚠️ Nenhum jogo carregado
              </Text>
            </View>
          ) : (
            <FlatList
              data={jogosTratados}
              keyExtractor={(item) => item.title}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30, width: "100%" }}
              renderItem={({ item }) => (
                <DiaCard
                  data={item.title}
                  jogos={item.data}
                  favoritos={favoritos}
                  toggleFavorito={toggleFavorito}
                  palpites={palpites}
                  salvarPalpite={salvarPalpite}
                />
              )}
            />
          )}
        </>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#040b13",
    alignItems: "center",
  },
  logo: {
    marginTop: 40,
    width: 200,
    height: 50,
    resizeMode: "contain",
  },
  loginContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
  },
  headerAcoes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "85%",
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
  },
  btnLogout: {
    backgroundColor: "#111c2a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1e2d3d",
  },
  btnLogoutTexto: {
    color: "#ff4d4d",
    fontWeight: "600",
    fontSize: 14,
  },
  filtrosContainer: {
    width: "100%",
    marginTop: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  botoesWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  filtroBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1e2d3d",
    backgroundColor: "transparent",
  },
  filtroBtnAtivo: {
    backgroundColor: "#f2cc2f",
    borderColor: "#f2cc2f",
  },
  filtroTexto: {
    color: "#8fa3b8",
    fontWeight: "600",
  },
  filtroTextoAtivo: {
    color: "#040b13",
    fontWeight: "bold",
  },
  btnSupabase: {
    backgroundColor: "#28a745",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  btnSupabaseTexto: {
    color: "white",
    fontWeight: "bold",
  },
  cardVazio: {
    backgroundColor: "#111c2a",
    borderColor: "#f2cc2f",
    borderWidth: 1,
    borderRadius: 12,
    padding: 25,
    width: "85%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  cardVazioTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

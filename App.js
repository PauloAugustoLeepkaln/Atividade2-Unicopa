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
import LoginCard from "./app/components/LoginCard"; // Importação da tela de Login (RF-013)
import { agruparPorData } from "./app/utils/funcoes";
import { sincronizarJogosComBanco } from "./app/utils/importarDados";
import { supabase } from "./app/utils/supabase";

export default function App() {
  const [usuario, setUsuario] = useState(null); // Estado para guardar o usuário autenticado (RF-013)
  const [verificandoSessao, setVerificandoSessao] = useState(true); // Bloqueia a tela enquanto checa se já estava logado

  const [jogos, setJogos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [favoritos, setFavoritos] = useState([]); // Array para guardar os IDs dos jogos favoritos
  const [grupoFiltro, setGrupoFiltro] = useState("Todos");

  const gruposDaCopa = ["Todos", "A", "B", "C", "D", "E", "F", "G", "H"];

  // Monitora o estado de autenticação do Supabase em tempo real (RF-013)
  useEffect(() => {
    // 1. Checa se já havia uma sessão salva no celular
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUsuario(session.user);
      }
      setVerificandoSessao(false);
    });

    // 2. Escuta se o usuário fez login ou logout
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
      buscarFavoritosDoBanco();
    }
  }, [usuario]);

  // Sua função de teste para inserir usuário
  async function inserirUsuario() {
    try {
      const { data, error } = await supabase.from("usuarios").insert([
        {
          nome: "Taffe",
          email: "teste@teste.com",
          ra: "000000000",
          senha: "123456",
          telefone: "119999999",
          data_nascimento: "2000-01-01",
        },
      ]);

      if (!error) {
        console.log("Usuario inserido com sucesso");
      } else {
        console.log("Erro ao inserir usuario", error);
      }
    } catch (err) {
      console.log("Erro ao rodar inserção:", err.message);
    }
  }

  // 🔥 CORREÇÃO: Executa a sua inserção de teste APENAS UMA VEZ quando o aplicativo abre
  useEffect(() => {
    inserirUsuario();
  }, []);

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

  // RF-012: Busca os favoritos salvos no Supabase ao iniciar o app
  async function buscarFavoritosDoBanco() {
    try {
      const { data, error } = await supabase
        .from("favoritos")
        .select("jogo_id");
      if (error) throw error;

      const idsFavoritos = (data || []).map((f) => f.jogo_id);
      setFavoritos(idsFavoritos);
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error.message);
    }
  }

  // RF-012: Salva ou remove o favorito no Supabase e na tela
  const toggleFavorito = async (jogoId) => {
    const jaEhFavorito = favoritos.includes(jogoId);

    if (jaEhFavorito) {
      setFavoritos(favoritos.filter((id) => id !== jogoId));
    } else {
      setFavoritos([...favoritos, jogoId]);
    }

    try {
      if (jaEhFavorito) {
        const { error } = await supabase
          .from("favoritos")
          .delete()
          .eq("jogo_id", jogoId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favoritos")
          .insert([{ jogo_id: jogoId }]);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito no banco:", error.message);
      if (jaEhFavorito) {
        setFavoritos([...favoritos, jogoId]);
      } else {
        setFavoritos(favoritos.filter((id) => id !== jogoId));
      }
      alert("Erro de conexão ao salvar favorito.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Enquanto estiver checando se o usuário já estava logado antes, mostra o loading na tela limpa
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

      {/* RENDERIZAÇÃO CONDICIONAL (RF-013): Se NÃO houver usuário logado, mostra a tela de login */}
      {!usuario ? (
        <View style={styles.loginContainer}>
          <LoginCard onLoginSuccess={(user) => setUsuario(user)} />
        </View>
      ) : (
        /* Se houver usuário logado, mostra o seu Calendário perfeitamente */
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

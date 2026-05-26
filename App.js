import {
  StyleSheet,
  Text,
  Image,
  ImageBackground,
  FlatList,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
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
  const [telaAtual, setTelaAtual] = useState("calendario");
  const [filtroPalpites, setFiltroPalpites] = useState("Todos");
  const filtrosPalpites = ["Todos", "Pendentes", "Confirmados"];

  // Novos estados para a Revisão de Palpites
  const [modalRevisaoVisivel, setModalRevisaoVisivel] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const gruposDaCopa = ["Todos", "A", "B", "C", "D", "E", "F", "G", "H"];

  // Filtra apenas os jogos que o usuário já palpitou para mostrar no resumo
  const palpitesRealizados = jogos.filter((jogo) =>
    palpites.some((p) => p.id_jogo === jogo.id),
  );

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

  // Busca os dados APENAS se o usuário estiver logado
  useEffect(() => {
    if (usuario) {
      buscarJogosDoBanco();
      buscarFavoritosDoBanco(usuario.id);
      buscarPalpitesDoBanco(usuario.id);
    } else {
      setFavoritos([]);
      setPalpites([]);
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

  // Busca palpites atualizado para usar 'user_id'
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

  // Salva palpite atualizado para usar 'user_id'
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
          onConflict: "user_id, id_jogo",
        },
      );

      if (error) throw error;

      buscarPalpitesDoBanco(usuario.id);
    } catch (error) {
      console.error("Erro ao salvar palpite:", error.message);
      alert("Erro ao salvar seu palpite.");
    }
  };

  // Função para confirmar e enviar definitivamente os palpites
  const confirmarEnvioPalpites = async () => {
    if (palpites.length === 0) {
      Alert.alert("Aviso", "Você ainda não fez nenhum palpite!");
      return;
    }

    setConfirmando(true);
    try {
      const { error } = await supabase
        .from("palpites")
        .update({ situacao: "confirmado" })
        .eq("user_id", usuario.id);

      if (error) throw error;

      Alert.alert("Sucesso! 🎉", "Seus palpites foram confirmados e enviados.");
      setModalRevisaoVisivel(false);

      // Atualiza a lista para aplicar o bloqueio visual nos cards
      buscarPalpitesDoBanco(usuario.id);
    } catch (error) {
      console.error("Erro ao confirmar:", error.message);
      Alert.alert("Erro", "Não foi possível confirmar os palpites.");
    } finally {
      setConfirmando(false);
    }
  };

  // Busca os favoritos
  async function buscarFavoritosDoBanco(userId) {
    try {
      const { data, error } = await supabase
        .from("favoritos")
        .select("jogo_id")
        .eq("user_id", userId);

      if (error) throw error;

      const idsFavoritos = (data || []).map((f) => f.jogo_id);
      setFavoritos(idsFavoritos);
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error.message);
    }
  }

  // Salva ou remove o favorito
  const toggleFavorito = async (jogoId) => {
    if (!usuario) return;

    const jaEhFavorito = favoritos.includes(jogoId);

    if (jaEhFavorito) {
      setFavoritos((prev) => prev.filter((id) => id !== jogoId));
    } else {
      setFavoritos((prev) => [...prev, jogoId]);
    }

    try {
      if (jaEhFavorito) {
        const { error } = await supabase
          .from("favoritos")
          .delete()
          .match({ user_id: usuario.id, jogo_id: jogoId });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favoritos")
          .insert({ user_id: usuario.id, jogo_id: jogoId });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito no banco:", error.message);
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

  const palpitesComJogo = palpites
    .map((palpite) => {
      const jogo = jogos.find((item) => item.id === palpite.id_jogo);
      return jogo ? { ...palpite, jogo } : null;
    })
    .filter(Boolean);

  const palpitesFiltrados = palpitesComJogo.filter((palpite) => {
    if (filtroPalpites === "Confirmados")
      return palpite.situacao === "confirmado";
    if (filtroPalpites === "Pendentes")
      return palpite.situacao !== "confirmado";
    return true;
  });

  const palpitesAgrupados = palpitesFiltrados.reduce((acc, palpite) => {
    const data = palpite.jogo?.data_brasilia || "";
    if (!acc[data]) acc[data] = [];
    acc[data].push(palpite);
    return acc;
  }, {});

  Object.keys(palpitesAgrupados).forEach((data) => {
    palpitesAgrupados[data].sort((a, b) =>
      a.jogo.hora_brasilia.localeCompare(b.jogo.hora_brasilia),
    );
  });

  const palpitesAgrupadosList = Object.keys(palpitesAgrupados).map((data) => ({
    title: data,
    data: palpitesAgrupados[data],
  }));

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
          <View style={styles.containerPrincipal}>
            <View style={styles.headerAcoes}>
              <Text style={styles.title}>
                {telaAtual === "calendario" ? "CALENDÁRIO" : "MEUS PALPITES"}
              </Text>
              <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
                <Text style={styles.btnLogoutTexto}>Sair 🚪</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={[
                  styles.menuButton,
                  telaAtual === "calendario" && styles.menuButtonAtivo,
                ]}
                onPress={() => setTelaAtual("calendario")}
              >
                <Text
                  style={[
                    styles.menuButtonText,
                    telaAtual === "calendario" && styles.menuButtonTextAtivo,
                  ]}
                >
                  Calendário
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.menuButton,
                  telaAtual === "palpites" && styles.menuButtonAtivo,
                ]}
                onPress={() => setTelaAtual("palpites")}
              >
                <Text
                  style={[
                    styles.menuButtonText,
                    telaAtual === "palpites" && styles.menuButtonTextAtivo,
                  ]}
                >
                  Meus Palpites
                </Text>
              </TouchableOpacity>
            </View>

            {telaAtual === "calendario" ? (
              <>
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

                {/* Botão de revisão de palpites */}
                {!carregando && jogosTratados.length > 0 && (
                  <TouchableOpacity
                    style={styles.btnRevisar}
                    onPress={() => setModalRevisaoVisivel(true)}
                  >
                    <Text style={styles.btnRevisarTexto}>
                      📋 Revisar e Enviar Palpites
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.filtrosContainer}>
                <View style={styles.botoesWrapper}>
                  {filtrosPalpites.map((filtro) => (
                    <TouchableOpacity
                      key={filtro}
                      style={[
                        styles.filtroBtn,
                        filtroPalpites === filtro && styles.filtroBtnAtivo,
                      ]}
                      onPress={() => setFiltroPalpites(filtro)}
                    >
                      <Text
                        style={[
                          styles.filtroTexto,
                          filtroPalpites === filtro && styles.filtroTextoAtivo,
                        ]}
                      >
                        {filtro}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Ocultando o botão antigo do Supabase, mas pode descomentar se ainda for usar para carga de dados */}
            {/* <TouchableOpacity
            style={styles.btnSupabase}
            onPress={async () => {
              await sincronizarJogosComBanco();
              buscarJogosDoBanco();
            }}
          >
            <Text style={styles.btnSupabaseTexto}>☁️ Enviar para Supabase</Text>
          </TouchableOpacity> */}

            {telaAtual === "calendario" ? (
              carregando ? (
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
                <View style={{ flex: 1, width: "100%", alignItems: "center" }}>
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
                </View>
              )
            ) : (
              <View style={{ flex: 1, width: "100%", alignItems: "center" }}>
                {carregando ? (
                  <ActivityIndicator
                    size="large"
                    color="#f2cc2f"
                    style={{ marginTop: 50 }}
                  />
                ) : palpitesAgrupadosList.length === 0 ? (
                  <View style={styles.cardVazio}>
                    <Text style={styles.cardVazioTexto}>
                      Você ainda não cadastrou palpites
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={{ width: "100%" }}
                    contentContainerStyle={{
                      alignItems: "center",
                      paddingBottom: 30,
                    }}
                  >
                    {palpitesAgrupadosList.map((grupo) => (
                      <View key={grupo.title} style={styles.palpiteGrupo}>
                        <Text style={styles.palpiteGrupoTitulo}>
                          {formatarData(grupo.title)}
                        </Text>
                        {grupo.data.map((palpite) => {
                          const jogo = palpite.jogo;
                          const dataHoraJogo = new Date(
                            `${jogo.data_brasilia}T${jogo.hora_brasilia}:00`,
                          );
                          const jogoEncerrado = new Date() >= dataHoraJogo;
                          const situacao = jogoEncerrado
                            ? "Encerrado"
                            : palpite.situacao === "confirmado"
                              ? "Confirmado"
                              : "Pendente";

                          return (
                            <View
                              key={palpite.id_jogo}
                              style={styles.palpiteCard}
                            >
                              <View style={styles.palpiteHeader}>
                                <Text style={styles.palpiteTimes}>
                                  {jogo.time_casa} x {jogo.time_fora}
                                </Text>
                                <Text
                                  style={[
                                    styles.palpiteStatus,
                                    jogoEncerrado
                                      ? styles.statusEncerrado
                                      : palpite.situacao === "confirmado"
                                        ? styles.statusConfirmado
                                        : styles.statusPendente,
                                  ]}
                                >
                                  {situacao}
                                </Text>
                              </View>
                              <Text style={styles.palpiteScore}>
                                {palpite.placar_time_casa} x{" "}
                                {palpite.placar_time_fora}
                              </Text>
                              <Text style={styles.palpiteMeta}>
                                {jogo.hora_brasilia} • {jogo.estadio}
                              </Text>
                              <Text style={styles.palpiteMeta}>
                                {jogo.cidade} • {jogo.pais}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Modal de Revisão */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalRevisaoVisivel}
              onRequestClose={() => setModalRevisaoVisivel(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Resumo dos Palpites</Text>

                  <ScrollView style={styles.modalScroll}>
                    {palpitesRealizados.map((jogo) => {
                      const palpite = palpites.find(
                        (p) => p.id_jogo === jogo.id,
                      );
                      return (
                        <View key={jogo.id} style={styles.resumoItem}>
                          <Text style={styles.resumoTimes}>
                            {jogo.time_casa} x {jogo.time_fora}
                          </Text>
                          <Text style={styles.resumoPlacar}>
                            {palpite.placar_time_casa} -{" "}
                            {palpite.placar_time_fora}
                          </Text>
                        </View>
                      );
                    })}
                    {palpitesRealizados.length === 0 && (
                      <Text style={{ color: "white", textAlign: "center" }}>
                        Nenhum palpite feito ainda.
                      </Text>
                    )}
                  </ScrollView>

                  <View style={styles.modalBotoes}>
                    <TouchableOpacity
                      style={styles.btnVoltar}
                      onPress={() => setModalRevisaoVisivel(false)}
                    >
                      <Text style={styles.btnVoltarTexto}>Voltar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnConfirmar}
                      onPress={confirmarEnvioPalpites}
                      disabled={confirmando}
                    >
                      {confirmando ? (
                        <ActivityIndicator color="#040b13" />
                      ) : (
                        <Text style={styles.btnConfirmarTexto}>
                          Confirmar Envio
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
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
    justifyContent: "center",
    width: "100%",
    maxWidth: 800,
    marginTop: 10,
    position: "relative",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  btnLogout: {
    position: "absolute",
    right: 0,
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
  menuContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 10,
  },
  menuButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1e2d3d",
    margin: 5,
    backgroundColor: "transparent",
  },
  menuButtonAtivo: {
    backgroundColor: "#f2cc2f",
    borderColor: "#f2cc2f",
  },
  menuButtonText: {
    color: "#8fa3b8",
    fontWeight: "600",
  },
  menuButtonTextAtivo: {
    color: "#040b13",
  },
  palpiteGrupo: {
    width: "100%",
    maxWidth: 800,
    marginBottom: 20,
  },
  palpiteGrupoTitulo: {
    color: "#f2cc2f",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  palpiteCard: {
    width: "100%",
    backgroundColor: "#0c1b2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e2d3d",
  },
  palpiteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  palpiteTimes: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  palpiteScore: {
    color: "#f2cc2f",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  palpiteMeta: {
    color: "#8fa3b8",
    fontSize: 12,
    marginTop: 2,
  },
  palpiteStatus: {
    fontSize: 12,
    fontWeight: "bold",
  },
  statusConfirmado: {
    color: "#28a745",
  },
  statusPendente: {
    color: "#f2cc2f",
  },
  statusEncerrado: {
    color: "#ff4d4d",
  },
  btnRevisar: {
    backgroundColor: "#f2cc2f",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 15,
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
    width: "100%",
    maxWidth: 800,
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
  btnRevisar: {
    backgroundColor: "#f2cc2f",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 15,
  },
  btnRevisarTexto: {
    color: "#040b13",
    fontWeight: "bold",
    fontSize: 16,
  },
  containerPrincipal: {
    flex: 1,
    width: "100%",
    maxWidth: 800, // <- O SEGREDO DO DESKTOP: Limita a largura numa tela grande
    alignSelf: "center", // <- Mantém tudo centralizado na tela
    paddingHorizontal: 15, // Dá um respiro nas bordas do celular
  },
  containerFiltros: {
    flexDirection: "row",
    flexWrap: "wrap", // <- Se a tela for pequena (celular), joga os botões pra linha de baixo!
    justifyContent: "center",
    gap: 10, // Dá um espaço uniforme entre os botões
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(4, 11, 19, 0.9)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#111c2a",
    borderRadius: 12,
    padding: 20,
    borderColor: "#1e2d3d",
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#f2cc2f",
    marginBottom: 15,
    textAlign: "center",
  },
  modalScroll: {
    marginBottom: 20,
  },
  resumoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d3d",
  },
  resumoTimes: {
    color: "white",
    fontSize: 16,
  },
  resumoPlacar: {
    color: "#f2cc2f",
    fontWeight: "bold",
    fontSize: 18,
  },
  modalBotoes: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  btnVoltar: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#8fa3b8",
    flex: 0.45,
    alignItems: "center",
  },
  btnVoltarTexto: {
    color: "#8fa3b8",
    fontWeight: "bold",
  },
  btnConfirmar: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f2cc2f",
    flex: 0.45,
    alignItems: "center",
  },
  btnConfirmarTexto: {
    color: "#040b13",
    fontWeight: "bold",
  },
});

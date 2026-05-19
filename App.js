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
import { agruparPorData } from "./app/utils/funcoes";
import { sincronizarJogosComBanco } from "./app/utils/importarDados";
import { supabase } from "./app/utils/supabase";

export default function App() {
  const [jogos, setJogos] = useState([]); // Inicia vazio para buscar do banco
  const [carregando, setCarregando] = useState(true); // Estado de carregamento
  const [favoritos, setFavoritos] = useState([]);
  const [grupoFiltro, setGrupoFiltro] = useState("Todos");

  const gruposDaCopa = ["Todos", "A", "B", "C", "D", "E", "F", "G", "H"];

  // Função para buscar os jogos direto do Supabase
  async function buscarJogosDoBanco() {
    try {
      setCarregando(true);
      const { data, error } = await supabase.from("jogos_copa").select("*");

      if (error) throw error;

      setJogos(data || []); // Se for nulo, joga uma lista vazia pra não quebrar
    } catch (error) {
      console.error("Erro ao buscar jogos do banco:", error.message);
    } finally {
      setCarregando(false);
    }
  }

  // Executa a busca assim que o app inicia
  useEffect(() => {
    buscarJogosDoBanco();
  }, []);

  const toggleFavorito = (jogoId) => {
    if (favoritos.includes(jogoId)) {
      setFavoritos(favoritos.filter((id) => id !== jogoId));
    } else {
      setFavoritos([...favoritos, jogoId]);
    }
  };

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
      <Text style={styles.title}>CALENDÁRIO</Text>

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

      {/* Botão de sincronizar mantido caso queira rodar novamente */}
      <TouchableOpacity
        style={styles.btnSupabase}
        onPress={async () => {
          await sincronizarJogosComBanco();
          buscarJogosDoBanco(); // Atualiza a lista na tela após sincronizar
        }}
      >
        <Text style={styles.btnSupabaseTexto}>☁️ Enviar para Supabase</Text>
      </TouchableOpacity>

      {/* Condição 1: Tela carregando dados */}
      {carregando ? (
        <ActivityIndicator
          size="large"
          color="#f2cc2f"
          style={{ marginTop: 50 }}
        />
      ) : /* Condição 2 & CRITÉRIOS DE ACEITE: Se não houver jogos, exibe o card informativo */
      jogosTratados.length === 0 ? (
        <View style={styles.cardVazio}>
          <Text style={styles.cardVazioTexto}>⚠️ Nenhum jogo carregado</Text>
        </View>
      ) : (
        /* Condição 3: Se houver dados, renderiza a lista normalmente */
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
  title: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: "700",
    color: "white",
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
  // Novos estilos para o card de erro do RF-011 combinando com o tema escuro do app
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

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
  const [jogos, setJogos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [favoritos, setFavoritos] = useState([]); // Array para guardar os IDs dos jogos favoritos
  const [grupoFiltro, setGrupoFiltro] = useState("Todos");

  const gruposDaCopa = ["Todos", "A", "B", "C", "D", "E", "F", "G", "H"];

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

      // Transforma a resposta do banco [{jogo_id: 1}, ...] em um array simples [1, 2, ...]
      const idsFavoritos = (data || []).map((f) => f.jogo_id);
      setFavoritos(idsFavoritos);
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error.message);
    }
  }

  // Executa as duas buscas assim que a tela abre
  useEffect(() => {
    buscarJogosDoBanco();
    buscarFavoritosDoBanco();
  }, []);

  // RF-012: Salva ou remove o favorito no Supabase e na tela
  const toggleFavorito = async (jogoId) => {
    const jaEhFavorito = favoritos.includes(jogoId);

    // Atualização visual imediata (para o app parecer rápido)
    if (jaEhFavorito) {
      setFavoritos(favoritos.filter((id) => id !== jogoId));
    } else {
      setFavoritos([...favoritos, jogoId]);
    }

    // Persistência no banco de dados
    try {
      if (jaEhFavorito) {
        // Se já era favorito, remove da tabela
        const { error } = await supabase
          .from("favoritos")
          .delete()
          .eq("jogo_id", jogoId);
        if (error) throw error;
      } else {
        // Se não era, insere na tabela
        const { error } = await supabase
          .from("favoritos")
          .insert([{ jogo_id: jogoId }]);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito no banco:", error.message);
      // Se der erro no banco, desfaz a alteração visual na tela
      if (jaEhFavorito) {
        setFavoritos([...favoritos, jogoId]);
      } else {
        setFavoritos(favoritos.filter((id) => id !== jogoId));
      }
      alert("Erro de conexão ao salvar favorito.");
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
          <Text style={styles.cardVazioTexto}>⚠️ Nenhum jogo carregado</Text>
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

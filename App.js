import {
  StyleSheet,
  Text,
  Image,
  ImageBackground,
  FlatList,
  View,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";

import copaData from "./app/assets/data/copaData.json";
import DiaCard from "./app/components/DiaCard";
import { agruparPorData } from "./app/utils/funcoes";
import { sincronizarJogosComBanco } from "./app/utils/importarDados";

export default function App() {
  const [jogos, setJogos] = useState(copaData.jogos);
  const [favoritos, setFavoritos] = useState([]);

  const [grupoFiltro, setGrupoFiltro] = useState("Todos");
  const gruposDaCopa = ["Todos", "A", "B", "C", "D", "E", "F", "G", "H"];

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

      <TouchableOpacity
        style={styles.btnSupabase}
        onPress={sincronizarJogosComBanco}
      >
        <Text style={styles.btnSupabaseTexto}>☁️ Enviar para Supabase</Text>
      </TouchableOpacity>

      <FlatList
        data={jogosTratados}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <DiaCard
            data={item.title}
            jogos={item.data}
            favoritos={favoritos}
            toggleFavorito={toggleFavorito}
          />
        )}
      />
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
});

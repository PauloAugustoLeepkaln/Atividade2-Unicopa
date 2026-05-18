import {
  StyleSheet,
  Text,
  Image,
  ImageBackground,
  FlatList,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import copaData from "./app/assets/data/copaData.json";
import DiaCard from "./app/components/DiaCard";
import { agruparPorData } from "./app/utils/funcoes";

export default function App() {
  const [jogos, setJogos] = useState(copaData.jogos);
  const [favoritos, setFavoritos] = useState([]);

  // 1. Estado para guardar o filtro atual (começa mostrando "Todos")
  const [grupoFiltro, setGrupoFiltro] = useState("Todos");
  const gruposDaCopa = ["Todos", "A", "B", "C", "D", "E", "F", "G", "H"];

  const toggleFavorito = (jogoId) => {
    if (favoritos.includes(jogoId)) {
      setFavoritos(favoritos.filter((id) => id !== jogoId));
    } else {
      setFavoritos([...favoritos, jogoId]);
    }
  };

  // 2. Lógica de Filtragem (Atualiza a lista exibida antes de agrupar)
  const jogosFiltrados =
    grupoFiltro === "Todos"
      ? jogos
      : jogos.filter((jogo) => jogo.grupo === grupoFiltro);

  // 3. Mantém o agrupamento por data (usando a lista que acabou de ser filtrada)
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

      {/* Barra de Filtros Visual */}
      <View style={styles.filtrosContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
        </ScrollView>
      </View>

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
  // Novos estilos para os botões de filtro
  filtrosContainer: {
    width: "100%",
    paddingLeft: 20,
    marginTop: 15,
    marginBottom: 5,
  },
  filtroBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
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
    color: "#040b13", // Texto escuro para contrastar com o botão amarelo
    fontWeight: "bold",
  },
});

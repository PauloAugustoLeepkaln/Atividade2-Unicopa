import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageBackground,
  FlatList,
} from "react-native";
import GameCard from "./app/components/GameCard";
import copaData from "./app/assets/data/copaData.json";
import { useState } from "react";
import { SectionList } from "react-native";

export default function App() {
  const [jogos, setJogos] = useState(copaData.jogos);
  const [dadosCopa, setDadosCopa] = useState(copaData);
  const agruparPorData = (jogos) => {
    return jogos.reduce((acc, jogo) => {
      const data = jogo.data_brasilia;
      if (!acc[data]) {
        acc[data] = [];
      }
      acc[data].push(jogo);
      return acc;
    }, {});
  };
  const jogosAgrupados = agruparPorData(jogos);
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
    >
      <Image style={styles.logo} source={require("./app/assets/unicopa.png")} />

      <Text style={styles.title}>CALENDÁRIO</Text>
      <SectionList
        sections={jogosTratados}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={() => null}
        renderSectionHeader={({ section }) => (
          <View style={styles.card}>
            <Text style={styles.data}>
              {section.title.split("-").reverse().join("/")}
            </Text>
            {section.data.map((jogo) => (
              <GameCard key={jogo.id} game={jogo} />
            ))}
          </View>
        )}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    width: "100%",
    backgroundColor: "#040b13",
    alignItems: "center",
  },
  logo: {
    marginTop: 20,
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
  card: {
    marginTop: 20,
    backgroundColor: "#0c1b2a",
    width: 320,
    borderRadius: 12,
    padding: 15,
  },
  data: {
    color: "#f2cc2f",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  jogo: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d3d",
    paddingBottom: 15,
  },
  grupo: {
    color: "#8fa3b8",
    fontSize: 12,
    marginBottom: 10,
  },
  linhaPrincipal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bandeira: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  sigla: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  horario: {
    alignItems: "center",
  },
  hora: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  local: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subTitulo: {
    color: "#8fa3b8",
    fontSize: 12,
  },
});

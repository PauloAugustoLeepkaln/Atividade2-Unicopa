import {
  StyleSheet,
  Text,
  Image,
  ImageBackground,
  FlatList,
} from "react-native";
import { useState } from "react";
import copaData from "./app/assets/data/copaData.json";
import DiaCard from "./app/components/DiaCard";
import { agruparPorData } from "./app/utils/funcoes";

export default function App() {
  const [jogos, setJogos] = useState(copaData.jogos);
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
      resizeMode="cover"
    >
      <Image style={styles.logo} source={require("./app/assets/unicopa.png")} />

      <Text style={styles.title}>CALENDÁRIO</Text>

      <FlatList
        data={jogosTratados}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <DiaCard data={item.title} jogos={item.data} />
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
});

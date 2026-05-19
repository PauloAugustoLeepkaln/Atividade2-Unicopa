// app/components/GameCard.jsx
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import TimeCard from "./TimeCard";

export default function GameCard({ game, isFavorito, onToggleFavorito }) {
  const isBrasil = game.sigla_casa === "BRA" || game.sigla_fora === "BRA";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggleFavorito}
      style={[
        styles.jogo,
        isBrasil && styles.jogoBrasil,
        isFavorito && styles.jogoFavorito,
      ]}
    >
      <View style={styles.cabecalhoJogo}>
        <Text style={styles.grupo}>
          GRUPO {game.grupo} {game.confronto}
        </Text>
        <Text style={styles.estrela}>{isFavorito ? "⭐" : "☆"}</Text>
      </View>

      <View style={styles.linhaPrincipal}>
        <TimeCard siglaTime={game.sigla_casa} />

        <View style={styles.horario}>
          {/* Esse cara aqui vai ler o horário certinho de Brasília normalizado pelo App.js! */}
          <Text style={styles.hora}>{game.hora_brasilia}</Text>
          <Text style={styles.subTitulo}>VS</Text>
        </View>

        <TimeCard siglaTime={game.sigla_fora} reverso={true} />
      </View>

      <View style={styles.local}>
        <Text style={styles.subTitulo}>{game.estadio}</Text>
        <Text style={styles.subTitulo}>
          {game.cidade} • {game.pais}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  jogo: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d3d",
    paddingBottom: 15,
    paddingTop: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  jogoBrasil: {
    backgroundColor: "rgba(242, 204, 47, 0.05)",
    borderColor: "#f2cc2f",
    borderWidth: 1,
    borderBottomWidth: 1,
  },
  jogoFavorito: {
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
  },
  cabecalhoJogo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  grupo: {
    color: "#8fa3b8",
    fontSize: 12,
  },
  estrela: {
    fontSize: 16,
    color: "#f2cc2f",
  },
  linhaPrincipal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

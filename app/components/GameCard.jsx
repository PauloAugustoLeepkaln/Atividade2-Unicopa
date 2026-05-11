import { StyleSheet, Text, View } from "react-native";
import TimeCard from "./TimeCard";

export default function GameCard({ game }) {
  // 1. Identificar jogos com sigla "BRA"
  const isBrasil = game.sigla_casa === "BRA" || game.sigla_fora === "BRA";

  return (
    // 2. Aplicar o estilo diferenciado condicionalmente
    <View style={[styles.jogo, isBrasil && styles.jogoBrasil]}>
      <Text style={styles.grupo}>
        GRUPO {game.grupo} {game.confronto}
      </Text>

      <View style={styles.linhaPrincipal}>
        <TimeCard siglaTime={game.sigla_casa} />
        
        <View style={styles.horario}>
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
    </View>
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
  // 3. Estilo que mantém a consistência visual (mesmo amarelo da data)
  jogoBrasil: {
    backgroundColor: "rgba(242, 204, 47, 0.05)", // Fundo amarelado bem transparente
    borderColor: "#f2cc2f", // Borda de destaque na cor amarela
    borderWidth: 1,
    borderBottomWidth: 1, // Sobrescreve a borda padrão
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
import { StyleSheet, Text, View } from "react-native";
import GameCard from "./GameCard";
import { formatarData } from "../utils/funcoes";

export default function DiaCard({
  data,
  jogos,
  favoritos,
  toggleFavorito,
  palpites = [],
  salvarPalpite,
}) {
  const verificarSeEhHoje = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    const dataDoSistema = `${ano}-${mes}-${dia}`;
    return data === dataDoSistema;
  };

  const isHoje = verificarSeEhHoje();

  return (
    <View style={[styles.card, isHoje && styles.cardHoje]}>
      <View style={styles.cabecalho}>
        <Text style={styles.data}>{formatarData(data)}</Text>
        {isHoje && <Text style={styles.badgeHoje}>HOJE</Text>}
      </View>

      {jogos.map((jogo) => {
        // Procura se o usuário já tem um palpite salvo para este jogo específico
        const palpiteDoJogo = palpites.find((p) => p.id_jogo === jogo.id);

        return (
          <GameCard
            key={jogo.id}
            game={jogo}
            isFavorito={favoritos.includes(jogo.id)}
            onToggleFavorito={() => toggleFavorito(jogo.id)}
            palpite={palpiteDoJogo} // <-- Passa o palpite para o cartão
            onSalvarPalpite={salvarPalpite} // <-- Passa a função de salvar
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    backgroundColor: "#0c1b2a",
    width: 320,
    borderRadius: 12,
    padding: 15,
  },
  cardHoje: {
    borderColor: "#f2cc2f",
    borderWidth: 2,
    elevation: 5,
    shadowColor: "#f2cc2f",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  data: {
    color: "#f2cc2f",
    fontSize: 22,
    fontWeight: "bold",
  },
  badgeHoje: {
    backgroundColor: "#f2cc2f",
    color: "#040b13",
    fontWeight: "bold",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
});

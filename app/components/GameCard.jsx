import { StyleSheet, Text, View, TouchableOpacity, TextInput } from "react-native";
import { useState, useEffect } from "react";
import TimeCard from "./TimeCard";

export default function GameCard({ game, isFavorito, onToggleFavorito, palpite, onSalvarPalpite }) {
  const isBrasil = game.sigla_casa === "BRA" || game.sigla_fora === "BRA";
  
  // Estados para os gols, carregando os valores do banco se existirem
  const [golsCasa, setGolsCasa] = useState(palpite?.placar_time_casa?.toString() || "");
  const [golsFora, setGolsFora] = useState(palpite?.placar_time_fora?.toString() || "");
  const [bloqueado, setBloqueado] = useState(false);

  // Sincroniza os gols se o palpite vier do banco de dados com delay
  useEffect(() => {
    if (palpite) {
      setGolsCasa(palpite.placar_time_casa?.toString() || "");
      setGolsFora(palpite.placar_time_fora?.toString() || "");
    }
  }, [palpite]);

  // Lógica de bloqueio de horário (RF-015)
  useEffect(() => {
    if (game.data && game.hora_brasilia) {
      // Monta a data no formato padrão: YYYY-MM-DDTHH:MM:00
      const dataHoraJogo = new Date(`${game.data}T${game.hora_brasilia}:00`);
      const agora = new Date();
      
      // Se a hora atual passou da hora do jogo, bloqueia!
      if (agora >= dataHoraJogo) {
        setBloqueado(true);
      }
    }
  }, [game.data, game.hora_brasilia]);

  const handleSalvar = () => {
    if (golsCasa !== "" && golsFora !== "") {
      onSalvarPalpite(game.id, parseInt(golsCasa), parseInt(golsFora));
    } else {
      alert("Preencha o placar dos dois times antes de salvar!");
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9} // Mudei para 0.9 para o card não piscar tanto quando clicar nos inputs
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
        <TouchableOpacity onPress={onToggleFavorito}>
          <Text style={styles.estrela}>{isFavorito ? "⭐" : "☆"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.linhaPrincipal}>
        <TimeCard siglaTime={game.sigla_casa} />

        {/* Área central com placar e horário */}
        <View style={styles.areaPlacar}>
          <Text style={styles.hora}>{game.hora_brasilia}</Text>
          
          <View style={styles.inputsContainer}>
            <TextInput
              style={[styles.inputPlacar, bloqueado && styles.inputBloqueado]}
              keyboardType="numeric"
              maxLength={2}
              value={golsCasa}
              onChangeText={setGolsCasa}
              editable={!bloqueado}
              placeholder="-"
              placeholderTextColor="#8fa3b8"
            />
            <Text style={styles.x}>X</Text>
            <TextInput
              style={[styles.inputPlacar, bloqueado && styles.inputBloqueado]}
              keyboardType="numeric"
              maxLength={2}
              value={golsFora}
              onChangeText={setGolsFora}
              editable={!bloqueado}
              placeholder="-"
              placeholderTextColor="#8fa3b8"
            />
          </View>

          {/* Se estiver bloqueado, avisa. Se não, mostra o botão salvar */}
          {bloqueado ? (
            <Text style={styles.txtBloqueado}>🔒 Encerrado</Text>
          ) : (
            <TouchableOpacity style={styles.btnSalvar} onPress={handleSalvar}>
              <Text style={styles.btnSalvarTexto}>Salvar</Text>
            </TouchableOpacity>
          )}
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
    fontSize: 18,
    color: "#f2cc2f",
    paddingLeft: 20, // Dá uma área de clique melhor para a estrela
  },
  linhaPrincipal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  areaPlacar: {
    alignItems: "center",
    justifyContent: "center",
    width: 90, // Mantém o centro alinhado
  },
  hora: {
    color: "#8fa3b8",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  inputsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  inputPlacar: {
    backgroundColor: "#111c2a",
    borderWidth: 1,
    borderColor: "#1e2d3d",
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    width: 35,
    height: 40,
    borderRadius: 6,
  },
  inputBloqueado: {
    backgroundColor: "#080e15",
    color: "#4a5d70",
    borderColor: "#0c141d",
  },
  x: {
    color: "#8fa3b8",
    fontSize: 14,
    fontWeight: "bold",
    marginHorizontal: 5,
  },
  btnSalvar: {
    marginTop: 8,
    backgroundColor: "#1e2d3d",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  btnSalvarTexto: {
    color: "#f2cc2f",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  txtBloqueado: {
    marginTop: 8,
    color: "#ff4d4d",
    fontSize: 10,
    fontWeight: "bold",
  },
  local: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subTitulo: {
    color: "#8fa3b8",
    fontSize: 12,
  },
});
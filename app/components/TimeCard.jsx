import { StyleSheet, Text, View, Image } from "react-native";
import { FLAGS } from "../assets/data/ImagemPaises";

export default function TimeCard({ siglaTime, reverso }) {
  function getImag(sigla) {
    return FLAGS[sigla];
  }

  return (
    <View style={[styles.time, reverso && styles.timeReverso]}>
      <Image style={styles.bandeira} source={getImag(siglaTime)} />
      <Text style={styles.sigla}>{siglaTime}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  time: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeReverso: {
    flexDirection: "row-reverse",
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
});

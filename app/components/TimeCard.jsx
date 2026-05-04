import { StyleSheet, Text, View, Image } from "react-native";
import { FLAGS } from "../assets/data/ImagemPaises";

export default function TimeCard({ siglaTime }) {
  function getImag(sigla) {
    return FLAGS[sigla];
  }
  return (
    <View style={styles.time}>
      <Text style={styles.sigla}>{siglaTime}</Text>
      <Image style={styles.bandeira} source={getImag(siglaTime)} />
    </View>
  );
}

const styles = StyleSheet.create({
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
});

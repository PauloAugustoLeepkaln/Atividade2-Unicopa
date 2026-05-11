export const agruparPorData = (jogos) => {
  const agrupados = jogos.reduce((acc, jogo) => {
    const data = jogo.data_brasilia;
    if (!acc[data]) {
      acc[data] = [];
    }
    acc[data].push(jogo);
    return acc;
  }, {});

  for (const data in agrupados) {
    agrupados[data].sort((a, b) => {
      return a.hora_brasilia.localeCompare(b.hora_brasilia);
    });
  }

  return agrupados;
};

export const formatarData = (dataString) => {
  const [ano, mes, dia] = dataString.split("-");
  return `${dia}/${mes}`;
};

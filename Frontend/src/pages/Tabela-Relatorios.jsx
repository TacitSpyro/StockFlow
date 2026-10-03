import TabelaBase from "../components/modeloTable";

const opcoesOrdenacao = [
    { value: "recente", label: "Mais Recente Registrado" },
    { value: "antigo", label: "Mais Antigo Registrado" }
]

const TIPO_LABEL = {
    TODOS: "Todos",
    FORNECEDOR: "Fornecedor",
    PRODUTO: "Produto",
};

function formatarData(valor) {
    if (!valor) return "-";
    const d = new Date(valor);
    return d.toLocaleString("pt-BR");
}

function formatarPeriodo(valor, linha) {
    if (!linha.periodo_inicio && !linha.periodo_fim) return "Sem filtro";
    return `${linha.periodo_inicio ?? "..."} até ${linha.periodo_fim ?? "..."}`;
}

function TabelaRelatorios() {
    return (
        <TabelaBase
            titulo="Últimos Relatórios"
            tipo="relatorio"
            opcoesOrdenacao={opcoesOrdenacao}
            modoInicial="recente"
            edicao={false}
            texto="Gerar Relatório"
            urlDoCoiso="/gerar-relatorio"
            urlVisualizacaoBase="/visualizar-relatorio"
            colunas={[
                { key: "data_geracao", label: "Data e Hora", format: formatarData },
                { key: "tipo", label: "Tipo", format: (v) => TIPO_LABEL[v] ?? v },
                { key: "periodo_inicio", label: "Período", format: (_, linha) => formatarPeriodo(_, linha) },
                { key: "gerado_por", label: "Gerado Por" },
            ]}
            campoOrdenacao="data_geracao"
        />
    )
}

export default TabelaRelatorios;
import TabelaBase from "../components/modeloTable";

const opcoesOrdenacao = [
    { value: "recente", label: "Mais Recente Registrado" },
    { value: "antigo", label: "Mais Antigo Registrado" }
]

function TabelaRelatorios() {
    return (
        <TabelaBase
            titulo="Ultimos Relatórios"
            opcoesOrdenacao={opcoesOrdenacao}
            modoInicial="recente"
            colunas={[
                { key: "timestamp", label: "Data e Hora" },
                { key: "linha", label: "Linha de Estoque" },
            ]}
        />
    )
}

export default TabelaRelatorios;
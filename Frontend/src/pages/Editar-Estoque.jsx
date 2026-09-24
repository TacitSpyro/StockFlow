import TabelaBase from "../components/modeloTable";

const opcoesOrdenacao = [
    { value: "decrescente", label: "Ordem Decrescente" },
    { value: "crescente", label: "Ordem Crescente" },
    { value: "recente", label: "Mais Recente" },
    { value: "antigo", label: "Mais Antigo" }
]

function TabelaProdutos() {
    return (
        <TabelaBase
            titulo="Lotes Registrados"
            tipo="produto"
            opcoesOrdenacao={opcoesOrdenacao}
            modoInicial="recente"
            edicao={true}
            texto="Adicionar Lote"
            urlDoCoiso={"/cadastrar/lote"}
            colunas={[
                { key: "nome", label: "Produto" },
                { key: "lote", label: "Lote" },
                { key: "estoque_atual", label: "Estoque Atual" },
                { key: "estoque_capacidade", label: "Capacidade Total" },
                { key: "situacao", label: "Situação" },
                { key: "data_fabricacao", label: "Data Fabricação" },
                { key: "fornecedor_nome", label: "Fornecido por" },
            ]}
            campoOrdenacao="data_fabricacao"
        />
    )
}

export default TabelaProdutos;
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
            opcoesOrdenacao={opcoesOrdenacao}
            modoInicial="recente"
            edicao= {true}
            urlDoCoiso={"/cadastrar/lote"}
            texto="Adicionar Lote"
            colunas={[
                { key: "nome", label: "Produto" },
                { key: "preco", label: "Preço" },
                { key: "estoque", label: "Estoque" },
            ]}
        />
    )
}

export default TabelaProdutos;
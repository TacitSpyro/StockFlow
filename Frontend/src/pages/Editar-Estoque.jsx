import TabelaBase from "../components/modeloTable";

const opcoesOrdenacao = [
    { value: "recente", label: "Recente" },
    { value: "antigo", label: "Antigo" },
    { value: "alfabetico", label: "Alfabético" },
    { value: "estado", label: "Estado" },
];

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
            urlEdicaoBase="/adicionar-lote"
            colunas={[
                { key: "nome", label: "Produto"},
                { key: "lote", label: "Lote" },
                { key: "estoque_atual", label: "Estoque Atual" },
                { key: "estoque_capacidade", label: "Capacidade Total" },
                { key: "situacao", label: "Situação" },
                { key: "data_fabricacao", label: "Data Fabricação" },
                { key: "fornecedor_nome", label: "Fornecido por" },
            ]}
            campoOrdenacao="data_cadastro"
            campoNome="nome"
            campoSituacao="situacao"
        />
    )
}

export default TabelaProdutos;
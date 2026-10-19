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
            camposBusca={[
                { value: "todos", label: "Todos os campos" },
                { value: "nome", label: "Produto" },
                { value: "lote", label: "Lote" },
                { value: "fornecedor", label: "Fornecedor" },
                { value: "localizacao", label: "Localização" },
                { value: "data", label: "Data de fabricação", tipo: "data" },
                {
                    value: "situacao", label: "Situação", tipo: "opcoes",
                    opcoes: [
                        { value: "ATIVO", label: "Ativo" },
                        { value: "INSPECAO", label: "Em inspeção" },
                        { value: "BLOQUEIO", label: "Bloqueado" },
                        { value: "ENCERRADO", label: "Encerrado" },
                    ],
                },
            ]}
            campoOrdenacao="data_cadastro"
            campoNome="nome"
            campoSituacao="situacao"
        />
    )
}

export default TabelaProdutos;
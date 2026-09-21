import TabelaBase from "../components/modeloTable";

const opcoesOrdenacao = [
    { value: "decrescente", label: "Ordem Decrescente" },
    { value: "crescente", label: "Ordem Crescente" },
    { value: "recente", label: "Mais Recente" },
    { value: "antigo", label: "Mais Antigo" }
]

function TabelaFornecedores() {
    return (
        <TabelaBase
            titulo="Fornecedores Cadastrados"
            tipo="fornecedor"
            opcoesOrdenacao={opcoesOrdenacao}
            modoInicial="recente"
            edicao={true}
            texto="Adicionar Fornecedor"
            urlDoCoiso={"/cadastrar/fornecedor"}
            colunas={[
                { key: "nome_fantasia_fn", label: "Nome Fantasia" },
                { key: "cnpj_fn", label: "CNPJ" },
                { key: "cidade", label: "Cidade" },
                { key: "telefone_fn", label: "Telefone" },
            ]}
            campoOrdenacao="data_cadastro"
        />
    )
}

export default TabelaFornecedores;
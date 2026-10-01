import TabelaBase from "../components/modeloTable";

const opcoesOrdenacao = [
    { value: "recente", label: "Mais Recente" },
    { value: "antigo", label: "Mais Antigo" },
    { value: "alfabetico", label: "Alfabético" },
    { value: "estado", label: "Estado" },
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
            urlEdicaoBase="/adicionar-fornecedor"
            colunas={[
                { key: "nome_fantasia_fn", label: "Nome Fantasia" },
                { key: "cnpj_fn", label: "CNPJ" },
                { key: "uf", label: "Estado" },
                { key: "nome_responsavel", label: "Responsável" },
                { key: "email_fn", label: "Email" },
                { key: "telefone_fn", label: "Telefone" },
                {
                    key: "ativo",
                    label: "Situação",
                    format: (valor) => (valor ? "Ativo" : "Inativo"),
                },
            ]}
            campoOrdenacao="data_cadastro"
            campoNome="nome"
            campoSituacao="situacao"
        />
    )
}

export default TabelaFornecedores;
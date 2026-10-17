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
            edicao={false}
            texto="Adicionar Fornecedor"
            urlVisualizacaoBase="/visualizar-fornecedor"
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
            camposBusca={[
                { value: "todos", label: "Todos os campos" },
                { value: "nome", label: "Nome" },
                { value: "cnpj", label: "CNPJ" },
                { value: "cidade", label: "Cidade / UF" },
                { value: "responsavel", label: "Responsável" },
                { value: "email", label: "E-mail" },
                { value: "data", label: "Data de cadastro", tipo: "data" },
                {
                    value: "ativo", label: "Situação", tipo: "opcoes",
                    opcoes: [
                        { value: "1", label: "Ativo" },
                        { value: "0", label: "Inativo" },
                    ],
                },
            ]}
        />
    )
}

export default TabelaFornecedores;
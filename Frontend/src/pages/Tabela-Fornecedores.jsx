import TabelaBase from "../components/modeloTable";

const opcoesOrdenacao = [
    { value: "alfabeto", label: "Ordem Alfabética" },
    { value: "recente", label: "Mais Recente Registrado" },
    { value: "antigo", label: "Mais Antigo Registrado" }
]

function TabelaFornecedores() {
    return (
        <TabelaBase
            titulo="Fornecedores Registrados"
            opcoesOrdenacao={opcoesOrdenacao}
            modoInicial="alfabeto"
            colunas={[
                { key: "nome", label: "Nome" },
                { key: "cnpj", label: "CNPJ" },
                { key: "telefone", label: "Telefone" },
            ]}
        />
    )
}

export default TabelaFornecedores;
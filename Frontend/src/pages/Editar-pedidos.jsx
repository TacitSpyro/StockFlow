import TabelaBase from "../components/modeloTable";

function EditarPedidos (){

    const dataSimples = (v) => (v ? v.split("-").reverse().join("/") : "—");

    const COLUNAS_PEDIDO = [
        { key: "numero", label: "Nº" },
        { key: "fornecedor_nome", label: "Fornecedor" },
        { key: "data_pedido", label: "Aberto em",
        format: (v) => new Date(v).toLocaleDateString("pt-BR") },  // aqui é datetime, então pode
        { key: "data_entrega_prevista", label: "Entrega prevista",
        format: (v) => dataSimples(v) },
        { key: "data_recebimento", label: "Recebido em",
        format: (v) => dataSimples(v) },
        { key: "status_label", label: "Status",
        format: (v, l) => (l.atrasado ? `${v} • Atrasado` : v) },
        { key: "valor", label: "Valor",
        format: (v, l) =>
            `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` +
            (l.valor_definitivo ? "" : " (previsto)") },
        { key: "teve_avaria", label: "Avaria",
        format: (v) => (v === null ? "—" : v ? "Sim" : "Não") },
    ];

    const CAMPOS_BUSCA_PEDIDO = [
        { value: "todos", label: "Todos" },
        { value: "numero", label: "Número" },
        { value: "fornecedor", label: "Fornecedor" },
        { value: "data", label: "Data", tipo: "data" },
        { value: "status", label: "Status", tipo: "opcoes", opcoes: [
            { value: "ABERTO", label: "Aberto" },
            { value: "RECEBIDO", label: "Recebido" },
            { value: "CANCELADO", label: "Cancelado" },
        ]},
    ];

    const ORDENACAO_PEDIDO = [
        { value: "recente", label: "Mais recentes" },
        { value: "antigo", label: "Mais antigos" },
        { value: "entrega", label: "Entrega prevista" },
        { value: "alfabetico", label: "Fornecedor (A-Z)" },
        { value: "estado", label: "Abertos primeiro" },
    ];

    return(
        <TabelaBase
            titulo="Pedidos"
            tipo="pedido"
            opcoesOrdenacao={ORDENACAO_PEDIDO}
            modoInicial="recente"
            colunas={COLUNAS_PEDIDO}
            camposBusca={CAMPOS_BUSCA_PEDIDO}
            edicao={true}
            texto="Novo pedido"
            urlDoCoiso="/adicionar-pedido"
            urlVisualizacaoBase="/visualizar-pedido"
            urlEdicaoBase="/adicionar-pedido"
        />
    )
}

export default EditarPedidos
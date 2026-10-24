import { Fragment, useState, useEffect } from "react";
import styles from "../styles/Adicionar-fornecedor.module.css"; // mesmo CSS das outras telas
import { useNavigate, useParams } from "react-router-dom";
import { useEmpresa } from "../context/EmpresaContext";
import retornar from "../assets/Retornar.png";

const API = "http://localhost:8000/api";
const ROTA_TABELA = "/tabela-pedidos"; // ajuste para a rota da sua tabela de pedidos

const CATEGORIAS_AVARIA = [
    { value: "AMASSADO", label: "Embalagem amassada/danificada" },
    { value: "VENCIDO", label: "Vencido / validade curta" },
    { value: "FORA_ESPECIFICACAO", label: "Fora de especificação" },
    { value: "QUANTIDADE_ERRADA", label: "Quantidade errada" },
    { value: "OUTRO", label: "Outro" },
];

// ---------- helpers ----------
const paraNumero = (v) => Number(String(v ?? "").replace(",", "."));

const moeda = (v) =>
    Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataSimples = (v) => (v ? v.split("-").reverse().join("/") : "—");

function hojeISO() {
    const agora = new Date();
    return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
}

// data (sem hora) em que o pedido foi aberto, no fuso do navegador
function dataLocalISO(isoDatetime) {
    const d = new Date(isoDatetime);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// b - a, em dias, para datas YYYY-MM-DD
function diasEntre(a, b) {
    const [ya, ma, da] = a.split("-").map(Number);
    const [yb, mb, db] = b.split("-").map(Number);
    return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}

const inteiroNaoNegativo = (v) => {
    const n = Number(v);
    return v !== "" && Number.isInteger(n) && n >= 0;
};

const decimalNaoNegativo = (v) => {
    const n = paraNumero(v);
    return String(v ?? "").trim() !== "" && Number.isFinite(n) && n >= 0;
};

const estiloTabela = { width: "100%", borderCollapse: "collapse", marginTop: "1%" };
const estiloCelula = { padding: "6px 8px", textAlign: "left", borderBottom: "1px solid #ddd" };
const estiloInputTabela = { width: "90px" };

function FecharPedido() {

    const { idAdmin } = useEmpresa();
    const navigate = useNavigate();
    const { id } = useParams();

    const [pedido, setPedido] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    const [dataRecebimento, setDataRecebimento] = useState(hojeISO());
    const [valorFrete, setValorFrete] = useState("0");
    const [valorImpostos, setValorImpostos] = useState("0");
    const [observacoes, setObservacoes] = useState("");
    const [itens, setItens] = useState([]);

    // ---------- carregamento ----------
    useEffect(() => {
        fetch(`${API}/pedido/${id}/`)
            .then((res) => {
                if (!res.ok) throw new Error("Pedido não encontrado");
                return res.json();
            })
            .then((data) => {
                setPedido(data);
                // pré-preenche com o que foi pedido: o usuário só corrige o que mudou
                setItens(
                    (data.itens || []).map((i) => ({
                        id: i.id,
                        nome: i.produto,
                        quantidade_pedida: i.quantidade_pedida,
                        preco_unitario_previsto: i.preco_unitario_previsto,
                        quantidade_recebida: String(i.quantidade_pedida),
                        quantidade_avariada: "0",
                        categoria_avaria: "",
                        descricao_avaria: "",
                        preco_unitario_final: String(i.preco_unitario_previsto),
                    }))
                );
            })
            .catch((err) => {
                console.error(err);
                alert("Erro ao carregar dados do pedido");
            })
            .finally(() => setCarregando(false));
    }, [id]);

    function atualizarItem(idItem, campo, valor) {
        setItens((prev) =>
            prev.map((i) => {
                if (i.id !== idItem) return i;
                const novo = { ...i, [campo]: valor };
                // sem avaria, categoria e descrição não fazem sentido
                if (campo === "quantidade_avariada" && !(Number(valor) > 0)) {
                    novo.categoria_avaria = "";
                    novo.descricao_avaria = "";
                }
                return novo;
            })
        );
    }

    // ---------- cálculos de exibição (o backend recalcula tudo) ----------
    const subtotalItem = (i) => {
        const n = Number(i.quantidade_recebida) * paraNumero(i.preco_unitario_final);
        return Number.isFinite(n) ? n : 0;
    };

    const totalMercadoria = itens.reduce((soma, i) => soma + subtotalItem(i), 0);
    const frete = decimalNaoNegativo(valorFrete) ? paraNumero(valorFrete) : 0;
    const impostos = decimalNaoNegativo(valorImpostos) ? paraNumero(valorImpostos) : 0;
    const totalFinal = totalMercadoria + frete + impostos;

    const atrasoDias =
        pedido && dataRecebimento ? diasEntre(pedido.data_entrega_prevista, dataRecebimento) : null;

    // ---------- envio ----------
    function validar() {
        if (!dataRecebimento) return "Informe a data de recebimento";
        if (dataRecebimento > hojeISO()) return "A data de recebimento não pode ser futura";
        if (dataRecebimento < dataLocalISO(pedido.data_pedido)) {
            return "O recebimento não pode ser anterior à abertura do pedido";
        }
        if (!decimalNaoNegativo(valorFrete)) return "Valor do frete inválido";
        if (!decimalNaoNegativo(valorImpostos)) return "Valor dos impostos inválido";

        for (const it of itens) {
            if (!inteiroNaoNegativo(it.quantidade_recebida)) return `Quantidade recebida inválida em "${it.nome}"`;
            if (!inteiroNaoNegativo(it.quantidade_avariada)) return `Quantidade avariada inválida em "${it.nome}"`;
            if (Number(it.quantidade_avariada) > Number(it.quantidade_recebida)) {
                return `Em "${it.nome}", a quantidade avariada é maior que a recebida`;
            }
            if (Number(it.quantidade_avariada) > 0 && !it.categoria_avaria) {
                return `Informe a categoria da avaria em "${it.nome}"`;
            }
            if (!decimalNaoNegativo(it.preco_unitario_final)) return `Preço final inválido em "${it.nome}"`;
        }
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (salvando) return;

        const erro = validar();
        if (erro) {
            alert(erro);
            return;
        }

        if (!window.confirm("Depois de fechado, o pedido não poderá mais ser alterado. Confirmar o fechamento?")) {
            return;
        }

        const corpo = {
            id_admin: idAdmin,
            data_recebimento: dataRecebimento,
            valor_frete: String(paraNumero(valorFrete)),
            valor_impostos: String(paraNumero(valorImpostos)),
            observacoes,
            itens: itens.map((i) => ({
                id: i.id,
                quantidade_recebida: Number(i.quantidade_recebida),
                quantidade_avariada: Number(i.quantidade_avariada),
                categoria_avaria: i.categoria_avaria,
                descricao_avaria: i.descricao_avaria,
                preco_unitario_final: String(paraNumero(i.preco_unitario_final)),
            })),
        };

        setSalvando(true);
        try {
            const response = await fetch(`${API}/pedido/${id}/fechar/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(corpo),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.erro || "Erro ao fechar pedido");
                return;
            }

            alert("Pedido fechado com sucesso!");
            navigate(ROTA_TABELA);

        } catch (error) {
            console.error(error);
            alert("Erro ao conectar com o servidor");
        } finally {
            setSalvando(false);
        }
    }

    // ---------- renderização ----------
    if (carregando) {
        return <p>Carregando dados do pedido...</p>;
    }

    if (!pedido) {
        return <p>Pedido não encontrado.</p>;
    }

    const topbar = (
        <div className={styles.topbar}>
            <img src={retornar} alt="retornar" className="navbar-img" />
            <a href={ROTA_TABELA}>Retornar</a>
        </div>
    );

    // só pedidos abertos podem ser fechados
    if (!pedido.editavel) {
        return (
            <>
                {topbar}
                <main className={styles.main}>
                    <div className={styles.emcima}>
                        <label>Fechar Pedido {pedido.numero}</label>
                        <div style={{ fontSize: "120%" }}>{pedido.status_label}</div>
                    </div>
                    <p>Este pedido não está aberto, então não pode ser fechado.</p>
                    <div style={{ display: "flex" }}>
                        <button className={styles.retornar} type="button" onClick={() => navigate(ROTA_TABELA)}>
                            Voltar
                        </button>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            {topbar}

            <main className={styles.main}>

                <form onSubmit={handleSubmit}>
                    <div className={styles.emcima}>
                        <label>Fechar Pedido {pedido.numero}</label>
                        <div style={{ fontSize: "120%" }}>{pedido.fornecedor_nome}</div>
                    </div>

                    <div className={styles.secao1}>
                        <label>Recebimento</label>

                        <div className={styles.coluna1}>
                            <div className={styles.concatenar} style={{ marginRight: "8%" }}>
                                <label>Entrega prevista</label>
                                <input type="text" value={dataSimples(pedido.data_entrega_prevista)} disabled />
                            </div>

                            <div className={styles.concatenar} style={{ marginRight: "8%" }}>
                                <label>Recebido em</label>
                                <input
                                    type="date"
                                    value={dataRecebimento}
                                    min={dataLocalISO(pedido.data_pedido)}
                                    max={hojeISO()}
                                    onChange={(e) => setDataRecebimento(e.target.value)}
                                />
                                {atrasoDias !== null && (
                                    <small>
                                        {atrasoDias > 0
                                            ? `Atraso de ${atrasoDias} dia(s)`
                                            : atrasoDias < 0
                                                ? `Adiantado ${Math.abs(atrasoDias)} dia(s)`
                                                : "Dentro do prazo"}
                                    </small>
                                )}
                            </div>

                            <div className={styles.concatenar} style={{ marginRight: "8%" }}>
                                <label>Frete pago (R$)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={valorFrete}
                                    onChange={(e) => setValorFrete(e.target.value)}
                                />
                            </div>

                            <div className={styles.concatenar}>
                                <label>Impostos (R$)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={valorImpostos}
                                    onChange={(e) => setValorImpostos(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.secao2}>
                            <div className={styles.concatenar}>
                                <label>Observações do recebimento (opcional)</label>
                                <input
                                    type="text"
                                    maxLength={300}
                                    placeholder="Observações"
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    style={{ width: "100%" }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.secaoProdutos}>
                        <label>Produtos recebidos</label>

                        <div style={{ overflowX: "auto" }}>
                            <table style={estiloTabela}>
                                <thead>
                                    <tr>
                                        <th style={estiloCelula}>Produto</th>
                                        <th style={estiloCelula}>Qtd. pedida</th>
                                        <th style={estiloCelula}>Qtd. recebida</th>
                                        <th style={estiloCelula}>Avariada</th>
                                        <th style={estiloCelula}>Preço unitário previsto</th>
                                        <th style={estiloCelula}>Preço unitário final</th>
                                        <th style={estiloCelula}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itens.map((item) => {
                                        const temAvaria = Number(item.quantidade_avariada) > 0;
                                        return (
                                            <Fragment key={item.id}>
                                                <tr>
                                                    <td style={estiloCelula}>{item.nome}</td>
                                                    <td style={estiloCelula}>{item.quantidade_pedida}</td>
                                                    <td style={estiloCelula}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={item.quantidade_recebida}
                                                            onChange={(e) => atualizarItem(item.id, "quantidade_recebida", e.target.value)}
                                                            style={estiloInputTabela}
                                                        />
                                                    </td>
                                                    <td style={estiloCelula}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={item.quantidade_avariada}
                                                            onChange={(e) => atualizarItem(item.id, "quantidade_avariada", e.target.value)}
                                                            style={estiloInputTabela}
                                                        />
                                                    </td>
                                                    <td style={estiloCelula}>{moeda(item.preco_unitario_previsto)}</td>
                                                    <td style={estiloCelula}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.preco_unitario_final}
                                                            onChange={(e) => atualizarItem(item.id, "preco_unitario_final", e.target.value)}
                                                            style={estiloInputTabela}
                                                        />
                                                    </td>
                                                    <td style={estiloCelula}>{moeda(subtotalItem(item))}</td>
                                                </tr>

                                                {temAvaria && (
                                                    <tr>
                                                        <td style={estiloCelula} colSpan={7}>
                                                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                                                <select
                                                                    value={item.categoria_avaria}
                                                                    onChange={(e) => atualizarItem(item.id, "categoria_avaria", e.target.value)}
                                                                >
                                                                    <option value="">Categoria da avaria...</option>
                                                                    {CATEGORIAS_AVARIA.map((c) => (
                                                                        <option key={c.value} value={c.value}>{c.label}</option>
                                                                    ))}
                                                                </select>
                                                                <input
                                                                    type="text"
                                                                    maxLength={300}
                                                                    placeholder="Descreva a avaria (opcional)"
                                                                    value={item.descricao_avaria}
                                                                    onChange={(e) => atualizarItem(item.id, "descricao_avaria", e.target.value)}
                                                                    style={{ flex: 1, minWidth: "220px" }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <p>
                            Mercadoria: <strong>{moeda(totalMercadoria)}</strong>
                            {" + "}frete {moeda(frete)}
                            {" + "}impostos {moeda(impostos)}
                            {" = "}<strong>{moeda(totalFinal)}</strong>
                        </p>
                        <small>
                            Previsto na abertura (sem frete e impostos): {moeda(pedido.valor_previsto)}
                        </small>
                    </div>

                    <div style={{ display: "flex" }}>
                        <button className={styles.retornar} type="button" onClick={() => navigate(ROTA_TABELA)}>
                            Cancelar
                        </button>
                        <button className={styles.cadastrar} type="submit" disabled={salvando}>
                            {salvando ? "Fechando..." : "Fechar Pedido"}
                        </button>
                    </div>
                </form>
            </main>
        </>
    );
}

export default FecharPedido;
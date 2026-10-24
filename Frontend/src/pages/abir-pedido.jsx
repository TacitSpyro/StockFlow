import { useState, useEffect } from "react";
import styles from "../styles/Adicionar-fornecedor.module.css"; // mesmo CSS da tela de fornecedor
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEmpresa } from "../context/EmpresaContext";
import retornar from "../assets/Retornar.png";

const API = "http://localhost:8000/api";
const ROTA_TABELA = "/tabela-pedidos"; // ajuste para a rota da sua tabela de pedidos

const FRETES = [
    { value: "CIF", label: "CIF (fornecedor paga)" },
    { value: "FOB", label: "FOB (comprador paga)" },
];

const CATEGORIAS_AVARIA = {
    AMASSADO: "Embalagem amassada/danificada",
    VENCIDO: "Vencido / validade curta",
    FORA_ESPECIFICACAO: "Fora de especificação",
    QUANTIDADE_ERRADA: "Quantidade errada",
    OUTRO: "Outro",
};

const FORM_VAZIO = {
    id_fornecedor: "",
    data_entrega_prevista: "",
    prazo_pagamento_dias: "0",
    tipo_frete: "CIF",
    observacoes: "",
};

// ---------- helpers ----------
const paraNumero = (v) => Number(String(v ?? "").replace(",", "."));

const moeda = (v) =>
    Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// campos "só data" (YYYY-MM-DD): não use new Date(), ele interpreta como UTC
// e no Brasil mostraria o dia anterior
const dataSimples = (v) => (v ? v.split("-").reverse().join("/") : "—");

function hojeISO() {
    const agora = new Date();
    return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
}

const subtotal = (item) => {
    const n = Number(item.quantidade_pedida) * paraNumero(item.preco_unitario_previsto);
    return Number.isFinite(n) ? n : 0;
};

const estiloTabela = { width: "100%", borderCollapse: "collapse", marginTop: "1%" };
const estiloCelula = { padding: "6px 8px", textAlign: "left", borderBottom: "1px solid #ddd" };
const estiloInputTabela = { width: "90px" };

function CadastrarPedido() {

    const { idEmpresa, idAdmin } = useEmpresa();
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    // /adicionar-pedido        -> abrir um pedido novo
    // /adicionar-pedido/:id    -> editar
    // /visualizar-pedido/:id   -> somente leitura
    const modoEdicao = Boolean(id) && location.pathname.startsWith("/adicionar-pedido");
    const somenteLeitura = Boolean(id) && location.pathname.startsWith("/visualizar-pedido");
    const precisaCarregarDados = modoEdicao || somenteLeitura;

    const [form, setForm] = useState(FORM_VAZIO);
    const [pedido, setPedido] = useState(null);            // detalhe vindo do backend (edição/visualização)
    const [itens, setItens] = useState([]);

    const [fornecedores, setFornecedores] = useState([]);  // só usado na criação
    const [produtosDoFornecedor, setProdutosDoFornecedor] = useState([]);
    const [situacaoFornecedor, setSituacaoFornecedor] = useState("");

    const [carregando, setCarregando] = useState(precisaCarregarDados);
    const [salvando, setSalvando] = useState(false);

    // Pedido que não está mais aberto não pode ser editado, mesmo na rota de edição
    const cabecalhoBloqueado = somenteLeitura || (modoEdicao && pedido !== null && !pedido.editavel);
    // Fornecedor e itens só podem ser definidos na abertura
    const itensTravados = precisaCarregarDados;
    const recebido = pedido?.status === "RECEBIDO";

    function atualizarCampo(campo, valor) {
        if (cabecalhoBloqueado) return;
        setForm((prev) => ({ ...prev, [campo]: valor }));
    }

    // ---------- carregamentos ----------

    // Lista de fornecedores ativos (só na criação)
    useEffect(() => {
        if (!idEmpresa || precisaCarregarDados) return;

        fetch(`${API}/empresa/${idEmpresa}/fornecedores/?pagina=1&tamanho=200&ordenar=alfabetico`)
            .then((res) => res.json())
            .then((data) => setFornecedores((data.resultados || []).filter((f) => f.ativo)))
            .catch((err) => console.error(err));
    }, [idEmpresa, precisaCarregarDados]);

    // Dados do pedido (edição e visualização)
    useEffect(() => {
        if (!precisaCarregarDados) return;

        fetch(`${API}/pedido/${id}/`)
            .then((res) => {
                if (!res.ok) throw new Error("Pedido não encontrado");
                return res.json();
            })
            .then((data) => {
                setPedido(data);
                setForm({
                    id_fornecedor: "",
                    data_entrega_prevista: data.data_entrega_prevista || "",
                    prazo_pagamento_dias: String(data.prazo_pagamento_dias ?? 0),
                    tipo_frete: data.tipo_frete || "CIF",
                    observacoes: data.observacoes || "",
                });
                setItens(
                    (data.itens || []).map((i) => ({
                        key: i.id,
                        id_catalogo: null,
                        nome: i.produto,
                        quantidade_pedida: i.quantidade_pedida,
                        preco_unitario_previsto: i.preco_unitario_previsto,
                        quantidade_recebida: i.quantidade_recebida,
                        quantidade_avariada: i.quantidade_avariada,
                        categoria_avaria: i.categoria_avaria,
                        descricao_avaria: i.descricao_avaria,
                        preco_unitario_final: i.preco_unitario_final,
                    }))
                );
            })
            .catch((err) => {
                console.error(err);
                alert("Erro ao carregar dados do pedido");
            })
            .finally(() => setCarregando(false));
    }, [id, precisaCarregarDados]);

    // Produtos do fornecedor escolhido (só na criação)
    useEffect(() => {
        if (precisaCarregarDados || !form.id_fornecedor) {
            setProdutosDoFornecedor([]);
            setSituacaoFornecedor("");
            return;
        }

        let cancelado = false;
        fetch(`${API}/fornecedor/${form.id_fornecedor}/`)
            .then((res) => res.json())
            .then((data) => {
                if (cancelado) return;
                setProdutosDoFornecedor(data.produtos_info || []);
                setSituacaoFornecedor(data.situacao_cadastral || "");
            })
            .catch((err) => console.error(err));

        return () => { cancelado = true; };
    }, [form.id_fornecedor, precisaCarregarDados]);

    // ---------- itens (criação) ----------

    function trocarFornecedor(novoId) {
        if (itens.length > 0 && !window.confirm("Trocar o fornecedor remove os produtos já adicionados. Continuar?")) {
            return;
        }
        setItens([]);
        atualizarCampo("id_fornecedor", novoId);
    }

    function adicionarItem(idCatalogo) {
        if (itensTravados || !idCatalogo) return;
        const produto = produtosDoFornecedor.find((p) => p.id === idCatalogo);
        if (!produto || itens.some((i) => i.id_catalogo === idCatalogo)) return;

        setItens((prev) => [
            ...prev,
            {
                key: idCatalogo,
                id_catalogo: idCatalogo,
                nome: produto.nome,
                quantidade_pedida: "1",
                preco_unitario_previsto: "",
            },
        ]);
    }

    function atualizarItem(key, campo, valor) {
        if (itensTravados) return;
        setItens((prev) => prev.map((i) => (i.key === key ? { ...i, [campo]: valor } : i)));
    }

    function removerItem(key) {
        if (itensTravados) return;
        setItens((prev) => prev.filter((i) => i.key !== key));
    }

    const produtosDisponiveis = produtosDoFornecedor.filter(
        (p) => !itens.some((i) => i.id_catalogo === p.id)
    );

    const totalPrevisto = itens.reduce((soma, i) => soma + subtotal(i), 0);

    // ---------- envio ----------

    function validar() {
        const prazo = Number(form.prazo_pagamento_dias);
        if (!Number.isInteger(prazo) || prazo < 0) return "Prazo de pagamento inválido";

        if (modoEdicao) {
            // data só é validada se foi alterada (pedido atrasado continua editável)
            const mudou = form.data_entrega_prevista !== pedido?.data_entrega_prevista;
            if (!form.data_entrega_prevista) return "Informe a data de entrega prevista";
            if (mudou && form.data_entrega_prevista < hojeISO()) {
                return "A data de entrega não pode ser anterior a hoje";
            }
            return null;
        }

        if (!form.id_fornecedor) return "Selecione o fornecedor";
        if (!form.data_entrega_prevista) return "Informe a data de entrega prevista";
        if (form.data_entrega_prevista < hojeISO()) return "A data de entrega não pode ser anterior a hoje";
        if (itens.length === 0) return "Adicione ao menos um produto";

        for (const it of itens) {
            const qtd = Number(it.quantidade_pedida);
            if (!Number.isInteger(qtd) || qtd <= 0) return `Quantidade inválida em "${it.nome}"`;
            const preco = paraNumero(it.preco_unitario_previsto);
            if (it.preco_unitario_previsto === "" || !Number.isFinite(preco) || preco < 0) {
                return `Preço inválido em "${it.nome}"`;
            }
        }
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (cabecalhoBloqueado || salvando) return;

        const erro = validar();
        if (erro) {
            alert(erro);
            return;
        }

        let url, metodo, corpo;

        if (modoEdicao) {
            // o backend só aceita estes campos na edição; fornecedor e itens não são enviados
            corpo = {
                tipo_frete: form.tipo_frete,
                prazo_pagamento_dias: Number(form.prazo_pagamento_dias),
                observacoes: form.observacoes,
            };
            if (form.data_entrega_prevista !== pedido?.data_entrega_prevista) {
                corpo.data_entrega_prevista = form.data_entrega_prevista;
            }
            url = `${API}/pedido/${id}/atualizar/`;
            metodo = "PUT";
        } else {
            corpo = {
                id_empresa: idEmpresa,
                id_admin: idAdmin,
                id_fornecedor: Number(form.id_fornecedor),
                data_entrega_prevista: form.data_entrega_prevista,
                prazo_pagamento_dias: Number(form.prazo_pagamento_dias),
                tipo_frete: form.tipo_frete,
                observacoes: form.observacoes,
                itens: itens.map((i) => ({
                    id_catalogo: i.id_catalogo,
                    quantidade_pedida: Number(i.quantidade_pedida),
                    preco_unitario_previsto: String(paraNumero(i.preco_unitario_previsto)),
                })),
            };
            url = `${API}/pedido/criar/`;
            metodo = "POST";
        }

        setSalvando(true);
        try {
            const response = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(corpo),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.erro || "Erro ao salvar pedido");
                return;
            }

            alert(modoEdicao ? "Pedido atualizado com sucesso!" : `Pedido ${data.numero} aberto com sucesso!`);
            navigate(ROTA_TABELA);

        } catch (error) {
            console.error(error);
            alert("Erro ao conectar com o servidor");
        } finally {
            setSalvando(false);
        }
    }

    if (carregando) {
        return <p>Carregando dados do pedido...</p>;
    }

    const tituloTela = somenteLeitura
        ? "Visualizar Pedido"
        : modoEdicao
            ? "Editar Pedido"
            : "Abrir Pedido";

    return (
        <>
            <div className={styles.topbar}>
                <img src={retornar} alt="retornar" className="navbar-img" />
                <a href={ROTA_TABELA}>{somenteLeitura ? "Voltar" : "Retornar"}</a>
            </div>

            <main className={styles.main}>

                <form onSubmit={handleSubmit}>
                    <div className={styles.emcima}>
                        <label>{tituloTela}{pedido ? ` ${pedido.numero}` : ""}</label>
                        {pedido && <div style={{ fontSize: "120%" }}>{pedido.status_label}</div>}
                    </div>

                    {modoEdicao && pedido && !pedido.editavel && (
                        <p>Este pedido não está aberto e não pode mais ser editado.</p>
                    )}

                    <div className={styles.secao1}>
                        <label>Dados do pedido</label>

                        <div className={styles.coluna1}>
                            <div className={styles.concatenar} style={{ marginRight: "10%" }}>
                                <label>Fornecedor</label>
                                {itensTravados ? (
                                    <input
                                        type="text"
                                        value={pedido?.fornecedor_nome || ""}
                                        disabled
                                    />
                                ) : (
                                    <select
                                        value={form.id_fornecedor}
                                        onChange={(e) => trocarFornecedor(e.target.value)}
                                    >
                                        <option value="">Selecione o fornecedor...</option>
                                        {fornecedores.map((f) => {
                                            const idF = f.id_fornecedor ?? f.id;
                                            return (
                                                <option key={idF} value={idF}>
                                                    {f.nome_fantasia_fn}
                                                </option>
                                            );
                                        })}
                                    </select>
                                )}
                                {!itensTravados && situacaoFornecedor && situacaoFornecedor !== "ATIVA" && (
                                    <small>
                                        Situação do CNPJ: {situacaoFornecedor}. Este fornecedor não entra nas recomendações.
                                    </small>
                                )}
                            </div>

                            <div className={styles.concatenar} style={{ marginRight: "10%" }}>
                                <label>Entrega prevista</label>
                                <input
                                    type="date"
                                    value={form.data_entrega_prevista}
                                    min={modoEdicao ? undefined : hojeISO()}
                                    onChange={(e) => atualizarCampo("data_entrega_prevista", e.target.value)}
                                    disabled={cabecalhoBloqueado}
                                />
                            </div>

                            <div className={styles.concatenar} style={{ marginRight: "10%" }}>
                                <label>Prazo de pagamento (dias)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="0 = à vista"
                                    value={form.prazo_pagamento_dias}
                                    onChange={(e) => atualizarCampo("prazo_pagamento_dias", e.target.value)}
                                    disabled={cabecalhoBloqueado}
                                />
                            </div>

                            <div className={styles.concatenar}>
                                <label>Frete</label>
                                <select
                                    value={form.tipo_frete}
                                    onChange={(e) => atualizarCampo("tipo_frete", e.target.value)}
                                    disabled={cabecalhoBloqueado}
                                >
                                    {FRETES.map((f) => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.secao2}>
                            <div className={styles.concatenar}>
                                <label>Observações (opcional)</label>
                                <input
                                    type="text"
                                    maxLength={300}
                                    placeholder="Observações"
                                    value={form.observacoes}
                                    onChange={(e) => atualizarCampo("observacoes", e.target.value)}
                                    disabled={cabecalhoBloqueado}
                                    style={{ width: "100%" }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.secaoProdutos}>
                        <label>Produtos do pedido</label>

                        {!itensTravados && (
                            <select
                                value=""
                                onChange={(e) => adicionarItem(Number(e.target.value))}
                                disabled={!form.id_fornecedor || produtosDisponiveis.length === 0}
                            >
                                <option value="">
                                    {!form.id_fornecedor
                                        ? "Escolha o fornecedor primeiro"
                                        : produtosDisponiveis.length === 0
                                            ? "Nenhum produto disponível para adicionar"
                                            : "Adicionar produto..."}
                                </option>
                                {produtosDisponiveis.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
                        )}

                        <div style={{ overflowX: "auto" }}>
                            <table style={estiloTabela}>
                                <thead>
                                    <tr>
                                        <th style={estiloCelula}>Produto</th>
                                        <th style={estiloCelula}>Qtd. pedida</th>
                                        <th style={estiloCelula}>Preço previsto</th>
                                        <th style={estiloCelula}>Subtotal</th>
                                        {recebido && (
                                            <>
                                                <th style={estiloCelula}>Qtd. recebida</th>
                                                <th style={estiloCelula}>Avariada</th>
                                                <th style={estiloCelula}>Preço final</th>
                                            </>
                                        )}
                                        {!itensTravados && <th style={estiloCelula}></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {itens.length === 0 ? (
                                        <tr>
                                            <td style={estiloCelula} colSpan={8}>Nenhum produto adicionado</td>
                                        </tr>
                                    ) : (
                                        itens.map((item) => (
                                            <tr key={item.key}>
                                                <td style={estiloCelula}>{item.nome}</td>
                                                <td style={estiloCelula}>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={item.quantidade_pedida}
                                                        onChange={(e) => atualizarItem(item.key, "quantidade_pedida", e.target.value)}
                                                        disabled={itensTravados}
                                                        style={estiloInputTabela}
                                                    />
                                                </td>
                                                <td style={estiloCelula}>
                                                    {itensTravados ? (
                                                        moeda(item.preco_unitario_previsto)
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="0,00"
                                                            value={item.preco_unitario_previsto}
                                                            onChange={(e) => atualizarItem(item.key, "preco_unitario_previsto", e.target.value)}
                                                            style={estiloInputTabela}
                                                        />
                                                    )}
                                                </td>
                                                <td style={estiloCelula}>{moeda(subtotal(item))}</td>
                                                {recebido && (
                                                    <>
                                                        <td style={estiloCelula}>{item.quantidade_recebida ?? "—"}</td>
                                                        <td style={estiloCelula}>
                                                            {item.quantidade_avariada ?? 0}
                                                            {item.quantidade_avariada > 0 && (
                                                                <small style={{ display: "block" }}>
                                                                    {CATEGORIAS_AVARIA[item.categoria_avaria] || item.categoria_avaria}
                                                                    {item.descricao_avaria ? ` — ${item.descricao_avaria}` : ""}
                                                                </small>
                                                            )}
                                                        </td>
                                                        <td style={estiloCelula}>
                                                            {item.preco_unitario_final != null ? moeda(item.preco_unitario_final) : "—"}
                                                        </td>
                                                    </>
                                                )}
                                                {!itensTravados && (
                                                    <td style={estiloCelula}>
                                                        <button type="button" onClick={() => removerItem(item.key)}>×</button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <p>
                            Total previsto: <strong>{moeda(pedido ? pedido.valor_previsto : totalPrevisto)}</strong>
                        </p>
                    </div>

                    {recebido && (
                        <div className={styles.secao1}>
                            <label>Recebimento</label>
                            <div className={styles.coluna1}>
                                <div className={styles.concatenar} style={{ marginRight: "8%" }}>
                                    <label>Recebido em</label>
                                    <input type="text" value={dataSimples(pedido.data_recebimento)} disabled />
                                </div>
                                <div className={styles.concatenar} style={{ marginRight: "8%" }}>
                                    <label>Frete</label>
                                    <input type="text" value={moeda(pedido.valor_frete)} disabled />
                                </div>
                                <div className={styles.concatenar} style={{ marginRight: "8%" }}>
                                    <label>Impostos</label>
                                    <input type="text" value={moeda(pedido.valor_impostos)} disabled />
                                </div>
                                <div className={styles.concatenar}>
                                    <label>Valor final</label>
                                    <input type="text" value={moeda(pedido.valor_final)} disabled />
                                </div>
                            </div>
                            {pedido.observacoes_recebimento && (
                                <div className={styles.secao2}>
                                    <div className={styles.concatenar}>
                                        <label>Observações do recebimento</label>
                                        <input
                                            type="text"
                                            value={pedido.observacoes_recebimento}
                                            disabled
                                            style={{ width: "100%" }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: "flex" }}>
                        <button className={styles.retornar} type="button" onClick={() => navigate(ROTA_TABELA)}>
                            {cabecalhoBloqueado ? "Voltar" : "Cancelar"}
                        </button>
                        {somenteLeitura && pedido?.editavel && (
                            <button
                                className={styles.cadastrar}
                                type="button"
                                onClick={() => navigate(`/fechar-pedido/${id}`)}
                            >
                                Fechar Pedido
                            </button>
                        )}
                        {!cabecalhoBloqueado && (
                            <button className={styles.cadastrar} type="submit" disabled={salvando}>
                                {salvando ? "Salvando..." : modoEdicao ? "Salvar Alterações" : "Abrir Pedido"}
                            </button>
                        )}
                    </div>
                </form>
            </main>
        </>
    );
}

export default CadastrarPedido;
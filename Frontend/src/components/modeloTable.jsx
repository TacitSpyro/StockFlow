import { useState, useEffect } from "react";
import Dropdown from "../components/Dropdown";
import "./modeloTable.css"
import Retornar from "../assets/Retornar.png"
import { useNavigate } from "react-router-dom";
import { useEmpresa } from "../context/EmpresaContext";
import imagemVisualizar from "../assets/visualizar.png"
import imagemEditar from "../assets/editar.png"
import rolarE from "../assets/rolarE.png"
import rolarD from "../assets/rolarD.png"

const TAMANHO_PAGINA = 20;

const ENDPOINTS = {
    produto: (idEmpresa) => `http://localhost:8000/api/empresa/${idEmpresa}/produtos/`,
    fornecedor: (idEmpresa) => `http://localhost:8000/api/empresa/${idEmpresa}/fornecedores/`,
    relatorio: (idEmpresa) => `http://localhost:8000/api/empresa/${idEmpresa}/relatorios/`,
};

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

const normalizar = (v) => String(v ?? "").trim().toLowerCase();

function ehAtivo(situacao) {
    return situacao === true || normalizar(situacao) === "ativo";
}

function timestamp(valor) {
    const t = new Date(valor).getTime();
    return Number.isNaN(t) ? null : t;
}

function ordenarLinhas(linhas, modo, { campoData, campoNome, campoSituacao }) {
    const copia = [...linhas];
    const nomeDe = (l) => String(l[campoNome] ?? l.nome ?? "");

    switch (modo) {
        case "recente":
        case "antigo": {
            const dir = modo === "recente" ? -1 : 1;
            return copia.sort((a, b) => {
                const ta = timestamp(a[campoData]);
                const tb = timestamp(b[campoData]);
                // datas inválidas/ausentes sempre vão para o final
                if (ta === null && tb === null) return 0;
                if (ta === null) return 1;
                if (tb === null) return -1;
                return (ta - tb) * dir;
            });
        }

        case "alfabetico":
            return copia.sort((a, b) => collator.compare(nomeDe(a), nomeDe(b)));

        case "estado":
            return copia.sort((a, b) => {
                const aAtivo = ehAtivo(a[campoSituacao]);
                const bAtivo = ehAtivo(b[campoSituacao]);

                // ativos no topo
                if (aAtivo !== bAtivo) return aAtivo ? -1 : 1;

                // demais situações agrupadas (uma ao lado da outra)
                if (!aAtivo) {
                    const cmp = collator.compare(
                        String(a[campoSituacao] ?? ""),
                        String(b[campoSituacao] ?? "")
                    );
                    if (cmp !== 0) return cmp;
                }

                // dentro de cada grupo, ordem alfabética
                return collator.compare(nomeDe(a), nomeDe(b));
            });

        default:
            return copia;
    }
}



function TabelaBase({
    titulo,
    tipo,
    opcoesOrdenacao,
    modoInicial,
    edicao,              
    texto,
    urlDoCoiso,            
    urlEdicaoBase,
    urlVisualizacaoBase,
    colunas,
    camposBusca,
    campoOrdenacao,
    campoNome = "nome_fantasia_fn",
    campoSituacao = "situacao",
}) {
    const navigate = useNavigate();
    const { idEmpresa } = useEmpresa();

    function handleAcaoTopo(e) {
        e.preventDefault();
        navigate(urlDoCoiso);
    }

    function handleModo(valor) {
        setModo(valor);
        setPagina(1);
    }

    function irParaDetalhe(id) {
        const base = edicao ? urlEdicaoBase : urlVisualizacaoBase;
        if (!base) return;
        navigate(`${base}/${id}`);
    }

    const [modo, setModo] = useState(modoInicial || opcoesOrdenacao[0]?.value)
    const [linhas, setLinhas] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState(null);

    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [total, setTotal] = useState(0);

    const [campoBusca, setCampoBusca] = useState("todos");
    const [textoBusca, setTextoBusca] = useState("");       // o que o usuário está digitando
    const [buscaAplicada, setBuscaAplicada] = useState(""); // o que de fato vai pro servidor

    const campoAtual = camposBusca?.find((c) => c.value === campoBusca);

    // data e dropdown de opções aplicam na hora, sem debounce
    function aplicarImediato(valor) {
        setTextoBusca(valor);
        setBuscaAplicada(valor);
        setPagina(1);
    }

    function handleCampo(valor) {
        setCampoBusca(valor);
        setTextoBusca("");
        setBuscaAplicada("");
        setPagina(1);
    }

    function limparBusca() {
        setTextoBusca("");
        setBuscaAplicada("");
        setPagina(1);
    }

    useEffect(() => {
    if (campoAtual?.tipo === "data" || campoAtual?.tipo === "opcoes") return;

    const t = setTimeout(() => {
        setBuscaAplicada(textoBusca.trim());
        setPagina(1); // resultado novo, volta pra primeira página
    }, 400);

        return () => clearTimeout(t);
    }, [textoBusca, campoAtual]);

    // Busca os dados do backend
    useEffect(() => {

        

        if (!idEmpresa || !tipo) return;

        const endpointFn = ENDPOINTS[tipo];
        if (!endpointFn) return;

        let cancelado = false; // evita que uma resposta antiga sobrescreva uma mais nova
        setCarregando(true);
        setErro(null);

        const params = new URLSearchParams({
            pagina,
            tamanho: TAMANHO_PAGINA,
            ordenar: modo,
        });

        if (buscaAplicada) {
            params.set("busca", buscaAplicada);
            params.set("campo", campoBusca);
        }

        fetch(`${endpointFn(idEmpresa)}?${params}`)
            .then((res) => {
                if (!res.ok) throw new Error("Erro ao buscar dados");
                return res.json();
            })
            .then((data) => {
                if (cancelado) return;
                setLinhas(data.resultados);
                setTotal(data.total);
                setTotalPaginas(data.total_paginas);
            })
            .catch((err) => {
                if (cancelado) return;
                console.error(err);
                setErro("Não foi possível carregar os dados");
                setLinhas([]);
            })
            .finally(() => {
                if (!cancelado) setCarregando(false);
            });

        return () => { cancelado = true; };

    }, [tipo, idEmpresa, pagina, modo, buscaAplicada, campoBusca]);

    return (
        <>
            <div className="topbar">
                <div className="segura">
                    <img src={Retornar} alt="retorna" className="img-Table"/>
                    <a href="/home" className="-a">Retornar</a>
                </div>

                {texto && urlDoCoiso ? (
                    <button type="button" className="botaoEditar" onClick={handleAcaoTopo}>
                        {texto}
                    </button>
                ) : null}
            </div>
            <main className="main">
                <div className="Barraemcima">
                    <label htmlFor="fo">{titulo}</label>

                    <div className={"sdd"}>
                        <Dropdown
                            as="div"
                            label={modo ? opcoesOrdenacao.find(o => o.value === modo).label : "Categoria"}
                            items={opcoesOrdenacao}
                            selected={modo}
                            onSelect={setModo}
                        />
                    </div>
                </div>

                {camposBusca && (
                    <div className="barraBusca">
                        <Dropdown
                            as="div"
                            label={campoAtual?.label ?? "Campo"}
                            items={camposBusca}
                            selected={campoBusca}
                            onSelect={handleCampo}
                        />

                        {campoAtual?.tipo === "opcoes" ? (
                            <Dropdown
                                as="div"
                                label="Selecione..."
                                items={campoAtual.opcoes}
                                selected={buscaAplicada || null}
                                onSelect={aplicarImediato}
                            />
                        ) : campoAtual?.tipo === "data" ? (
                            <input
                                type="date"
                                value={textoBusca}
                                onChange={(e) => aplicarImediato(e.target.value)}
                            />
                        ) : (
                            <input
                                type="text"
                                placeholder="Pesquisar..."
                                value={textoBusca}
                                onChange={(e) => setTextoBusca(e.target.value)}
                            />
                        )}

                        {buscaAplicada && (
                            <button type="button" onClick={limparBusca}>Limpar</button>
                        )}
                    </div>
                )}
                
                {carregando && <p>Carregando...</p>}
                {erro && <p>{erro}</p>}

                {!carregando && !erro && (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    {colunas.map((col) => (
                                        <th key={col.key}>{col.label}</th>
                                    ))}
                                    {(urlEdicaoBase || urlVisualizacaoBase) && <th>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {linhas.length === 0 ? (
                                    <tr>
                                        <td colSpan={colunas.length + 1}>
                                            {buscaAplicada ? "Nenhum resultado para a busca" : "Nenhum registro encontrado"}
                                        </td>
                                    </tr>
                                ) : (
                                    linhas.map((linha, i) => {
                                        const id = linha.id ?? linha.id_fornecedor ?? i;
                                        return (
                                            <tr key={id}>
                                                {colunas.map((col) => (
                                                    <td key={col.key}>
                                                        {col.format ? col.format(linha[col.key], linha) : String(linha[col.key] ?? "")}
                                                    </td>
                                                ))}
                                                {(urlEdicaoBase || urlVisualizacaoBase) && (
                                                    <td>
                                                        <button type="button" onClick={() => irParaDetalhe(id)}>
                                                            {edicao ? "Editar" : "Visualizar"}
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                        <div className="paginacao">
                            <button
                                type="button"
                                onClick={() => setPagina((p) => p - 1)}
                                disabled={pagina <= 1}
                            >
                                <img src={rolarE} />
                            </button>

                            <span>Página {pagina} de {totalPaginas} ({total} registros)</span>

                            <button
                                type="button"
                                onClick={() => setPagina((p) => p + 1)}
                                disabled={pagina >= totalPaginas}
                            >
                                <img src={rolarD} style={{marginRight: '0px'}}/>
                            </button>
                        </div>
                    </>
                )}
            </main>
        </>
    )
}

export default TabelaBase;
import { useState, useEffect } from "react";
import Dropdown from "../components/Dropdown";
import "./modeloTable.css"
import Retornar from "../assets/Retornar.png"
import { useNavigate } from "react-router-dom";
import { useEmpresa } from "../context/EmpresaContext";

const ENDPOINTS = {
    produto: (idEmpresa) => `http://localhost:8000/api/empresa/${idEmpresa}/produtos/`,
    fornecedor: (idEmpresa) => `http://localhost:8000/api/empresa/${idEmpresa}/fornecedores/`,
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
    colunas,
    campoOrdenacao,
    campoNome = "nome_fantasia_fn",
    campoSituacao = "situacao",
}) {

    const navigate = useNavigate();
    const { idEmpresa } = useEmpresa();

    function handleEditar(e) {
        e.preventDefault();
        navigate(urlDoCoiso);
    }

    const [modo, setModo] = useState(modoInicial || opcoesOrdenacao[0]?.value)
    const [linhas, setLinhas] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState(null);

    // Busca os dados do backend
    useEffect(() => {
        if (!idEmpresa || !tipo) return;

        const endpointFn = ENDPOINTS[tipo];
        if (!endpointFn) return;

        setCarregando(true);
        setErro(null);

        fetch(endpointFn(idEmpresa))
            .then((res) => {
                if (!res.ok) throw new Error("Erro ao buscar dados");
                return res.json();
            })
            .then((data) => setLinhas(data))
            .catch((err) => {
                console.error(err);
                setErro("Não foi possível carregar os dados");
                setLinhas([]);
            })
            .finally(() => setCarregando(false));

    }, [tipo, idEmpresa]);

    const linhasOrdenadas = ordenarLinhas(linhas, modo, {
        campoData: campoOrdenacao,
        campoNome,
        campoSituacao,
    });

    return (
        <>
            <div className="topbar">
                <div className="segura">
                    <img src={Retornar} alt="retorna" className="img-Table"/>
                    <a href="/home" className="-a">Retornar</a>
                </div>

                { edicao ? (
                    <button type="button" className="botaoEditar" onClick={handleEditar}>
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

                
                {carregando && <p>Carregando...</p>}
                {erro && <p>{erro}</p>}

                {!carregando && !erro && (
                    <table>
                        <thead>
                            <tr>
                                {colunas.map((col) => (
                                    <th key={col.key}>{col.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {linhasOrdenadas.length === 0 ? (
                                <tr>
                                    <td colSpan={colunas.length}>Nenhum registro encontrado</td>
                                </tr>
                            ) : (
                                linhasOrdenadas.map((linha, i) => (
                                    <tr key={linha.id ?? linha.id_fornecedor ?? i}>
                                        {colunas.map((col) => (
                                            <td key={col.key}>
                                                {col.format ? col.format(linha[col.key]) : String(linha[col.key] ?? "")}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </main>
        </>
    )
}

export default TabelaBase;
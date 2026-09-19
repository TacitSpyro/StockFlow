import { useState, useEffect } from "react";
import Dropdown from "../components/Dropdown";
import "./modeloTable.css"
import Logout from "../assets/Logout.png"
import { useNavigate } from "react-router-dom";
import { useEmpresa } from "../context/EmpresaContext";

const ENDPOINTS = {
    produto: (idEmpresa) => `http://localhost:8000/api/empresa/${idEmpresa}/produtos/`,
    fornecedor: (idEmpresa) => `http://localhost:8000/api/empresa/${idEmpresa}/fornecedores/`,
};

function ordenarLinhas(linhas, modo, campoOrdenacao) {
    const copia = [...linhas];

    switch (modo) {
        case "crescente":
            return copia.sort((a, b) =>
                String(a.nome ?? a.nome_fantasia_fn ?? "").localeCompare(String(b.nome ?? b.nome_fantasia_fn ?? ""))
            );
        case "decrescente":
            return copia.sort((a, b) =>
                String(b.nome ?? b.nome_fantasia_fn ?? "").localeCompare(String(a.nome ?? a.nome_fantasia_fn ?? ""))
            );
        case "recente":
            return copia.sort((a, b) => new Date(b[campoOrdenacao]) - new Date(a[campoOrdenacao]));
        case "antigo":
            return copia.sort((a, b) => new Date(a[campoOrdenacao]) - new Date(b[campoOrdenacao]));
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

    // Busca os dados do backend (só depende do tipo e idEmpresa, não do modo de ordenação)
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

    // Ordena localmente sempre que o modo mudar (sem precisar buscar de novo)
    const linhasOrdenadas = ordenarLinhas(linhas, modo, campoOrdenacao);

    return (
        <>
            <div className="topbar">
                <div className="segura">
                    <img src={Logout} alt="desloga" className="img-Table"/>
                    <a href="/" className="-a">Desconectar</a>
                </div>

                { edicao ? (
                    <button type="button" className="botaoEditar" onClick={handleEditar}>
                        {texto}
                    </button>
                ) : null}
            </div>
            <main className="main">
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
                                                {String(linha[col.key] ?? "")}
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
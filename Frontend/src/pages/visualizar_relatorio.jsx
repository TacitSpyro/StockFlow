import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const TIPO_LABEL = {
    TODOS: "Todos",
    FORNECEDOR: "Fornecedores",
    PRODUTO: "Produtos",
};

function VisualizarRelatorio() {

    const { id } = useParams();
    const [relatorio, setRelatorio] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:8000/api/relatorio/${id}/`)
            .then((res) => {
                if (!res.ok) throw new Error("Relatório não encontrado");
                return res.json();
            })
            .then((data) => setRelatorio(data))
            .catch((err) => {
                console.error(err);
                setErro("Não foi possível carregar o relatório");
            })
            .finally(() => setCarregando(false));
    }, [id]);

    if (carregando) return <p>Carregando relatório...</p>;
    if (erro) return <p>{erro}</p>;
    if (!relatorio) return null;

    const { dados } = relatorio;

    return (
        <main>
            <label>Relatório — {TIPO_LABEL[relatorio.tipo] ?? relatorio.tipo}</label>

            <p>Gerado em: {new Date(relatorio.data_geracao).toLocaleString("pt-BR")}</p>
            <p>Gerado por: {relatorio.gerado_por ?? "—"}</p>
            <p>
                Período:{" "}
                {relatorio.periodo_inicio || relatorio.periodo_fim
                    ? `${relatorio.periodo_inicio ?? "..."} até ${relatorio.periodo_fim ?? "..."}`
                    : "Sem filtro de data"}
            </p>

            {dados.produtos && (
                <section>
                    <h3>Produtos</h3>
                    <ul>
                        <li>Total: {dados.produtos.total}</li>
                        <li>Ativos: {dados.produtos.ativo}</li>
                        <li>Em inspeção: {dados.produtos.inspecao}</li>
                        <li>Bloqueados: {dados.produtos.bloqueio}</li>
                        <li>Encerrados: {dados.produtos.encerrado}</li>
                    </ul>
                </section>
            )}

            {dados.fornecedores && (
                <section>
                    <h3>Fornecedores</h3>
                    <ul>
                        <li>Total: {dados.fornecedores.total}</li>
                        <li>Ativos: {dados.fornecedores.ativos}</li>
                        <li>Inativos: {dados.fornecedores.inativos}</li>
                    </ul>
                </section>
            )}
        </main>
    )
}

export default VisualizarRelatorio;
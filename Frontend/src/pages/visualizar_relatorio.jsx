import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import retornar from "../assets/Retornar.png";
import styles from "../styles/visualizar-relatorio.module.css"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COR = {
    ativo: "#0ca30c",
    inspecao: "#fab219",
    bloqueio: "#d03b3b",
    neutro: "#898781",
};

function formatarData(iso) {
    if (!iso) return "...";
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
}

function CardGrafico({ titulo, total, itens }) {
    const dadosGrafico = total > 0
        ? itens
        : [{ nome: "Sem registros", valor: 1, cor: "#e5e7eb" }];

    return (
        <section className={styles.chartCard}>
            <h2 className={styles.chartTitle}>{titulo}</h2>
            <div className={styles.chartBody}>
                <div className={styles.donut}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dadosGrafico}
                                dataKey="valor"
                                nameKey="nome"
                                innerRadius="62%"
                                outerRadius="100%"
                                paddingAngle={total > 0 ? 2 : 0}
                                stroke="none"
                                isAnimationActive={false}
                            >
                                {dadosGrafico.map((i) => (
                                    <Cell key={i.nome} fill={i.cor} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className={styles.donutCenter}>
                        <strong>{total}</strong>
                        <span>total</span>
                    </div>
                </div>

                <ul className={styles.legend}>
                    {itens.map((i) => (
                        <li key={i.nome}>
                            <span className={styles.dot} style={{ background: i.cor }} />
                            <span className={styles.legendNome}>{i.nome}</span>
                            <strong>{i.valor}</strong>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

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
        <>
        <div className={styles.topbar}>
            <img src={retornar} alt="retornar" className="navbar-img"/>
            <a href="/visualizar-relatorios">Cancelar</a>
        </div>

        <main className={styles.main}>
            <div className={styles.card}>
                <h1 className={styles.title}>
                    Relatório — {TIPO_LABEL[relatorio.tipo] ?? relatorio.tipo}
                </h1>

                <div className={styles.geracao}>
                    <span className={styles.chip}>
                        Gerado em: {new Date(relatorio.data_geracao).toLocaleString("pt-BR")}
                    </span>
                    <span className={styles.chip}>
                        Gerado por: {relatorio.gerado_por ?? "—"}
                    </span>
                    <span className={styles.chip}>
                        Período:{" "}
                        {relatorio.periodo_inicio || relatorio.periodo_fim
                            ? `${formatarData(relatorio.periodo_inicio)} até ${formatarData(relatorio.periodo_fim)}`
                            : "Sem filtro de data"}
                    </span>
                </div>

                <div className={styles.grid}>
                    {dados.produtos && (
                        <CardGrafico
                            titulo="Produtos"
                            total={dados.produtos.total}
                            itens={[
                                { nome: "Ativos", valor: dados.produtos.ativo, cor: COR.ativo },
                                { nome: "Em inspeção", valor: dados.produtos.inspecao, cor: COR.inspecao },
                                { nome: "Bloqueados", valor: dados.produtos.bloqueio, cor: COR.bloqueio },
                                { nome: "Encerrados", valor: dados.produtos.encerrado, cor: COR.neutro },
                            ]}
                        />
                    )}

                    {dados.fornecedores && (
                        <CardGrafico
                            titulo="Fornecedores"
                            total={dados.fornecedores.total}
                            itens={[
                                { nome: "Ativos", valor: dados.fornecedores.ativos, cor: COR.ativo },
                                { nome: "Inativos", valor: dados.fornecedores.inativos, cor: COR.neutro },
                            ]}
                        />
                    )}
                </div>
            </div>
        </main>
    </>
    )
}

export default VisualizarRelatorio;
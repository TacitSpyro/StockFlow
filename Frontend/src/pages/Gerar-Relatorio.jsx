import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEmpresa } from "../context/EmpresaContext";
import Dropdown from "../components/Dropdown";
import retornar from "../assets/Retornar.png";
import styles from "../styles/gerar-relatorio.module.css";

const tipos = [
    { value: "TODOS", label: "Todos" },
    { value: "PRODUTO", label: "Produtos" },
    { value: "FORNECEDOR", label: "Fornecedores" },
];

function GerarRelatorio() {

    const { idEmpresa, idAdmin } = useEmpresa();
    const navigate = useNavigate();

    const [tipoSelecionado, setTipoSelecionado] = useState(null);
    const [periodoInicio, setPeriodoInicio] = useState("");
    const [periodoFim, setPeriodoFim] = useState("");
    const [gerando, setGerando] = useState(false);

    async function handleGerar(e) {
        e.preventDefault();

        if (!tipoSelecionado) {
            alert("Selecione o tipo de relatório");
            return;
        }

        setGerando(true);

        try {
            const response = await fetch("http://localhost:8000/api/relatorio/gerar/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_empresa: idEmpresa,
                    id_admin: idAdmin,
                    tipo: tipoSelecionado,
                    periodo_inicio: periodoInicio || null,
                    periodo_fim: periodoFim || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.erro || "Erro ao gerar relatório");
                return;
            }

            alert("Relatório gerado com sucesso!");
            navigate("/visualizar-relatorios");

        } catch (error) {
            console.error(error);
            alert("Erro ao conectar com o servidor");
        } finally {
            setGerando(false);
        }
    }

    return (
        <>
            <div className={styles.topbar}>
                <img src={retornar} alt="retornar" className="navbar-img"/>
                <a href="/visualizar-relatorios">Cancelar</a>
            </div>
            <main>
                <label>Gerar Relatório</label>

                <form onSubmit={handleGerar}>
                    <div>
                        <label htmlFor="tipo">Tipo de Relatório</label>
                        <Dropdown
                            as="div"
                            label={
                                tipoSelecionado
                                    ? tipos.find(t => t.value === tipoSelecionado)?.label
                                    : "Selecione o tipo"
                            }
                            items={tipos}
                            selected={tipoSelecionado}
                            onSelect={setTipoSelecionado}
                        />
                    </div>

                    <div>
                        <label>Período (opcional)</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                type="date"
                                value={periodoInicio}
                                onChange={(e) => setPeriodoInicio(e.target.value)}
                            />
                            <span>até</span>
                            <input
                                type="date"
                                value={periodoFim}
                                onChange={(e) => setPeriodoFim(e.target.value)}
                            />
                        </div>
                        <small>Deixe em branco para incluir todos os registros, sem filtro de data</small>
                    </div>

                    <button type="submit" disabled={gerando}>
                        {gerando ? "Gerando..." : "Gerar Relatório"}
                    </button>
                </form>
            </main>
        </>
    )
}

export default GerarRelatorio;
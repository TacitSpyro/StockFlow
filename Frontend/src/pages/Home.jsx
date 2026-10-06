import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import { homeLinks } from "../data/navLinks";
import styles from "../styles/Home.module.css";
import Dropdown from "../components/Dropdown";
import { useEmpresa } from "../context/EmpresaContext";
import {
  BarChart, Bar, Rectangle,
  PieChart, Pie, Sector,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const SITUACAO_LABEL = {
  ATIVO: "Ativo",
  INSPECAO: "Em Inspeção",
  BLOQUEIO: "Bloqueado",
};

const SITUACAO_COR = {
  ATIVO: "#2ecc71",
  INSPECAO: "#f39c12",
  BLOQUEIO: "#e74c3c",
};

function Home() {

  const { idEmpresa } = useEmpresa();
  const [modo, setModo] = useState('coluna')
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const graficoEstilos = [
    { value: "coluna", label: "Colunas"},
    { value: "pizza", label: "Pizza"}
  ]

  useEffect(() => {
    if (!idEmpresa) return;

    setCarregando(true);
    setErro(null);

    fetch(`http://localhost:8000/api/empresa/${idEmpresa}/produtos/`)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar produtos");
        return res.json();
      })
      .then((data) => setProdutos(data))
      .catch((err) => {
        console.error(err);
        setErro("Não foi possível carregar os dados");
      })
      .finally(() => setCarregando(false));

  }, [idEmpresa]);

  const dadosGrafico = useMemo(() => {
    const contagem = { ATIVO: 0, INSPECAO: 0, BLOQUEIO: 0 };

    produtos.forEach((p) => {
      if (p.situacao === "ENCERRADO") return;
      if (contagem[p.situacao] !== undefined) {
        contagem[p.situacao]++;
      }
    });

    return Object.entries(contagem).map(([situacao, quantidade]) => ({
      situacao: SITUACAO_LABEL[situacao],
      quantidade,
      cor: SITUACAO_COR[situacao],
    }));
  }, [produtos]);

  return (
    <>
      <Navbar links={homeLinks} />
      <main>
        <div className={styles.cabeca}>
          <label>Dados Recentes</label>

          <div className={styles.dropdown}>
            <Dropdown
              as="div"
              label={modo ? graficoEstilos.find(o => o.value === modo).label : "Categoria"}
              items={graficoEstilos}
              selected={modo}
              onSelect={setModo}
            />
          </div>

        </div>
        <div id="grafico-de-retirada" className={styles.chart}>
          <label>Situação dos Lotes</label>

          {carregando && <p>Carregando...</p>}
          {erro && <p>{erro}</p>}

          {!carregando && !erro && (
            <ResponsiveContainer width="100%" height={300}>
              {modo === "coluna" ? (
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="situacao" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="quantidade"
                    shape={(props) => <Rectangle {...props} fill={props.payload.cor} />}
                  />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={dadosGrafico}
                    dataKey="quantidade"
                    nameKey="situacao"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.situacao}: ${entry.quantidade}`}
                    shape={(props) => <Sector {...props} fill={props.payload.cor} />}
                  />
                  <Tooltip />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </main>
    </>
  );
}

export default Home;
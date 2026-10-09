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

// Um lote entra em "estoque baixo" quando está com 20% ou menos da capacidade
const LIMITE_ESTOQUE_BAIXO = 0.2;
const QTD_LINHAS = 4;

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

  // Os lotes mais recentemente cadastrados
  const ultimosCadastros = useMemo(() => {
    return produtos
      .filter((p) => p.situacao !== "ENCERRADO")
      .sort((a, b) => new Date(b.data_cadastro) - new Date(a.data_cadastro))
      .slice(0, QTD_LINHAS);
  }, [produtos]);

  const estoqueBaixo = useMemo(() => {
  const porMaterial = {};

  produtos.forEach((p) => {
    if (p.situacao !== "ATIVO") return;

    if (!porMaterial[p.nome]) {
      porMaterial[p.nome] = { nome: p.nome, disponivel: 0, capacidade: 0 };
    }

    porMaterial[p.nome].disponivel += p.estoque_atual;
    porMaterial[p.nome].capacidade += p.estoque_capacidade;
  });

  return Object.values(porMaterial)
    .filter((m) => m.capacidade > 0 && m.disponivel / m.capacidade <= LIMITE_ESTOQUE_BAIXO)
    .sort((a, b) => a.disponivel / a.capacidade - b.disponivel / b.capacidade)
    .slice(0, QTD_LINHAS);
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

        {/* Seção de listas */}
        {!carregando && !erro && (
          <div className={styles.paineis}>

            <section className={styles.painel}>
              <h3 className={styles.painelTitulo}>Últimos cadastros</h3>

              <div className={styles.tabelaMini}>
                <div className={styles.celulaHeader}>Nome</div>
                <div className={styles.celulaHeader}>Data</div>

                {ultimosCadastros.length === 0 ? (
                  <div className={`${styles.celula} ${styles.vazio}`}>Nenhum lote cadastrado</div>
                ) : (
                  ultimosCadastros.map((p) => (
                    <div key={p.id} className={styles.linhaMini}>
                      <div className={styles.celula}>{p.nome} — {p.lote}</div>
                      <div className={styles.celula}>
                        {new Date(p.data_cadastro).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={styles.painel}>
              <h3 className={styles.painelTitulo}>Materiais em estoque baixo</h3>

              <div className={styles.tabelaMini}>
                <div className={styles.celulaHeader}>Nome</div>
                <div className={styles.celulaHeader}>Estoque</div>

                {estoqueBaixo.length === 0 ? (
                  <div className={`${styles.celula} ${styles.vazio}`}>Nenhum material com estoque baixo</div>
                ) : (
                estoqueBaixo.map((m) => (
                  <div key={m.nome} className={styles.linhaMini}>
                    <div className={styles.celula}>{m.nome}</div>
                    <div className={styles.celula}>
                      {m.disponivel}/{m.capacidade}
                    </div>
                  </div>
                ))
                )}
              </div>
            </section>

          </div>
        )}
      </main>
    </>
  );
}

export default Home;
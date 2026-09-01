import { useState } from "react";
import Navbar from "../components/Navbar";
import { homeLinks } from "../data/navLinks";
import styles from "../styles/Home.module.css";
import Dropdown from "../components/Dropdown";

function Home() {

  const [modo, setModo] = useState('coluna')

  const graficoEstilos = [
    { value: "coluna", label: "Colunas"},
    { value: "linha", label: "Linhas"}
  ]

  return (
    <>
      <Navbar links={homeLinks} />
      <main>
        <div id="cabeca">
          <label>Dados Recentes</label>

          <Dropdown
            as="div"
            label={modo ? graficoEstilos.find(o => o.value === modo).label : "Categoria"}
            items={graficoEstilos}
            selected={modo}
            onSelect={setModo}
          />
          
        </div>
        <div id="grafico-de-retirada" className={styles.chart}>
          <label>"Gráfico"</label>
        </div>
      </main>
    </>
  );
}

export default Home;
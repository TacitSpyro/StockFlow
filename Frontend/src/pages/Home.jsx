import { useState } from "react";

function Home() {

    const [valorA, setValorA] = useState("");
    const [valorB, setValorB] = useState("");
    const [resultado, setResultado] = useState(null);


    const calcularSoma = async () => {

    const res = await fetch("http://localhost:8000/api/somar/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valor_a: parseFloat(valorA),
        valor_b: parseFloat(valorB),
      }),
    });
    const data = await res.json();
    setResultado(data.soma);
  };

  return (
    <div>
      <input
        type="number"
        placeholder="Valor A"
        value={valorA}
        onChange={(e) => setValorA(e.target.value)}
      />
      <input
        type="number"
        placeholder="Valor B"
        value={valorB}
        onChange={(e) => setValorB(e.target.value)}
      />
      <button onClick={calcularSoma}>Somar</button>
      {resultado !== null && <p>Resultado: {resultado}</p>}
    </div>
  );
}

export default Home;
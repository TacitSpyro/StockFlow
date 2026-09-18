import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Login.module.css"
import logo from "../assets/LogoDark.png"

function Login() {
  const [codigo, setCodigo] = useState("")  
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();

      if (!codigo || !usuario || !senha) {
        alert("Preencha todos os campos");
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/empresa/${codigo}/verificar/`);
        
        if (!response.ok) {
          alert("Código da empresa não encontrado");
          return;
        }

        const data = await response.json();
        
        // Aqui a empresa existe, agora sim navega
        navigate("/home");
        console.log({codigo})

      } catch (error) {
        console.error(error);
        alert("Erro ao conectar com o servidor");
      }
    }

  return (

    <>
    <div className={styles.pagina}>
      <img src={logo} alt="logo" className={styles.Logo}/>

      <form className={styles.container} id="LoginDiv" onSubmit={handleLogin}>
        <h2>Login</h2>
        <input
          className={styles.codigo}
          type="Number"
          placeholder="Código da Empresa"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
        <input
          className={styles.codigo}
          type="Number"
          placeholder="Matriucla"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />
        <input
          className={styles.codigo}
          type="password"
          placeholder="Senha Pessoal"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <button type="submit" className={styles.botao}>Entrar</button>
      </form>
    </div>
    </>
  );
}

export default Login;
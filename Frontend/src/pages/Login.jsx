import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Login.module.css"
import logo from "../assets/LogoDark.png"

function Login() {
  const [codigo, setCodigo] = useState("")  
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  function handleLogin(e) {
    e.preventDefault();

    // Validação de login aqui, futuramente talvez
    if (codigo && usuario && senha) {
      navigate("/home");
    } else {
      alert("Preencha usuário e senha");
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
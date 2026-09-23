import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Login.module.css"
import logo from "../assets/LogoDark.png"
import { useEmpresa } from "../context/EmpresaContext";

function Login() {

  const { salvarIdEmpresa, salvarAdmin } = useEmpresa();
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
      const response = await fetch("http://localhost:8000/api/admin/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_empresa: codigo,
          matricula: usuario,
          senha: senha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.erro || "Erro ao fazer login");
        return;
      }

      // Salva empresa e admin como var "superGlobal"
      salvarIdEmpresa(data.id_empresa);
      salvarAdmin({ id_admin: data.id_admin, matricula: data.matricula });

      navigate("/home");

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
            placeholder="Matricula"
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
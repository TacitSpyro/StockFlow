import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input
        type="Number"
        placeholder="Código da Empresa"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
      />
      <input
        type="Number"
        placeholder="Matriucla"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
      />
      <input
        type="password"
        placeholder="Senha Pessoal"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />
      <button type="submit">Entrar</button>
    </form>
  );
}

export default Login;
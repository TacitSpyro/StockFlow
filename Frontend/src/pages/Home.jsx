import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  function handleLogout() {
    navigate("/");
  }

  return (
    <div>
      <h2>Bem-vindo à Homer simpson!</h2>
      <button onClick={handleLogout}>Sair</button>
    </div>
  );
}

export default Home;
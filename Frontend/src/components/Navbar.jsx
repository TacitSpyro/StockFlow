import Dropdown from "./Dropdown";
import "./Navbar.css";
import Logout from "../assets/Logout.png"

export default function Navbar({ links }) {
  return (
    <nav className="navbar" aria-label="Main navigation">

      <img src={Logout} alt="simbolo-logout" className="navbar-img" />

      <a href="/" className="navbar-logo">Desconectar</a>

      <ul className="navbar-links">
        {links.map((menu) => (
          <Dropdown key={menu.label} label={menu.label} items={menu.items} />
        ))}
      </ul>
    </nav>
  );
}
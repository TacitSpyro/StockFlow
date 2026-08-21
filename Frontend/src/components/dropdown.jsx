import { useState, useRef, useEffect } from "react";
import "./Dropdown.css";

export default function Dropdown({ label, items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <li ref={ref} className="dropdown">
      <button
        className="dropdown-toggle"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
      >
        {label}
      </button>

      {open && (
        <ul className="dropdown-menu">
          {items.map((item) => (
            <li key={item.href || item.label}>
              {item.type === "button" ? (
                <button onClick={() => { item.onClick?.(); setOpen(false); }}>
                  {item.label}
                </button>
              ) : (
                <a href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
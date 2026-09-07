import { useState, useRef, useEffect } from "react";
import "./Dropdown.css";

export default function Dropdown({ label, items, as: Tag = "li", onSelect, selected }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(item) {
    onSelect?.(item.value);
    setOpen(false);
  }

  return (
    <Tag ref={ref} className="dropdown">
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
            <li key={item.value ?? item.href ?? item.label}>
              {item.href ? (
                <a href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              ) : (
                <button
                  className={item.value === selected ? "active" : ""}
                  onClick={() => handleSelect(item)}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Tag>
  );
}
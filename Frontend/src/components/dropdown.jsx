import { useState, useRef, useEffect } from "react";
import "./Dropdown.css";

export default function Dropdown({ label, items, as: Tag = "li", name, defaultValue, selected: selectedProp, onSelect }) {
  const [open, setOpen] = useState(false);
  const [selectedInterno, setSelectedInterno] = useState(defaultValue ?? null);
  const ref = useRef(null);

  // Se vier "selected" via prop (modo controlado), usa ele; senão usa o estado interno
  const selected = selectedProp !== undefined ? selectedProp : selectedInterno;

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(item) {
    setSelectedInterno(item.value); // continua funcionando pros casos sem onSelect
    setOpen(false);

    if (onSelect) {
      onSelect(item.value); // avisa o componente pai, se ele estiver escutando
    }
  }

  const selectedLabel = items.find((i) => i.value === selected)?.label;

  return (
    <Tag ref={ref} className="dropdown">
      {name && <input type="hidden" name={name} value={selected ?? ""} />}

      <button
        type="button"
        className="dropdown-toggle"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
      >
        {selectedLabel ?? label}
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
                  type="button"
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
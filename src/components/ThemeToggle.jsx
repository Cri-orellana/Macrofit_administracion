import { BsSunFill, BsMoonFill } from 'react-icons/bs';
import './ThemeToggle.css';

const ThemeToggle = ({ modoOscuro, alternarTema }) => {
  return (
    <button 
      className={`theme-toggle-btn ${modoOscuro ? 'dark-btn' : 'light-btn'}`} 
      onClick={alternarTema}
      title="Cambiar modo de apariencia"
    >
      {modoOscuro ? <BsSunFill className="icon-sun" /> : <BsMoonFill className="icon-moon" />}
    </button>
  );
};

export default ThemeToggle;
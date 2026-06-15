import { useNavigate, useLocation } from 'react-router-dom';
import logoApp from '../assets/logo_app.png';
import './MenuNavegacion.css';

const MenuNavegacion = ({ modoOscuro }) => {
  const navegar = useNavigate();
  const location = useLocation();

  const cerrarSesion = () => {
    localStorage.removeItem('rol_usuario');
    navegar('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* ─── BARRA LATERAL IZQUIERDA ─── */}
      <aside className={`flup-sidebar ${modoOscuro ? 'dark-mode' : ''}`}>
        <div className="sidebar-logo">
          <img src={logoApp} alt="MacroFit Admin" />
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section-title">MENÚ PRINCIPAL</div>
          
          <button 
            className={`nav-item ${isActive('/panel') ? 'active' : ''}`} 
            onClick={() => navegar('/panel')}
          >
            📊 Dashboard
          </button>
          
          <button 
            className={`nav-item ${isActive('/panel/recomendaciones') ? 'active' : ''}`} 
            onClick={() => navegar('/panel/recomendaciones')}
          >
            🥗 Recomendaciones
          </button>
          
          <button 
            className={`nav-item ${isActive('/panel/rutinas') ? 'active' : ''}`} 
            onClick={() => navegar('/panel/rutinas')}
          >
            🏋️‍♂️ Rutinas y Catálogo
          </button>
          
          <button 
            className={`nav-item ${isActive('/panel/usuarios') ? 'active' : ''}`} 
            onClick={() => navegar('/panel/usuarios')}
          >
            👥 Gestión Usuarios
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item text-danger w-100" onClick={cerrarSesion}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ─── BARRA SUPERIOR (HEADER) ─── */}
      <header className={`flup-topbar ${modoOscuro ? 'dark-mode' : ''}`}>
        <h1 className="topbar-title">Macrofit Dashboard Administración</h1>
      </header>
    </>
  );
};

export default MenuNavegacion;
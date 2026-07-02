import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoApp from '../assets/logo_app.png';
import qrCode from '../assets/frame.png';
import './MenuNavegacion.css';

const MenuNavegacion = ({ modoOscuro }) => {
  const navegar = useNavigate();
  const location = useLocation();
  const [sidebarAbierta, setSidebarAbierta] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-abierta') !== 'false';
    }
    return true;
  });
  const [modalQrAbierto, setModalQrAbierto] = useState(false);

  const cerrarSesion = () => {
    localStorage.removeItem('rol_usuario');
    navegar('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', !sidebarAbierta);
    localStorage.setItem('sidebar-abierta', String(sidebarAbierta));

    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [sidebarAbierta]);

  const alternarSidebar = () => {
    setSidebarAbierta((prev) => !prev);
  };

  return (
    <>
      {/* ─── MODAL QR AGRANDADO ─── */}
      {modalQrAbierto && (
        <div className="qr-modal-overlay" onClick={() => setModalQrAbierto(false)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="qr-modal-close"
              onClick={() => setModalQrAbierto(false)}
              aria-label="Cerrar modal"
            >
              ✕
            </button>
            <img src={qrCode} alt="Código QR Agrandado" className="qr-modal-image" />
            <p className="qr-modal-text">Escanea el código QR con tu dispositivo</p>
          </div>
        </div>
      )}

      {/* ─── BARRA LATERAL IZQUIERDA ─── */}
      <aside className={`flup-sidebar ${modoOscuro ? 'dark-mode' : ''} ${sidebarAbierta ? '' : 'collapsed'}`}>
        <div className="sidebar-logo">
          <img src={logoApp} alt="MacroFit Admin" />
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={alternarSidebar}
            aria-label={sidebarAbierta ? 'Ocultar menú' : 'Mostrar menú'}
          >
            ☰
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">MENÚ PRINCIPAL</div>

          <button
            className={`nav-item ${isActive('/panel') ? 'active' : ''}`}
            onClick={() => navegar('/panel')}
          >
            Dashboard
          </button>

          <button
            className={`nav-item ${isActive('/panel/recomendaciones') ? 'active' : ''}`}
            onClick={() => navegar('/panel/recomendaciones')}
          >
            Recomendaciones
          </button>

          <button
            className={`nav-item ${isActive('/panel/rutinas') ? 'active' : ''}`}
            onClick={() => navegar('/panel/rutinas')}
          >
            Rutinas y Catálogo
          </button>

          <button
            className={`nav-item ${isActive('/panel/usuarios') ? 'active' : ''}`}
            onClick={() => navegar('/panel/usuarios')}
          >
            Gestión Usuarios
          </button>
        </nav>

        <div className="sidebar-footer">
          {/* ─── QR CODE ─── */}
          <div
            className="sidebar-qr"
            onClick={() => setModalQrAbierto(true)}
            style={{ cursor: 'pointer' }}
            title="Haz clic para agrandar"
          >
            <img src={qrCode} alt="Código QR" className="qr-image" />
            <span className="qr-label">Escanea el QR</span>
          </div>

          <button className="nav-item text-danger w-100" onClick={cerrarSesion}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ─── BARRA SUPERIOR (HEADER) ─── */}
      <header className={`flup-topbar ${modoOscuro ? 'dark-mode' : ''}`}>
        <button
          type="button"
          className="sidebar-toggle-btn topbar-toggle"
          onClick={alternarSidebar}
          aria-label={sidebarAbierta ? 'Ocultar menú' : 'Mostrar menú'}
        >
          ☰
        </button>
        <h1 className="topbar-title">Macrofit Dashboard Administración</h1>
      </header>
    </>
  );
};

export default MenuNavegacion;
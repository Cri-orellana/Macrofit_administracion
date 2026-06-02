import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ThemeToggle from './components/ThemeToggle';
import fondoClaro from './assets/fondo_web_claro.png';
import fondoOscuro from './assets/fondo_web_oscuro.png';
import RutaProtegida from './utils/RutaProtegida';
import PanelPrincipal from './pages/PanelPrincipal';
import Usuarios from './pages/Usuarios';
import Recomendaciones from './pages/Recomendaciones';
import Rutinas from './pages/Rutinas';
import HistorialUsuario from './pages/HistorialUsuario';

function App() {
  const [modoOscuro, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', modoOscuro ? 'dark' : 'light');

    const currentBg = modoOscuro ? fondoOscuro : fondoClaro;
    
    document.body.style.backgroundImage = `url(${currentBg})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed'; 
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.transition = 'background-image 0.5s ease-in-out'; 

  }, [modoOscuro]);

  const alternarTema = () => setIsDarkMode(!modoOscuro);

  return (
    <Router>
      <ThemeToggle modoOscuro={modoOscuro} alternarTema={alternarTema} />
      
      <Routes>
        {/* Ruta pública (Cualquiera puede intentar entrar al Login) */}
        <Route path="/" element={<Login modoOscuro={modoOscuro} />} />

        {/* Zona Protegida (El guardia de seguridad) */}
          
          {/* Todas las rutas aquí dentro requieren ser Admin */}
          <Route path="/panel" element={<PanelPrincipal modoOscuro={modoOscuro} />} />
          
          {/* Aquí agregaremos luego <Recomendaciones />, <Rutinas />, etc. */}

          {/* Zona Protegida (El guardia de seguridad) */}
        <Route element={<RutaProtegida rolRequerido="Admin" />}>
          
          <Route path="/panel" element={<PanelPrincipal modoOscuro={modoOscuro} />} />
          
          {/* ¡NUEVA RUTA AQUÍ! */}
          <Route path="/panel/usuarios" element={<Usuarios modoOscuro={modoOscuro} />} />

          {/* NUEVA RUTA PARA RECOMENDACIONES */}
          <Route path="/panel/recomendaciones" element={<Recomendaciones modoOscuro={modoOscuro} />} />
          
          <Route path="/panel/rutinas" element={<Rutinas modoOscuro={modoOscuro} />} />

          <Route path="/panel/usuarios/:id" element={<HistorialUsuario modoOscuro={modoOscuro} />} />
          
        </Route>
          
      </Routes>
    </Router>
  );
}
export default App;
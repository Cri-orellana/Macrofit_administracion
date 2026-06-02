import { Navigate, Outlet } from 'react-router-dom';

const RutaProtegida = ({ rolRequerido }) => {
  const rolUsuario = localStorage.getItem('rol_usuario');

  if (rolUsuario !== rolRequerido) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RutaProtegida;
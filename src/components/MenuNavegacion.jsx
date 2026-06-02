import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const MenuNavegacion = ({ modoOscuro }) => {
  const navegar = useNavigate();

  const cerrarSesion = () => {
    localStorage.removeItem('rol_usuario');
    navegar('/');
  };

  const claseBarraNavegacion = modoOscuro ? 'navbar-dark bg-dark' : 'navbar-light bg-light';

  return (
    <Navbar className={claseBarraNavegacion} expand="lg" shadow="sm">
      <Container fluid>
        <Navbar.Brand className="fw-bold text-primary">MacroFit Admin</Navbar.Brand>
        <Navbar.Toggle aria-controls="menu-admin" />
        <Navbar.Collapse id="menu-admin">
          <Nav className="me-auto">
            <Nav.Link onClick={() => navegar('/panel')}>Inicio</Nav.Link>
            <Nav.Link onClick={() => navegar('/panel/recomendaciones')}>Recomendaciones</Nav.Link>
            <Nav.Link onClick={() => navegar('/panel/rutinas')}>Rutinas y Ejercicios</Nav.Link>
            <Nav.Link onClick={() => navegar('/panel/usuarios')}>Usuarios</Nav.Link>
          </Nav>
          <Button variant="outline-danger" onClick={cerrarSesion}>
            Cerrar Sesión
          </Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MenuNavegacion;
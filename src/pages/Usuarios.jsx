import { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import MenuNavegacion from '../components/MenuNavegacion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Usuarios = ({ modoOscuro }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const navegar = useNavigate();

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const respuesta = await api.get('/usuarios');
        setUsuarios(respuesta.data);
      } catch (err) {
        setError('No se pudo cargar la lista de usuarios.');
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarUsuarios();
  }, []);

  const eliminarUsuario = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios(usuarios.filter(u => u.id_usuario !== id));
    } catch (err) {
      setError('No se pudo eliminar el usuario.');
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nom_usuario?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.correo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const claseTexto = modoOscuro ? 'text-light' : 'text-dark';
  const claseTarjeta = modoOscuro ? 'bg-dark text-light border-secondary' : 'bg-white text-dark shadow-sm';
  const claseTabla = modoOscuro ? 'table-dark' : 'table-light';
  const fondoPantalla = modoOscuro ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)';

  return (
    <div className={`min-vh-100 ${claseTexto}`} style={{ backgroundColor: fondoPantalla }}>
      <MenuNavegacion modoOscuro={modoOscuro} />

      <Container className="mt-4">
        <h2 className="fw-bold mb-4">Administración de Usuarios</h2>

        {error && <Alert variant="danger">{error}</Alert>}

        <Card className={`mb-4 ${claseTarjeta}`}>
          <Card.Body>
            <Form.Control
              type="text"
              placeholder="🔍 Buscar usuario por nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={modoOscuro ? 'bg-secondary text-light border-secondary' : ''}
            />
          </Card.Body>
        </Card>

        <Card className={claseTarjeta}>
          <Card.Body>
            {cargando ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Cargando usuarios...</p>
              </div>
            ) : (
              <Table responsive striped bordered hover className={claseTabla}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Edad</th>
                    <th>Sexo</th>
                    <th>Peso</th>
                    <th>Altura</th>
                    <th>Rol</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length > 0 ? (
                    usuariosFiltrados.map((u) => (
                      <tr key={u.id_usuario}>
                        <td>{u.nom_usuario ?? '—'}</td>
                        <td>{u.correo}</td>
                        <td>{u.edad ?? '—'}</td>
                        <td>{u.sexo ?? '—'}</td>
                        <td>{u.peso ? `${u.peso} kg` : '—'}</td>
                        <td>{u.altura ? `${u.altura} cm` : '—'}</td>
                        <td>
                          <span className={`badge ${u.rol === 'ADMIN' || u.rol === 'Admin' ? 'bg-danger' : 'bg-success'}`}>
                            {u.rol}
                          </span>
                        </td>
                        <td>
                          <Button
                            variant="info"
                            size="sm"
                            className="me-2 text-white fw-bold"
                            onClick={() => navegar(`/panel/usuarios/${u.id_usuario}`)}
                          >
                            Ver Historial
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="fw-bold"
                            onClick={() => eliminarUsuario(u.id_usuario)}
                          >
                            Borrar
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default Usuarios;
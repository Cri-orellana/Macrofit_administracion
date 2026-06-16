import { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Card, Spinner, Alert, Modal, Row, Col } from 'react-bootstrap';
import MenuNavegacion from '../components/MenuNavegacion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const formVacio = {
  nom_usuario: '', correo: '', contrasena: '', rol: 'USER',
  edad: '', sexo: '', peso: '', altura: ''
};

const Usuarios = ({ modoOscuro }) => {
  const [usuarios,  setUsuarios]  = useState([]);
  const [busqueda,  setBusqueda]  = useState('');
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState(formVacio);
  const [guardando, setGuardando] = useState(false);
  const navegar = useNavigate();

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const respuesta = await api.get('/usuarios');
        setUsuarios(respuesta.data);
      } catch {
        setError('No se pudo cargar la lista de usuarios.');
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
    } catch {
      setError('No se pudo eliminar el usuario.');
    }
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = {
        nom_usuario:  form.nom_usuario,
        correo:       form.correo,
        contrasena:   form.contrasena,
        rol:          form.rol,
        edad:         form.edad     ? parseInt(form.edad)     : null,
        sexo:         form.sexo     || null,
        peso:         form.peso     ? parseFloat(form.peso)   : null,
        altura:       form.altura   ? parseInt(form.altura)   : null,
      };
      const res = await api.post('/usuarios/registro', payload);
      setUsuarios([...usuarios, res.data]);
      setModal(false);
      setForm(formVacio);
    } catch {
      setError('No se pudo crear el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nom_usuario?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.correo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const claseTexto   = modoOscuro ? 'text-light' : 'text-dark';
  const claseTarjeta = modoOscuro ? 'bg-dark text-light border-secondary' : 'bg-white text-dark shadow-sm';
  const claseTabla   = modoOscuro ? 'table-dark' : 'table-light';
  const fondoPantalla= modoOscuro ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)';
  const claseInput   = modoOscuro ? 'bg-secondary text-light border-secondary' : '';
  const claseModal   = modoOscuro ? 'bg-dark text-light' : 'bg-white text-dark';

  return (
    <div className={`flup-main-content min-vh-100 ${claseTexto}`} style={{ backgroundColor: fondoPantalla }}>
      <MenuNavegacion modoOscuro={modoOscuro} />

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold m-0">Administración de Usuarios</h2>
          <Button variant="primary" className="fw-bold" onClick={() => { setForm(formVacio); setModal(true); }}>
            + Nuevo Usuario
          </Button>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        <Card className={`mb-4 ${claseTarjeta}`}>
          <Card.Body>
            <Form.Control
              type="text"
              placeholder=" Buscar usuario por nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={claseInput}
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
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div className="d-flex gap-1">
                            <Button variant="info" size="sm" className="text-white fw-bold"
                              onClick={() => navegar(`/panel/usuarios/${u.id_usuario}`)}>
                              Ver
                            </Button>
                            <Button variant="danger" size="sm" className="fw-bold"
                              onClick={() => eliminarUsuario(u.id_usuario)}>
                              Borrar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4">No se encontraron usuarios.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: Crear Usuario
      ══════════════════════════════════════════════════════════════════ */}
      <Modal show={modal} onHide={() => setModal(false)} centered size="lg">
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title>Crear Nuevo Usuario</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={crearUsuario}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Nombre de Usuario *</Form.Label>
                    <Form.Control required type="text" placeholder="Ej: Juan Pérez"
                      className={claseInput} value={form.nom_usuario}
                      onChange={e => setForm({ ...form, nom_usuario: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Correo Electrónico *</Form.Label>
                    <Form.Control required type="email" placeholder="usuario@email.com"
                      className={claseInput} value={form.correo}
                      onChange={e => setForm({ ...form, correo: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Contraseña *</Form.Label>
                    <Form.Control required type="password" placeholder="Mínimo 6 caracteres"
                      className={claseInput} value={form.contrasena}
                      onChange={e => setForm({ ...form, contrasena: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Rol</Form.Label>
                    <Form.Select className={claseInput} value={form.rol}
                      onChange={e => setForm({ ...form, rol: e.target.value })}>
                      <option value="USER">Usuario</option>
                      <option value="ADMIN">Administrador</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Edad</Form.Label>
                    <Form.Control type="number" min="1" max="120" placeholder="Ej: 25"
                      className={claseInput} value={form.edad}
                      onChange={e => setForm({ ...form, edad: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Sexo</Form.Label>
                    <Form.Select className={claseInput} value={form.sexo}
                      onChange={e => setForm({ ...form, sexo: e.target.value })}>
                      <option value="">— Selecciona —</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Peso (kg)</Form.Label>
                    <Form.Control type="number" min="1" step="0.1" placeholder="Ej: 70.5"
                      className={claseInput} value={form.peso}
                      onChange={e => setForm({ ...form, peso: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Altura (cm)</Form.Label>
                    <Form.Control type="number" min="1" placeholder="Ej: 175"
                      className={claseInput} value={form.altura}
                      onChange={e => setForm({ ...form, altura: e.target.value })} />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={guardando}>
                  {guardando ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </div>
      </Modal>
    </div>
  );
};

export default Usuarios;
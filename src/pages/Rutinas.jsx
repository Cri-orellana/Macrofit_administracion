import { useState, useEffect } from 'react';
import { Container, Table, Button, Card, Modal, Form, Badge, Spinner, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import MenuNavegacion from '../components/MenuNavegacion';
import api from '../services/api';

// ─── helpers ────────────────────────────────────────────────────────────────
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const colorNivel = (nivel) => {
  switch (nivel?.toLowerCase()) {
    case 'principiante': return 'success';
    case 'intermedio':   return 'warning';
    case 'avanzado':     return 'danger';
    default:             return 'secondary';
  }
};

// ─── Componente principal ────────────────────────────────────────────────────
const Rutinas = ({ modoOscuro }) => {

  // ── Estado general ──────────────────────────────────────────────────────
  const [rutinas,    setRutinas]    = useState([]);
  const [ejercicios, setEjercicios] = useState([]);   // catálogo completo
  const [cargando,   setCargando]   = useState(true);
  const [error,      setError]      = useState('');

  // ── Modal: crear / editar rutina ────────────────────────────────────────
  const [modalRutina,    setModalRutina]    = useState(false);
  const [editandoRutina, setEditandoRutina] = useState(null);  // null = nueva
  const [formRutina, setFormRutina] = useState({
    nombreRutina: '', descripcion: '', activoCatalogo: true
  });

  // ── Modal: gestionar ejercicios de una rutina ───────────────────────────
  const [modalEjercicios,    setModalEjercicios]    = useState(false);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [ejerciciosRutina,   setEjerciciosRutina]   = useState([]);
  const [cargandoEjer,       setCargandoEjer]       = useState(false);
  const [diasSemana,         setDiasSemana]         = useState(3);  // solo info

  // ── Modal: agregar ejercicio a rutina ───────────────────────────────────
  const [modalAgregarEjer,  setModalAgregarEjer]  = useState(false);
  const [busquedaEjer,      setBusquedaEjer]      = useState('');
  const [formEjercicioRut, setFormEjercicioRut]  = useState({
    idEjercicio: '', orden: 1, series: 3, repeticiones: 10, tiempoSeg: '', pesoReferencia: ''
  });

  // ── Modal: crear nuevo ejercicio ────────────────────────────────────────
  const [modalNuevoEjer, setModalNuevoEjer] = useState(false);
  const [formNuevoEjer, setFormNuevoEjer] = useState({
    nombre_ejercicio: '', descripcion: '', musculo_objetivo: '', zona_muscular: '',
    implemento: '', nivel_dificultad: 'Principiante', imagen_ejercicio: '',
    video_ejercicio: '', activo_catalogo: true, original: true
  });

  // ── Clases dinámicas ─────────────────────────────────────────────────────
  const claseTexto   = modoOscuro ? 'text-light' : 'text-dark';
  const claseTarjeta = modoOscuro ? 'bg-dark text-light border-secondary' : 'bg-white text-dark shadow-sm';
  const claseTabla   = modoOscuro ? 'table-dark' : 'table-light';
  const fondoPantalla= modoOscuro ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)';
  const claseInput   = modoOscuro ? 'bg-secondary text-light border-secondary' : '';
  const claseModal   = modoOscuro ? 'bg-dark text-light' : 'bg-white text-dark';

  // ════════════════════════════════════════════════════════════════════════
  // Carga inicial
  // ════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const cargar = async () => {
      try {
        const [resRutinas, resEjer] = await Promise.all([
          api.get('/rutinas'),
          api.get('/ejercicios/activos')
        ]);
        setRutinas(resRutinas.data);
        setEjercicios(resEjer.data);
      } catch (e) {
        setError('No se pudo cargar la información.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // ════════════════════════════════════════════════════════════════════════
  // CRUD Rutinas
  // ════════════════════════════════════════════════════════════════════════
  const abrirModalNuevaRutina = () => {
    setEditandoRutina(null);
    setFormRutina({ nombreRutina: '', descripcion: '', activoCatalogo: true });
    setModalRutina(true);
  };

  const abrirModalEditarRutina = (rutina) => {
    setEditandoRutina(rutina);
    setFormRutina({
      nombreRutina:    rutina.nombreRutina   ?? '',
      descripcion:     rutina.descripcion    ?? '',
      activoCatalogo:  rutina.activoCatalogo ?? true,
    });
    setModalRutina(true);
  };

  const guardarRutina = async (e) => {
    e.preventDefault();
    try {
      if (editandoRutina) {
        const res = await api.put(`/rutinas/${editandoRutina.idRutina}`, formRutina);
        setRutinas(rutinas.map(r => r.idRutina === editandoRutina.idRutina ? res.data : r));
      } else {
        const res = await api.post('/rutinas', formRutina);
        setRutinas([...rutinas, res.data]);
      }
      setModalRutina(false);
    } catch (e) {
      setError('No se pudo guardar la rutina.');
    }
  };

  const eliminarRutina = async (id) => {
    if (!window.confirm('¿Eliminar esta rutina y todos sus ejercicios?')) return;
    try {
      await api.delete(`/rutinas/${id}`);
      setRutinas(rutinas.filter(r => r.idRutina !== id));
    } catch {
      setError('No se pudo eliminar la rutina.');
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // Gestión de ejercicios dentro de una rutina
  // ════════════════════════════════════════════════════════════════════════
  const abrirModalEjercicios = async (rutina) => {
    setRutinaSeleccionada(rutina);
    setModalEjercicios(true);
    setCargandoEjer(true);
    try {
      const res = await api.get(`/rutina-ejercicio/rutina/${rutina.idRutina}`);
      setEjerciciosRutina(res.data);
    } catch {
      setError('No se pudieron cargar los ejercicios de la rutina.');
    } finally {
      setCargandoEjer(false);
    }
  };

  const eliminarEjercicioDeRutina = async (idRutinaEjercicio) => {
    if (!window.confirm('¿Quitar este ejercicio de la rutina?')) return;
    try {
      await api.delete(`/rutina-ejercicio/${idRutinaEjercicio}`);
      setEjerciciosRutina(ejerciciosRutina.filter(e => e.idRutinaEjercicio !== idRutinaEjercicio));
    } catch {
      setError('No se pudo eliminar el ejercicio.');
    }
  };

  // ── Agregar ejercicio a rutina ──────────────────────────────────────────
  const abrirModalAgregarEjer = () => {
    setBusquedaEjer('');
    setFormEjercicioRut({ idEjercicio: '', orden: ejerciciosRutina.length + 1, series: 3, repeticiones: 10, tiempoSeg: '', pesoReferencia: '' });
    setModalAgregarEjer(true);
  };

  const agregarEjercicioARutina = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        idRutina:        rutinaSeleccionada.idRutina,
        idEjercicio:     parseInt(formEjercicioRut.idEjercicio),
        orden:           parseInt(formEjercicioRut.orden),
        series:          parseInt(formEjercicioRut.series),
        repeticiones:    parseInt(formEjercicioRut.repeticiones),
        tiempoSeg:       formEjercicioRut.tiempoSeg       ? parseInt(formEjercicioRut.tiempoSeg)       : null,
        pesoReferencia:  formEjercicioRut.pesoReferencia  ? parseFloat(formEjercicioRut.pesoReferencia) : null,
      };
      const res = await api.post('/rutina-ejercicio', payload);
      setEjerciciosRutina([...ejerciciosRutina, res.data]);
      setModalAgregarEjer(false);
    } catch {
      setError('No se pudo agregar el ejercicio.');
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // Crear nuevo ejercicio en catálogo
  // ════════════════════════════════════════════════════════════════════════
  const crearNuevoEjercicio = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/ejercicios', formNuevoEjer);
      setEjercicios([...ejercicios, res.data]);
      setModalNuevoEjer(false);
      setFormNuevoEjer({
        nombre_ejercicio: '', descripcion: '', musculo_objetivo: '', zona_muscular: '',
        implemento: '', nivel_dificultad: 'Principiante', imagen_ejercicio: '',
        video_ejercicio: '', activo_catalogo: true, original: true
      });
    } catch {
      setError('No se pudo crear el ejercicio.');
    }
  };

  // ── Lookup nombre ejercicio ─────────────────────────────────────────────
  const nombreEjercicio = (idEjercicio) => {
    const e = ejercicios.find(e => e.id_ejercicio === idEjercicio || e.idEjercicio === idEjercicio);
    return e ? (e.nombre_ejercicio ?? e.nombreEjercicio ?? `Ejercicio #${idEjercicio}`) : `#${idEjercicio}`;
  };

  const ejerciciosFiltrados = ejercicios.filter(e => {
    const nombre = e.nombre_ejercicio ?? e.nombreEjercicio ?? '';
    return nombre.toLowerCase().includes(busquedaEjer.toLowerCase());
  });

  // ════════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className={`min-vh-100 ${claseTexto}`} style={{ backgroundColor: fondoPantalla }}>
      <MenuNavegacion modoOscuro={modoOscuro} />

      <Container className="mt-4 pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold m-0">Administrar Rutinas</h2>
          <div className="d-flex gap-2">
            <Button variant="outline-info" className="fw-bold" onClick={() => setModalNuevoEjer(true)}>
              + Nuevo Ejercicio
            </Button>
            <Button variant="primary" className="fw-bold" onClick={abrirModalNuevaRutina}>
              + Nueva Rutina
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        {/* ── Tabla de rutinas ── */}
        <Card className={claseTarjeta}>
          <Card.Body>
            {cargando ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Cargando rutinas...</p>
              </div>
            ) : (
              <Table responsive striped bordered hover className={claseTabla}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rutinas.length > 0 ? rutinas.map((r) => (
                    <tr key={r.idRutina}>
                      <td>{r.idRutina}</td>
                      <td className="fw-bold">{r.nombreRutina ?? '—'}</td>
                      <td className="text-truncate" style={{ maxWidth: 250 }}>{r.descripcion ?? '—'}</td>
                      <td>
                        <Badge bg={r.activoCatalogo ? 'success' : 'secondary'}>
                          {r.activoCatalogo ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td>
                        <Button variant="info"    size="sm" className="me-1 text-white fw-bold" onClick={() => abrirModalEjercicios(r)}>Ver Ejercicios</Button>
                        <Button variant="warning" size="sm" className="me-1 fw-bold text-dark"  onClick={() => abrirModalEditarRutina(r)}>Editar</Button>
                        <Button variant="danger"  size="sm" className="fw-bold"                 onClick={() => eliminarRutina(r.idRutina)}>Eliminar</Button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="text-center py-4">No hay rutinas registradas.</td></tr>
                  )}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: Crear / Editar Rutina
      ══════════════════════════════════════════════════════════════════ */}
      <Modal show={modalRutina} onHide={() => setModalRutina(false)} centered>
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title>{editandoRutina ? 'Editar Rutina' : 'Nueva Rutina'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={guardarRutina}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre de la Rutina</Form.Label>
                <Form.Control type="text" required placeholder="Ej: Fuerza Total 5 días"
                  className={claseInput} value={formRutina.nombreRutina}
                  onChange={e => setFormRutina({ ...formRutina, nombreRutina: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control as="textarea" rows={3} placeholder="Descripción breve..."
                  className={claseInput} value={formRutina.descripcion}
                  onChange={e => setFormRutina({ ...formRutina, descripcion: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Check type="switch" label="Activa en catálogo"
                  checked={formRutina.activoCatalogo}
                  onChange={e => setFormRutina({ ...formRutina, activoCatalogo: e.target.checked })} />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setModalRutina(false)}>Cancelar</Button>
                <Button variant="primary" type="submit">{editandoRutina ? 'Guardar Cambios' : 'Crear Rutina'}</Button>
              </div>
            </Form>
          </Modal.Body>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: Ejercicios de una Rutina
      ══════════════════════════════════════════════════════════════════ */}
      <Modal show={modalEjercicios} onHide={() => setModalEjercicios(false)} size="xl" centered>
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title>
              Ejercicios de: <span className="text-primary">{rutinaSeleccionada?.nombreRutina}</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>

            {/* ── Aviso días (solo informativo) ── */}
            <Card className={`mb-4 border-info ${modoOscuro ? 'bg-dark' : 'bg-light'}`}>
              <Card.Body className="py-2">
                <Row className="align-items-center">
                  <Col xs="auto">
                    <span className="text-info fw-bold">📅 Días sugeridos por semana:</span>
                  </Col>
                  <Col xs="auto">
                    <div className="d-flex align-items-center gap-2">
                      <Button variant="outline-info" size="sm" onClick={() => setDiasSemana(Math.max(1, diasSemana - 1))}>−</Button>
                      <span className="fw-bold fs-5 text-info">{diasSemana}</span>
                      <Button variant="outline-info" size="sm" onClick={() => setDiasSemana(Math.min(7, diasSemana + 1))}>+</Button>
                    </div>
                  </Col>
                  <Col>
                    <small className="text-muted">
                      {DIAS_SEMANA.slice(0, diasSemana).join(' · ')}
                      <span className="ms-2 fst-italic">(referencia orientativa, no se guarda en BD)</span>
                    </small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* ── Lista ejercicios ── */}
            {cargandoEjer ? (
              <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0">
                    {ejerciciosRutina.length} ejercicio{ejerciciosRutina.length !== 1 ? 's' : ''} asignado{ejerciciosRutina.length !== 1 ? 's' : ''}
                  </h6>
                  <Button variant="success" size="sm" className="fw-bold" onClick={abrirModalAgregarEjer}>
                    + Agregar Ejercicio
                  </Button>
                </div>

                {ejerciciosRutina.length === 0 ? (
                  <Alert variant="info">Esta rutina aún no tiene ejercicios. ¡Agrega el primero!</Alert>
                ) : (
                  <Table responsive striped bordered hover className={claseTabla}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Ejercicio</th>
                        <th>Series</th>
                        <th>Reps</th>
                        <th>Tiempo (seg)</th>
                        <th>Peso Ref. (kg)</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...ejerciciosRutina]
                        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                        .map((re) => (
                          <tr key={re.idRutinaEjercicio}>
                            <td><Badge bg="secondary">{re.orden ?? '—'}</Badge></td>
                            <td className="fw-bold">{nombreEjercicio(re.idEjercicio)}</td>
                            <td>{re.series ?? '—'}</td>
                            <td>{re.repeticiones ?? '—'}</td>
                            <td>{re.tiempoSeg ?? '—'}</td>
                            <td>{re.pesoReferencia ? `${re.pesoReferencia} kg` : '—'}</td>
                            <td>
                              <Button variant="danger" size="sm" className="fw-bold"
                                onClick={() => eliminarEjercicioDeRutina(re.idRutinaEjercicio)}>
                                Quitar
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer className={modoOscuro ? 'border-secondary' : ''}>
            <Button variant="secondary" onClick={() => setModalEjercicios(false)}>Cerrar</Button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: Agregar Ejercicio a Rutina
      ══════════════════════════════════════════════════════════════════ */}
      <Modal show={modalAgregarEjer} onHide={() => setModalAgregarEjer(false)} centered>
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title>Agregar Ejercicio a Rutina</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={agregarEjercicioARutina}>

              {/* Buscador de ejercicio */}
              <Form.Group className="mb-2">
                <Form.Label>Buscar ejercicio</Form.Label>
                <Form.Control type="text" placeholder="Escribe para filtrar..."
                  className={claseInput} value={busquedaEjer}
                  onChange={e => setBusquedaEjer(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Select required className={claseInput} value={formEjercicioRut.idEjercicio}
                  onChange={e => setFormEjercicioRut({ ...formEjercicioRut, idEjercicio: e.target.value })}>
                  <option value="">— Selecciona un ejercicio —</option>
                  {ejerciciosFiltrados.map(e => (
                    <option key={e.id_ejercicio ?? e.idEjercicio} value={e.id_ejercicio ?? e.idEjercicio}>
                      {e.nombre_ejercicio ?? e.nombreEjercicio} {e.musculo_objetivo ? `(${e.musculo_objetivo})` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Row>
                <Col xs={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Orden</Form.Label>
                    <Form.Control type="number" min={1} className={claseInput}
                      value={formEjercicioRut.orden}
                      onChange={e => setFormEjercicioRut({ ...formEjercicioRut, orden: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Series</Form.Label>
                    <Form.Control type="number" min={1} required className={claseInput}
                      value={formEjercicioRut.series}
                      onChange={e => setFormEjercicioRut({ ...formEjercicioRut, series: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Repeticiones</Form.Label>
                    <Form.Control type="number" min={1} className={claseInput}
                      value={formEjercicioRut.repeticiones}
                      onChange={e => setFormEjercicioRut({ ...formEjercicioRut, repeticiones: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tiempo (seg) <small className="text-muted">opcional</small></Form.Label>
                    <Form.Control type="number" min={0} className={claseInput}
                      value={formEjercicioRut.tiempoSeg}
                      onChange={e => setFormEjercicioRut({ ...formEjercicioRut, tiempoSeg: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>Peso Referencia (kg) <small className="text-muted">opcional</small></Form.Label>
                    <Form.Control type="number" min={0} step="0.5" className={claseInput}
                      value={formEjercicioRut.pesoReferencia}
                      onChange={e => setFormEjercicioRut({ ...formEjercicioRut, pesoReferencia: e.target.value })} />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setModalAgregarEjer(false)}>Cancelar</Button>
                <Button variant="success" type="submit">Agregar</Button>
              </div>
            </Form>
          </Modal.Body>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: Crear Nuevo Ejercicio en Catálogo
      ══════════════════════════════════════════════════════════════════ */}
      <Modal show={modalNuevoEjer} onHide={() => setModalNuevoEjer(false)} size="lg" centered>
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title>Crear Nuevo Ejercicio</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={crearNuevoEjercicio}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre del Ejercicio *</Form.Label>
                    <Form.Control required type="text" placeholder="Ej: Press de Banca"
                      className={claseInput} value={formNuevoEjer.nombre_ejercicio}
                      onChange={e => setFormNuevoEjer({ ...formNuevoEjer, nombre_ejercicio: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nivel de Dificultad</Form.Label>
                    <Form.Select className={claseInput} value={formNuevoEjer.nivel_dificultad}
                      onChange={e => setFormNuevoEjer({ ...formNuevoEjer, nivel_dificultad: e.target.value })}>
                      <option value="Principiante">Principiante</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado">Avanzado</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Músculo Objetivo</Form.Label>
                    <Form.Control type="text" placeholder="Ej: Pectorales"
                      className={claseInput} value={formNuevoEjer.musculo_objetivo}
                      onChange={e => setFormNuevoEjer({ ...formNuevoEjer, musculo_objetivo: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Zona Muscular</Form.Label>
                    <Form.Control type="text" placeholder="Ej: Tren Superior"
                      className={claseInput} value={formNuevoEjer.zona_muscular}
                      onChange={e => setFormNuevoEjer({ ...formNuevoEjer, zona_muscular: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Implemento</Form.Label>
                    <Form.Control type="text" placeholder="Ej: Barra, Mancuernas"
                      className={claseInput} value={formNuevoEjer.implemento}
                      onChange={e => setFormNuevoEjer({ ...formNuevoEjer, implemento: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>URL Imagen <small className="text-muted">opcional</small></Form.Label>
                    <Form.Control type="text" placeholder="https://..."
                      className={claseInput} value={formNuevoEjer.imagen_ejercicio}
                      onChange={e => setFormNuevoEjer({ ...formNuevoEjer, imagen_ejercicio: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>URL Video <small className="text-muted">opcional</small></Form.Label>
                    <Form.Control type="text" placeholder="https://youtube.com/..."
                      className={claseInput} value={formNuevoEjer.video_ejercicio}
                      onChange={e => setFormNuevoEjer({ ...formNuevoEjer, video_ejercicio: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Descripción</Form.Label>
                    <Form.Control as="textarea" rows={3} placeholder="Descripción del ejercicio..."
                      className={claseInput} value={formNuevoEjer.descripcion}
                      onChange={e => setFormNuevoEjer({ ...formNuevoEjer, descripcion: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Check type="switch" label="Activo en catálogo" className="mb-3"
                    checked={formNuevoEjer.activo_catalogo}
                    onChange={e => setFormNuevoEjer({ ...formNuevoEjer, activo_catalogo: e.target.checked })} />
                </Col>
                <Col md={6}>
                  <Form.Check type="switch" label="Ejercicio original" className="mb-3"
                    checked={formNuevoEjer.original}
                    onChange={e => setFormNuevoEjer({ ...formNuevoEjer, original: e.target.checked })} />
                </Col>
              </Row>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setModalNuevoEjer(false)}>Cancelar</Button>
                <Button variant="primary" type="submit">Crear Ejercicio</Button>
              </div>
            </Form>
          </Modal.Body>
        </div>
      </Modal>

    </div>
  );
};

export default Rutinas;
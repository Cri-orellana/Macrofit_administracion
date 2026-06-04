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
  const [vista,      setVista]      = useState('rutinas'); // 'rutinas' o 'ejercicios'
  const [busquedaEjercicios, setBusquedaEjercicios] = useState('');

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
  const [editandoEjercicio, setEditandoEjercicio] = useState(null);
  const [modalVerEjer, setModalVerEjer] = useState(false);
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(null);
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
  const cargarEjercicios = async () => {
    try {
      const resEjer = await api.get('/ejercicios/activos');
      setEjercicios(resEjer.data);
    } catch (e) {
      setError('No se pudo cargar los ejercicios.');
    }
  };

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
  // Crear / editar ejercicio en catálogo
  // ════════════════════════════════════════════════════════════════════════
  const abrirModalNuevoEjercicio = () => {
    setEditandoEjercicio(null);
    setFormNuevoEjer({
      nombre_ejercicio: '', descripcion: '', musculo_objetivo: '', zona_muscular: '',
      implemento: '', nivel_dificultad: 'Principiante', imagen_ejercicio: '',
      video_ejercicio: '', activo_catalogo: true, original: true
    });
    setModalNuevoEjer(true);
  };

const abrirModalEditarEjercicio = (ejercicio) => {
  setEditandoEjercicio(ejercicio);
  setFormNuevoEjer({
    nombre_ejercicio: ejercicio.nombreEjercicio  ?? '',
    descripcion:      ejercicio.descripcion      ?? '',
    musculo_objetivo: ejercicio.musculoObjetivo  ?? '',
    zona_muscular:    ejercicio.zonaMuscular      ?? '',
    implemento:       ejercicio.implemento        ?? '',
    nivel_dificultad: ejercicio.nivelDificultad   ?? 'Principiante',
    imagen_ejercicio: ejercicio.imagenEjercicio   ?? '',
    video_ejercicio:  ejercicio.videoEjercicio    ?? '',
    activo_catalogo:  ejercicio.activoCatalogo    ?? true,
    original:         ejercicio.original          ?? true,
  });
  setModalNuevoEjer(true);
};

  const abrirModalVerEjercicio = (ejercicio) => {
    setEjercicioSeleccionado(ejercicio);
    setModalVerEjer(true);
  };

const guardarEjercicio = async (e) => {
  e.preventDefault();
  try {
    // ✅ Payload con camelCase para que coincida con Ejercicio.java
    const payload = {
      nombreEjercicio:  formNuevoEjer.nombre_ejercicio,
      descripcion:      formNuevoEjer.descripcion,
      musculoObjetivo:  formNuevoEjer.musculo_objetivo,
      zonaMuscular:     formNuevoEjer.zona_muscular,
      implemento:       formNuevoEjer.implemento,
      nivelDificultad:  formNuevoEjer.nivel_dificultad,
      imagenEjercicio:  formNuevoEjer.imagen_ejercicio,
      videoEjercicio:   formNuevoEjer.video_ejercicio,
      activoCatalogo:   formNuevoEjer.activo_catalogo,
      // original: formNuevoEjer.original, // comentado para uso futuro
    };

    if (editandoEjercicio) {
      const id = editandoEjercicio.idEjercicio ?? editandoEjercicio.id_ejercicio ?? editandoEjercicio.id;
      await api.put(`/ejercicios/${id}`, payload);
    } else {
      await api.post('/ejercicios', payload);
    }

    await cargarEjercicios();
    setEditandoEjercicio(null);
    setModalNuevoEjer(false);
    setFormNuevoEjer({
      nombre_ejercicio: '', descripcion: '', musculo_objetivo: '', zona_muscular: '',
      implemento: '', nivel_dificultad: 'Principiante', imagen_ejercicio: '',
      video_ejercicio: '', activo_catalogo: true, original: true
    });
  } catch {
    setError('No se pudo guardar el ejercicio.');
  }
};

  // ── Lookup nombre ejercicio ─────────────────────────────────────────────
  const obtenerNombreEjercicio = (e) => e?.nombreEjercicio ?? '';


  const nombreEjercicio = (idEjercicio) => {
    const e = ejercicios.find(e => e.id_ejercicio === idEjercicio || e.idEjercicio === idEjercicio);
    const nombre = obtenerNombreEjercicio(e);
    return nombre ? nombre : `Ejercicio #${idEjercicio}`;
  };

  const ejerciciosFiltrados = ejercicios.filter(e => {
    const nombre = obtenerNombreEjercicio(e);
    return nombre.toLowerCase().includes(busquedaEjer.toLowerCase());
  });

  const ejerciciosFiltradosLista = ejercicios.filter((e) => {
    const texto = [
      e.nombreEjercicio  ?? '',
      e.musculoObjetivo  ?? '',
      e.zonaMuscular     ?? '',
      e.nivelDificultad  ?? '',
      e.implemento       ?? '',
      e.activoCatalogo ? 'activo' : 'inactivo'
    ].join(' ').toLowerCase();
    return texto.includes(busquedaEjercicios.trim().toLowerCase());
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
            <Button variant="outline-info" className="fw-bold" onClick={abrirModalNuevoEjercicio}>
              + Nuevo Ejercicio
            </Button>
            <Button variant="primary" className="fw-bold" onClick={abrirModalNuevaRutina}>
              + Nueva Rutina
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        <div className="mb-4 d-flex flex-wrap align-items-center gap-2">
          <Button
            variant={vista === 'rutinas' ? 'primary' : 'outline-primary'}
            className="fw-bold"
            onClick={() => setVista('rutinas')}
          >
            Rutinas
          </Button>
          <Button
            variant={vista === 'ejercicios' ? 'primary' : 'outline-primary'}
            className="fw-bold"
            onClick={() => setVista('ejercicios')}
          >
            Ejercicios
          </Button>
        </div>

        <Card className={claseTarjeta}>
          <Card.Body>
            {vista === 'rutinas' ? (
              cargando ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Cargando rutinas...</p>
                </div>
              ) : (
                <Table responsive striped bordered hover className={claseTabla}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rutinas.length > 0 ? rutinas.map((r) => (
                      <tr key={r.idRutina}>
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
              )
            ) : (
              cargando ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Cargando ejercicios...</p>
                </div>
              ) : (
                <>
                  <InputGroup className="mb-3">
                    <Form.Control
                      placeholder="Buscar ejercicios..."
                      value={busquedaEjercicios}
                      onChange={(e) => setBusquedaEjercicios(e.target.value)}
                    />
                    <Button variant="outline-secondary" onClick={() => setBusquedaEjercicios('')}>
                      Limpiar
                    </Button>
                  </InputGroup>
                  <Table responsive striped bordered hover className={claseTabla}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Músculo objetivo</th>
                        <th>Zona</th>
                        <th>Implemento</th>
                        <th>Nivel</th>
                        <th>Activo</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ejerciciosFiltradosLista.length > 0 ? ejerciciosFiltradosLista.map((e) => {
                        // ✅ Reemplaza estas líneas:
                        const nombre      = e.nombreEjercicio  ?? '—';
                        const musculo     = e.musculoObjetivo  ?? '—';
                        const zona        = e.zonaMuscular     ?? '—';
                        const nivel       = e.nivelDificultad  ?? '—';
                        const activo      = e.activoCatalogo;
                        const idEjercicio = e.idEjercicio;

                        return (
                          <tr key={idEjercicio ?? nombre}>
                            <td className="fw-bold">{nombre}</td>
                            <td>{musculo}</td>
                            <td>{zona}</td>
                            <td>{e.implemento ?? '—'}</td>
                            <td>{nivel}</td>
                            <td>
                              <Badge bg={activo ? 'success' : 'secondary'}>
                                {activo ? 'Sí' : 'No'}
                              </Badge>
                            </td>
                            <td>
                              <Button variant="outline-primary" size="sm" className="me-1"
                                onClick={() => abrirModalVerEjercicio(e)}>
                                Ver
                              </Button>
                              <Button variant="outline-warning" size="sm" className="me-1 text-dark"
                                onClick={() => abrirModalEditarEjercicio(e)}>
                                Editar
                              </Button>
                              <Button variant="outline-danger" size="sm"
                                onClick={() => eliminarEjercicio(idEjercicio)}>
                                Borrar
                              </Button>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan="7" className="text-center py-4">No hay ejercicios registrados.</td></tr>
                      )}
                    </tbody>
                  </Table>
                </>
              )
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
                      {obtenerNombreEjercicio(e)} {e.musculo_objetivo ?? e.musculoObjetivo ? `(${e.musculo_objetivo ?? e.musculoObjetivo})` : ''}
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
      <Modal.Title>{editandoEjercicio ? 'Editar Ejercicio' : 'Crear Nuevo Ejercicio'}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form onSubmit={guardarEjercicio}>
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
              <Form.Select value={formNuevoEjer.nivel_dificultad}
                onChange={e => setFormNuevoEjer({ ...formNuevoEjer, nivel_dificultad: e.target.value })}>
                <option value="Principiante">Principiante</option>
                <option value="Ligero">Ligero</option>
                <option value="Moderado">Moderado</option>
                <option value="Intenso">Intenso</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Músculo Objetivo</Form.Label>
              <Form.Select value={formNuevoEjer.musculo_objetivo}
                onChange={e => setFormNuevoEjer({ ...formNuevoEjer, musculo_objetivo: e.target.value })}>
                <option value="">— Selecciona —</option>
                {[
                  'Abdominales','Glúteos','Isquiotibiales','Cuádriceps','Pecho',
                  'Espalda','Hombros','Bíceps','Tríceps','Pantorrillas',
                  'Antebrazos','Aductores','Abductores','Flexores de cadera',
                  'Erectores espinales','Dorsales','Trapecios'
                ].map(m => <option key={m} value={m}>{m}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Zona Muscular</Form.Label>
              <Form.Select value={formNuevoEjer.zona_muscular}
                onChange={e => setFormNuevoEjer({ ...formNuevoEjer, zona_muscular: e.target.value })}>
                <option value="">— Selecciona —</option>
                {[
                  'Tren superior','Tren inferior','Core','Cuerpo completo'
                ].map(z => <option key={z} value={z}>{z}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Implemento</Form.Label>
              <Form.Select value={formNuevoEjer.implemento}
                onChange={e => setFormNuevoEjer({ ...formNuevoEjer, implemento: e.target.value })}>
                <option value="">— Selecciona —</option>
                {[
                  'Peso corporal','Mancuerna','Mancuernas','Barra','Kettlebell',
                  'Kettlebells','Polea','Máquina','Banda elástica','Bandas elásticas',
                  'Balón medicinal','Balón de estabilidad','Banco',
                  'Barra de dominadas','Suspensión','Sin implemento'
                ].map(i => <option key={i} value={i}>{i}</option>)}
              </Form.Select>
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
          {/* Ejercicio original — comentado para uso futuro
          <Col md={6}>
            <Form.Check type="switch" label="Ejercicio original" className="mb-3"
              checked={formNuevoEjer.original}
              onChange={e => setFormNuevoEjer({ ...formNuevoEjer, original: e.target.checked })} />
          </Col>
          */}
        </Row>
        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={() => setModalNuevoEjer(false)}>Cancelar</Button>
          <Button variant="primary" type="submit">
            {editandoEjercicio ? 'Actualizar Ejercicio' : 'Crear Ejercicio'}
          </Button>
        </div>
      </Form>
    </Modal.Body>
  </div>
</Modal>

<Modal show={modalVerEjer} onHide={() => setModalVerEjer(false)} centered>
  <div className={claseModal}>
    <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
      <Modal.Title>Detalle del Ejercicio</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {ejercicioSeleccionado ? (
        <div className="d-flex flex-column gap-3">
          <div>
            <h6 className="fw-bold mb-1">{obtenerNombreEjercicio(ejercicioSeleccionado)}</h6>
            <p className="mb-0 text-muted">{ejercicioSeleccionado.descripcion ?? 'Sin descripción'}</p>
          </div>
          <div><strong>Músculo objetivo:</strong> {ejercicioSeleccionado.musculo_objetivo ?? ejercicioSeleccionado.musculoObjetivo ?? ejercicioSeleccionado.musculo ?? '—'}</div>
          <div><strong>Zona muscular:</strong> {ejercicioSeleccionado.zona_muscular ?? ejercicioSeleccionado.zonaMuscular ?? ejercicioSeleccionado.zona ?? '—'}</div>
          <div><strong>Implemento:</strong> {ejercicioSeleccionado.implemento ?? '—'}</div>
          <div><strong>Nivel:</strong> {ejercicioSeleccionado.nivel_dificultad ?? ejercicioSeleccionado.nivelDificultad ?? ejercicioSeleccionado.nivel ?? '—'}</div>
          <div><strong>Activo en catálogo:</strong> {(ejercicioSeleccionado.activo_catalogo ?? ejercicioSeleccionado.activoCatalogo) ? 'Sí' : 'No'}</div>
          {ejercicioSeleccionado.imagen_ejercicio && (
            <div>
              <strong>Imagen:</strong>
              <div className="mt-2"><img src={ejercicioSeleccionado.imagen_ejercicio} alt={obtenerNombreEjercicio(ejercicioSeleccionado)} className="img-fluid rounded" /></div>
            </div>
          )}
          {ejercicioSeleccionado.video_ejercicio && (
            <div><strong>Video:</strong> <a href={ejercicioSeleccionado.video_ejercicio} target="_blank" rel="noreferrer">Ver video</a></div>
          )}
        </div>
      ) : (
        <p>No hay ejercicio seleccionado.</p>
      )}
    </Modal.Body>
    <Modal.Footer className={modoOscuro ? 'border-secondary' : ''}>
      <Button variant="secondary" onClick={() => setModalVerEjer(false)}>Cerrar</Button>
    </Modal.Footer>
  </div>
</Modal>

    </div>
  );
};

export default Rutinas;
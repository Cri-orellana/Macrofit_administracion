import { useState, useEffect } from 'react';
import { Container, Table, Button, Card, Modal, Form, Badge, Spinner, Alert, Row, Col, InputGroup, Dropdown } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import MenuNavegacion from '../components/MenuNavegacion';
import api from '../services/api';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const Rutinas = ({ modoOscuro }) => {

  const [rutinas,    setRutinas]    = useState([]);
  const [ejercicios, setEjercicios] = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [error,      setError]      = useState('');
  const [vista,      setVista]      = useState('rutinas');
  const [busquedaEjercicios, setBusquedaEjercicios] = useState('');

  const [modalAsignar, setModalAsignar] = useState(false);
  const [rutinaAAsignar, setRutinaAAsignar] = useState(null);
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [busquedaUsuarioModal, setBusquedaUsuarioModal] = useState('');
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  const [modalRutina,    setModalRutina]    = useState(false);
  const [editandoRutina, setEditandoRutina] = useState(null);
  const [formRutina, setFormRutina] = useState({ nombreRutina: '', descripcion: '', activoCatalogo: true });

  const [modalEjercicios,    setModalEjercicios]    = useState(false);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [ejerciciosRutina,   setEjerciciosRutina]   = useState([]);
  const [cargandoEjer,       setCargandoEjer]       = useState(false);
  const [diasSemana,         setDiasSemana]         = useState(3);

  const [modalAgregarEjer,  setModalAgregarEjer]  = useState(false);
  const [busquedaEjer,      setBusquedaEjer]      = useState('');
  const [filtroMusculo,     setFiltroMusculo]     = useState('');
  const [filtroZona,        setFiltroZona]        = useState('');
  const [filtroImplemento,  setFiltroImplemento]  = useState('');
  const [filtroDificultad,  setFiltroDificultad]  = useState('');
  const [formEjercicioRut, setFormEjercicioRut]  = useState({
    idEjercicio: '', dia: 1, orden: 1, series: 3, repeticiones: 10, tiempoSeg: '', pesoReferencia: ''
  });

  const [modalNuevoEjer, setModalNuevoEjer] = useState(false);
  const [editandoEjercicio, setEditandoEjercicio] = useState(null);
  const [modalVerEjer, setModalVerEjer] = useState(false);
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(null);
  const [videoReproduciendo, setVideoReproduciendo] = useState(false);
  const [formNuevoEjer, setFormNuevoEjer] = useState({
    nombre_ejercicio: '', descripcion: '', musculo_objetivo: '', zona_muscular: '',
    implemento: '', nivel_dificultad: 'Principiante', imagen_ejercicio: '',
    video_ejercicio: '', activo_catalogo: true, original: true
  });

  const claseTexto   = modoOscuro ? 'text-light' : 'text-dark';
  const claseTarjeta = modoOscuro ? 'bg-dark text-light border-secondary' : 'bg-white text-dark shadow-sm';
  const claseTabla   = modoOscuro ? 'table-dark' : 'table-light';
  const fondoPantalla= modoOscuro ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)';
  const claseInput   = modoOscuro ? 'bg-secondary text-light border-secondary' : '';
  const claseModal   = modoOscuro ? 'bg-dark text-light' : 'bg-white text-dark';

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

  const abrirModalAsignar = async (rutina) => {
    setRutinaAAsignar(rutina);
    setBusquedaUsuarioModal('');
    setModalAsignar(true);
    setCargandoUsuarios(true);
    try {
      const res = await api.get('/usuarios');
      setUsuariosLista(res.data);
    } catch (e) {
      setError('No se pudo cargar la lista de usuarios.');
    } finally {
      setCargandoUsuarios(false);
    }
  };

  const confirmarAsignacion = async (usuario) => {
    if (!window.confirm(`¿Asignar "${rutinaAAsignar.nombreRutina}" a ${usuario.nom_usuario}?`)) return;
    try {
      const resHistorial = await api.get(`/rutina-usuario/usuario/${usuario.id_usuario}`);
      const rutinasActivas = resHistorial.data.filter(r => r.activo === true);
      for (let rutina of rutinasActivas) {
        const rutinaDesactivada = { ...rutina, activo: false, fechaFin: new Date().toISOString().split('T')[0] };
        await api.put(`/rutina-usuario/${rutina.idRutinaUsuario}`, rutinaDesactivada);
      }
      const payload = {
        idRutina: rutinaAAsignar.idRutina,
        idUsuario: usuario.id_usuario,
        fechaInicio: new Date().toISOString().split('T')[0],
        activo: true
      };
      await api.post('/rutina-usuario', payload);
      alert(` Rutina asignada a ${usuario.nom_usuario} con éxito.`);
      setModalAsignar(false);
    } catch (e) {
      console.error("Error al re-asignar rutina:", e);
      setError('Ocurrió un error al cambiar la rutina. Revisa la consola del navegador (F12).');
    }
  };

  const usuariosFiltradosModal = usuariosLista.filter(u =>
    u.nom_usuario?.toLowerCase().includes(busquedaUsuarioModal.toLowerCase()) ||
    u.correo?.toLowerCase().includes(busquedaUsuarioModal.toLowerCase())
  );

  const abrirModalNuevaRutina = () => {
    setEditandoRutina(null);
    setFormRutina({ nombreRutina: '', descripcion: '', activoCatalogo: true });
    setModalRutina(true);
  };

  const abrirModalEditarRutina = (rutina) => {
    setEditandoRutina(rutina);
    setFormRutina({
      nombreRutina:    rutina.nombreRutina  ?? '',
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

  const abrirModalEjercicios = async (rutina) => {
    setRutinaSeleccionada(rutina);
    setModalEjercicios(true);
    setCargandoEjer(true);
    try {
      const res = await api.get(`/rutina-ejercicio/rutina/${rutina.idRutina}`);
      setEjerciciosRutina(res.data);
      const maxDia = res.data.reduce((max, e) => (e.dia > max ? e.dia : max), 3);
      setDiasSemana(maxDia < 3 ? 3 : maxDia);
    } catch {
      setError('No se pudieron cargar los ejercicios.');
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

  const abrirModalAgregarEjer = (dia) => {
    setBusquedaEjer('');
    setFiltroMusculo('');
    setFiltroZona('');
    setFiltroImplemento('');
    setFiltroDificultad('');
    const proxOrden = ejerciciosRutina.filter(e => e.dia === dia).length + 1;
    setFormEjercicioRut({ idEjercicio: '', dia: dia, orden: proxOrden, series: 3, repeticiones: 10, tiempoSeg: '', pesoReferencia: '' });
    setModalAgregarEjer(true);
  };

  const agregarEjercicioARutina = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        idRutina:        rutinaSeleccionada.idRutina,
        idEjercicio:     parseInt(formEjercicioRut.idEjercicio),
        dia:             parseInt(formEjercicioRut.dia),
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

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const sourceDia = parseInt(source.droppableId.split('-')[1]);
    const destDia = parseInt(destination.droppableId.split('-')[1]);
    let items = Array.from(ejerciciosRutina);
    let sourceItems = items.filter(e => (e.dia || 1) === sourceDia).sort((a,b) => a.orden - b.orden);
    let destItems = sourceDia === destDia ? sourceItems : items.filter(e => (e.dia || 1) === destDia).sort((a,b) => a.orden - b.orden);
    const [reorderedItem] = sourceItems.splice(source.index, 1);
    reorderedItem.dia = destDia;
    destItems.splice(destination.index, 0, reorderedItem);
    sourceItems.forEach((item, index) => { item.orden = index + 1; });
    if (sourceDia !== destDia) { destItems.forEach((item, index) => { item.orden = index + 1; }); }
    const otherItems = items.filter(e => (e.dia || 1) !== sourceDia && (e.dia || 1) !== destDia);
    const finalItems = [...otherItems, ...sourceItems];
    if (sourceDia !== destDia) finalItems.push(...destItems);
    setEjerciciosRutina(finalItems);
    try {
      const itemsToUpdate = sourceDia === destDia ? sourceItems : [...sourceItems, ...destItems];
      await api.put('/rutina-ejercicio/bulk', itemsToUpdate);
    } catch (error) {
      console.error("Error al guardar el orden", error);
      setError("No se pudo guardar el nuevo orden en la base de datos.");
    }
  };

  const obtenerNombreEjercicio = (e) => e?.nombreEjercicio ?? '';
  const nombreEjercicio = (idEjercicio) => {
    const e = ejercicios.find(e => e.id_ejercicio === idEjercicio || e.idEjercicio === idEjercicio);
    return obtenerNombreEjercicio(e) || `Ejercicio #${idEjercicio}`;
  };

  const ejerciciosFiltrados = ejercicios.filter(e => {
    const nombre     = obtenerNombreEjercicio(e).toLowerCase();
    const musculo    = (e.musculoObjetivo ?? '').toLowerCase();
    const zona       = (e.zonaMuscular    ?? '').toLowerCase();
    const implemento = (e.implemento      ?? '').toLowerCase();
    const nivel      = (e.nivelDificultad ?? '').toLowerCase();
    return (
      (!busquedaEjer     || nombre.includes(busquedaEjer.toLowerCase())) &&
      (!filtroMusculo    || musculo    === filtroMusculo.toLowerCase()) &&
      (!filtroZona       || zona       === filtroZona.toLowerCase()) &&
      (!filtroImplemento || implemento === filtroImplemento.toLowerCase()) &&
      (!filtroDificultad || nivel      === filtroDificultad.toLowerCase())
    );
  });

  const ejerciciosFiltradosLista = ejercicios.filter((e) => {
    const texto = [e.nombreEjercicio, e.musculoObjetivo, e.zonaMuscular, e.nivelDificultad, e.implemento, e.activoCatalogo ? 'activo' : 'inactivo'].join(' ').toLowerCase();
    return texto.includes(busquedaEjercicios.trim().toLowerCase());
  });

  const abrirModalNuevoEjercicio = () => {
    setEditandoEjercicio(null);
    setFormNuevoEjer({ nombre_ejercicio: '', descripcion: '', musculo_objetivo: '', zona_muscular: '', implemento: '', nivel_dificultad: 'Principiante', imagen_ejercicio: '', video_ejercicio: '', activo_catalogo: true });
    setModalNuevoEjer(true);
  };
  const abrirModalEditarEjercicio = (ejercicio) => {
    setEditandoEjercicio(ejercicio);
    setFormNuevoEjer({ nombre_ejercicio: ejercicio.nombreEjercicio ?? '', descripcion: ejercicio.descripcion ?? '', musculo_objetivo: ejercicio.musculoObjetivo ?? '', zona_muscular: ejercicio.zonaMuscular ?? '', implemento: ejercicio.implemento ?? '', nivel_dificultad: ejercicio.nivelDificultad ?? 'Principiante', imagen_ejercicio: ejercicio.imagenEjercicio ?? '', video_ejercicio: ejercicio.videoEjercicio ?? '', activo_catalogo: ejercicio.activoCatalogo ?? true });
    setModalNuevoEjer(true);
  };
  const abrirModalVerEjercicio = (ejercicio) => { setVideoReproduciendo(false); setEjercicioSeleccionado(ejercicio); setModalVerEjer(true); };

  const guardarEjercicio = async (e) => {
    e.preventDefault();
    try {
      const payload = { nombreEjercicio: formNuevoEjer.nombre_ejercicio, descripcion: formNuevoEjer.descripcion, musculoObjetivo: formNuevoEjer.musculo_objetivo, zonaMuscular: formNuevoEjer.zona_muscular, implemento: formNuevoEjer.implemento, nivelDificultad: formNuevoEjer.nivel_dificultad, imagenEjercicio: formNuevoEjer.imagen_ejercicio, videoEjercicio: formNuevoEjer.video_ejercicio, activoCatalogo: formNuevoEjer.activo_catalogo };
      if (editandoEjercicio) {
        const id = editandoEjercicio.idEjercicio ?? editandoEjercicio.id_ejercicio ?? editandoEjercicio.id;
        await api.put(`/ejercicios/${id}`, payload);
      } else { await api.post('/ejercicios', payload); }
      await cargarEjercicios();
      setModalNuevoEjer(false);
    } catch { setError('No se pudo guardar el ejercicio.'); }
  };

  const eliminarEjercicio = async (idEjercicio) => {
    if(!window.confirm("¿Estás seguro de eliminar este ejercicio del catálogo?")) return;
    try {
      await api.delete(`/ejercicios/${idEjercicio}`);
      await cargarEjercicios();
    } catch { setError('No se pudo eliminar el ejercicio'); }
  };

  const hayFiltrosActivos = filtroMusculo || filtroZona || filtroImplemento || filtroDificultad;
  const limpiarFiltros = () => {
    setFiltroMusculo('');
    setFiltroZona('');
    setFiltroImplemento('');
    setFiltroDificultad('');
  };

  return (
    <div className={`flup-main-content min-vh-100 ${claseTexto}`} style={{ backgroundColor: fondoPantalla }}>
      <MenuNavegacion modoOscuro={modoOscuro} />
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold m-0">Administrar Rutinas</h2>
          <div className="d-flex gap-2">
            <Button variant="outline-info" className="fw-bold" onClick={abrirModalNuevoEjercicio}>+ Nuevo Ejercicio</Button>
            <Button variant="primary" className="fw-bold" onClick={abrirModalNuevaRutina}>+ Nueva Rutina</Button>
          </div>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        <div className="mb-4 d-flex gap-2">
          <Button variant={vista === 'rutinas' ? 'primary' : 'outline-primary'} className="fw-bold" onClick={() => setVista('rutinas')}>Rutinas</Button>
          <Button variant={vista === 'ejercicios' ? 'primary' : 'outline-primary'} className="fw-bold" onClick={() => setVista('ejercicios')}>Ejercicios</Button>
        </div>

        <Card className={claseTarjeta}>
          <Card.Body>
            {vista === 'rutinas' ? (
              cargando ? ( <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div> ) : (
                <Table responsive striped bordered hover className={claseTabla}>
                  <thead><tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {rutinas.length > 0 ? rutinas.map((r) => (
                      <tr key={r.idRutina}>
                        <td className="fw-bold align-middle">{r.nombreRutina ?? '—'}</td>
                        <td className="text-truncate align-middle" style={{ maxWidth: 250 }}>{r.descripcion ?? '—'}</td>
                        <td className="align-middle"><Badge bg={r.activoCatalogo ? 'success' : 'secondary'}>{r.activoCatalogo ? 'Activa' : 'Inactiva'}</Badge></td>
                        <td className="align-middle text-center">
                          <Dropdown>
                            <Dropdown.Toggle
                              variant={modoOscuro ? 'outline-light' : 'outline-secondary'}
                              size="sm"
                              id={`acciones-rutina-${r.idRutina}`}
                            >
                              Acciones
                            </Dropdown.Toggle>
                            <Dropdown.Menu variant={modoOscuro ? 'dark' : undefined}>
                              <Dropdown.Item onClick={() => abrirModalAsignar(r)}>✅ Asignar</Dropdown.Item>
                              <Dropdown.Item onClick={() => abrirModalEjercicios(r)}>📋 Ver Ejercicios</Dropdown.Item>
                              <Dropdown.Item onClick={() => abrirModalEditarRutina(r)}>✏️ Editar</Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger" onClick={() => eliminarRutina(r.idRutina)}>🗑️ Eliminar</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    )) : <tr><td colSpan="4" className="text-center py-4">No hay rutinas.</td></tr>}
                  </tbody>
                </Table>
              )
            ) : (
              cargando ? ( <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div> ) : (
                <>
                  <InputGroup className="mb-3">
                    <Form.Control placeholder="Buscar ejercicios..." value={busquedaEjercicios} onChange={(e) => setBusquedaEjercicios(e.target.value)} />
                    <Button variant="outline-secondary" onClick={() => setBusquedaEjercicios('')}>Limpiar</Button>
                  </InputGroup>
                  <Table responsive striped bordered hover className={claseTabla}>
                    <thead><tr><th>Nombre</th><th>Músculo objetivo</th><th>Zona</th><th>Implemento</th><th>Nivel</th><th>Activo</th><th>Acciones</th></tr></thead>
                    <tbody>
                      {ejerciciosFiltradosLista.length > 0 ? ejerciciosFiltradosLista.map((e) => (
                        <tr key={e.idEjercicio ?? e.id_ejercicio}>
                          <td className="fw-bold">{e.nombreEjercicio ?? '—'}</td>
                          <td>{e.musculoObjetivo ?? '—'}</td>
                          <td>{e.zonaMuscular ?? '—'}</td>
                          <td>{e.implemento ?? '—'}</td>
                          <td>{e.nivelDificultad ?? '—'}</td>
                          <td><Badge bg={e.activoCatalogo ? 'success' : 'secondary'}>{e.activoCatalogo ? 'Sí' : 'No'}</Badge></td>
                          <td className="text-center">
                            <Dropdown>
                              <Dropdown.Toggle
                                variant={modoOscuro ? 'outline-light' : 'outline-secondary'}
                                size="sm"
                                id={`acciones-ejercicio-${e.idEjercicio ?? e.id_ejercicio}`}
                              >
                                Acciones
                              </Dropdown.Toggle>
                              <Dropdown.Menu variant={modoOscuro ? 'dark' : undefined}>
                                <Dropdown.Item onClick={() => abrirModalVerEjercicio(e)}>👁️ Ver</Dropdown.Item>
                                <Dropdown.Item onClick={() => abrirModalEditarEjercicio(e)}>✏️ Editar</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item className="text-danger" onClick={() => eliminarEjercicio(e.idEjercicio ?? e.id_ejercicio)}>🗑️ Borrar</Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        </tr>
                      )) : <tr><td colSpan="7" className="text-center py-4">No hay ejercicios.</td></tr>}
                    </tbody>
                  </Table>
                </>
              )
            )}
          </Card.Body>
        </Card>

      {/* ════════ MODAL: Gestión de Ejercicios por Día (Drag & Drop) ════════ */}
      <Modal show={modalEjercicios} onHide={() => setModalEjercicios(false)} fullscreen className="modal-ejercicios-dnd">
        <div className={`h-100 ${modoOscuro ? 'bg-dark text-light' : 'bg-white text-dark'}`} style={{ overflowY: 'auto' }}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title>Ejercicios de: <span className="text-primary">{rutinaSeleccionada?.nombreRutina}</span></Modal.Title>
          </Modal.Header>
          <Modal.Body className={modoOscuro ? 'bg-dark' : 'bg-light'} style={{ padding: '2rem' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0">Organización de la Rutina</h5>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold">Columnas (Días):</span>
                <Button variant="outline-primary" size="sm" onClick={() => setDiasSemana(Math.max(1, diasSemana - 1))}>−</Button>
                <span className="fw-bold fs-5 mx-2">{diasSemana}</span>
                <Button variant="outline-primary" size="sm" onClick={() => setDiasSemana(Math.min(7, diasSemana + 1))}>+</Button>
                <span className="ms-2 text-muted fst-italic" style={{fontSize: '0.8rem'}}>(Columnas visuales. Días vacíos no se guardan)</span>
              </div>
            </div>
            {cargandoEjer ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="d-flex flex-wrap gap-4 align-items-start">
                  {Array.from({ length: diasSemana }).map((_, i) => {
                    const diaActual = i + 1;
                    const ejsDia = ejerciciosRutina.filter(e => (e.dia || 1) === diaActual).sort((a,b) => a.orden - b.orden);
                    return (
                      <div key={`dia-${diaActual}`} style={{ minWidth: '300px', flex: '1 1 300px' }}>
                        <Card className={`border shadow-sm h-100 ${modoOscuro ? 'bg-black border-secondary' : 'bg-white border-light'}`}>
                          <Card.Header className={`d-flex justify-content-between align-items-center py-2 ${modoOscuro ? 'bg-secondary text-white border-secondary' : 'bg-primary text-white'}`}>
                            <h6 className="m-0 fw-bold">Día {diaActual}</h6>
                            <Button variant={modoOscuro ? "dark" : "light"} size="sm" className={`fw-bold py-0 px-2 ${modoOscuro ? 'text-light border-light' : 'text-primary'}`} onClick={() => abrirModalAgregarEjer(diaActual)}>+</Button>
                          </Card.Header>
                          <Droppable droppableId={`dia-${diaActual}`}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.droppableProps} className="p-2"
                                style={{
                                  minHeight: '150px',
                                  backgroundColor: snapshot.isDraggingOver ? (modoOscuro ? '#2a2a2a' : '#e9ecef') : 'transparent',
                                  transition: 'background 0.2s'
                                }}>
                                {ejsDia.map((re, index) => (
                                  <Draggable key={String(re.idRutinaEjercicio)} draggableId={String(re.idRutinaEjercicio)} index={index}>
                                    {(provided, snapshot) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                        className={`card mb-2 border ${modoOscuro ? 'bg-dark text-light border-secondary' : 'bg-white border-light'}`}
                                        style={{ ...provided.draggableProps.style, boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div className="card-body p-2 position-relative">
                                          <div className="d-flex justify-content-between align-items-start">
                                            <div className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>
                                              <span className="me-2 text-muted">≡</span>
                                              {nombreEjercicio(re.idEjercicio)}
                                            </div>
                                            <Button variant="link" size="sm" className="text-danger p-0 ms-2" style={{textDecoration:'none'}} onClick={() => eliminarEjercicioDeRutina(re.idRutinaEjercicio)}>×</Button>
                                          </div>
                                          <div className="d-flex gap-2 text-muted" style={{ fontSize: '0.8rem' }}>
                                            <Badge bg="info">{re.series} x {re.repeticiones}</Badge>
                                            {re.tiempoSeg > 0 && <Badge bg="warning" text="dark">{re.tiempoSeg}s</Badge>}
                                            {re.pesoReferencia > 0 && <Badge bg="secondary">{re.pesoReferencia}kg</Badge>}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                {ejsDia.length === 0 && !snapshot.isDraggingOver && (
                                  <div className="text-center text-muted py-4" style={{border: `2px dashed ${modoOscuro ? '#444' : '#ccc'}`, borderRadius: '5px'}}>
                                    Arrastra o agrega ejercicios aquí
                                  </div>
                                )}
                              </div>
                            )}
                          </Droppable>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </DragDropContext>
            )}
          </Modal.Body>
        </div>
      </Modal>

      {/* ════════ MODAL: Asignar Rutina a Usuario ════════ */}
      <Modal show={modalAsignar} onHide={() => setModalAsignar(false)} centered>
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}><Modal.Title>Asignar Rutina</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Control type="text" placeholder="Buscar usuario..." value={busquedaUsuarioModal} onChange={(e) => setBusquedaUsuarioModal(e.target.value)} className={`mb-3 ${claseInput}`} />
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Table hover size="sm" className={claseTabla}>
                <tbody>
                  {usuariosFiltradosModal.map(u => (
                    <tr key={u.id_usuario}>
                      <td className={`align-middle fw-bold ${claseTexto}`}>{u.nom_usuario}</td>
                      <td className={`align-middle ${claseTexto}`}>{u.correo}</td>
                      <td className="align-middle text-end"><Button variant="outline-success" size="sm" onClick={() => confirmarAsignacion(u)}>Asignar</Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Modal.Body>
        </div>
      </Modal>

      {/* ════════ MODAL: Agregar Ejercicio a Rutina ════════ */}
      <Modal show={modalAgregarEjer} onHide={() => setModalAgregarEjer(false)} centered size="lg">
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title>Agregar Ejercicio — Día {formEjercicioRut.dia}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={agregarEjercicioARutina}>

              {/* ── Barra de búsqueda ── */}
              <InputGroup className="mb-2">
                <InputGroup.Text className={modoOscuro ? 'bg-secondary border-secondary text-light' : ''}>
                  
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar ejercicio por nombre..."
                  value={busquedaEjer}
                  onChange={e => setBusquedaEjer(e.target.value)}
                  className={claseInput}
                  autoFocus
                />
                {busquedaEjer && (
                  <Button variant="outline-secondary" onClick={() => setBusquedaEjer('')}>✕</Button>
                )}
              </InputGroup>

              {/* ── Filtros ── */}
              <Row className="mb-2 g-2">
                <Col xs={6} md={3}>
                  <Form.Select size="sm" className={claseInput} value={filtroMusculo} onChange={e => setFiltroMusculo(e.target.value)}>
                    <option value="">Músculo</option>
                    {['Abdominales','Glúteos','Isquiotibiales','Cuádriceps','Pecho','Espalda',
                      'Hombros','Bíceps','Tríceps','Pantorrillas','Antebrazos','Aductores',
                      'Abductores','Flexores de cadera','Erectores espinales','Dorsales','Trapecios']
                      .map(m => <option key={m} value={m}>{m}</option>)}
                  </Form.Select>
                </Col>
                <Col xs={6} md={3}>
                  <Form.Select size="sm" className={claseInput} value={filtroZona} onChange={e => setFiltroZona(e.target.value)}>
                    <option value="">Zona</option>
                    {['Tren superior','Tren inferior','Core','Cuerpo completo']
                      .map(z => <option key={z} value={z}>{z}</option>)}
                  </Form.Select>
                </Col>
                <Col xs={6} md={3}>
                  <Form.Select size="sm" className={claseInput} value={filtroImplemento} onChange={e => setFiltroImplemento(e.target.value)}>
                    <option value="">Implemento</option>
                    {['Peso corporal','Mancuerna','Mancuernas','Barra','Kettlebell','Kettlebells',
                      'Polea','Máquina','Banda elástica','Bandas elásticas','Balón medicinal',
                      'Balón de estabilidad','Banco','Barra de dominadas','Suspensión','Sin implemento']
                      .map(i => <option key={i} value={i}>{i}</option>)}
                  </Form.Select>
                </Col>
                <Col xs={6} md={3}>
                  <Form.Select size="sm" className={claseInput} value={filtroDificultad} onChange={e => setFiltroDificultad(e.target.value)}>
                    <option value="">Nivel</option>
                    {['Principiante','Ligero','Moderado','Intenso']
                      .map(n => <option key={n} value={n}>{n}</option>)}
                  </Form.Select>
                </Col>
              </Row>

              {/* Botón limpiar filtros */}
              {hayFiltrosActivos && (
                <div className="mb-2">
                  <Button variant="link" size="sm" className="p-0 text-muted text-decoration-none" onClick={limpiarFiltros}>
                    ✕ Limpiar filtros
                  </Button>
                </div>
              )}

              {/* Contador de resultados */}
              <div className={`mb-1 ${modoOscuro ? 'text-light' : 'text-muted'}`} style={{ fontSize: '0.8rem' }}>
                {ejerciciosFiltrados.length} ejercicio{ejerciciosFiltrados.length !== 1 ? 's' : ''} encontrado{ejerciciosFiltrados.length !== 1 ? 's' : ''}
              </div>

              {/* ── Lista seleccionable de ejercicios ── */}
              <div
                className={`mb-3 rounded border ${modoOscuro ? 'border-secondary' : 'border-secondary'}`}
                style={{ maxHeight: '230px', overflowY: 'auto' }}
              >
                {ejerciciosFiltrados.length === 0 ? (
                  <div className="text-center text-muted py-4 fst-italic" style={{ fontSize: '0.9rem' }}>
                    No se encontraron ejercicios con esos filtros.
                  </div>
                ) : (
                  ejerciciosFiltrados.map(e => {
                    const id = e.id_ejercicio ?? e.idEjercicio;
                    const seleccionado = String(formEjercicioRut.idEjercicio) === String(id);
                    const meta = [e.musculoObjetivo, e.zonaMuscular, e.implemento, e.nivelDificultad].filter(Boolean).join(' · ');
                    return (
                      <div
                        key={id}
                        onClick={() => setFormEjercicioRut({ ...formEjercicioRut, idEjercicio: id })}
                        style={{
                          cursor: 'pointer',
                          borderLeft: seleccionado ? '3px solid #0d6efd' : '3px solid transparent',
                          backgroundColor: seleccionado
                            ? (modoOscuro ? 'rgba(13,110,253,0.2)' : 'rgba(13,110,253,0.08)')
                            : 'transparent',
                          transition: 'background 0.15s',
                          padding: '8px 12px',
                        }}
                        onMouseEnter={ev => {
                          if (!seleccionado) ev.currentTarget.style.backgroundColor = modoOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                        }}
                        onMouseLeave={ev => {
                          if (!seleccionado) ev.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold" style={{ fontSize: '0.88rem' }}>
                              {obtenerNombreEjercicio(e)}
                            </div>
                            {meta && (
                              <div className="text-muted" style={{ fontSize: '0.76rem' }}>{meta}</div>
                            )}
                          </div>
                          {seleccionado && <Badge bg="primary" className="ms-2">✓</Badge>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Ejercicio seleccionado actualmente */}
              {formEjercicioRut.idEjercicio && (
                <Alert variant={modoOscuro ? 'secondary' : 'light'} className="py-2 px-3 mb-3 border" style={{ fontSize: '0.85rem' }}>
                  <strong>Seleccionado:</strong>{' '}
                  {obtenerNombreEjercicio(
                    ejercicios.find(e => String(e.id_ejercicio ?? e.idEjercicio) === String(formEjercicioRut.idEjercicio))
                  )}
                </Alert>
              )}

              {/* ── Parámetros del ejercicio ── */}
              <Row>
                <Col xs={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Series</Form.Label>
                    <Form.Control type="number" required min={1} className={claseInput}
                      value={formEjercicioRut.series}
                      onChange={e => setFormEjercicioRut({ ...formEjercicioRut, series: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Reps</Form.Label>
                    <Form.Control type="number" required min={1} className={claseInput}
                      value={formEjercicioRut.repeticiones}
                      onChange={e => setFormEjercicioRut({ ...formEjercicioRut, repeticiones: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tiempo (s)</Form.Label>
                    <Form.Control type="number" min={0} className={claseInput}
                      value={formEjercicioRut.tiempoSeg}
                      onChange={e => setFormEjercicioRut({ ...formEjercicioRut, tiempoSeg: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Peso (kg)</Form.Label>
                    <Form.Control type="number" step="0.5" min={0} className={claseInput}
                      value={formEjercicioRut.pesoReferencia}
                      onChange={e => setFormEjercicioRut({ ...formEjercicioRut, pesoReferencia: e.target.value })} />
                  </Form.Group>
                </Col>
              </Row>

              <Button
                variant="success"
                type="submit"
                className="w-100 mt-1"
                disabled={!formEjercicioRut.idEjercicio}
              >
                {formEjercicioRut.idEjercicio
                  ? `Agregar al Día ${formEjercicioRut.dia}`
                  : 'Selecciona un ejercicio primero'}
              </Button>
            </Form>
          </Modal.Body>
        </div>
      </Modal>

      {/* ════════ MODAL: Crear/Editar Rutina ════════ */}
      <Modal show={modalRutina} onHide={() => setModalRutina(false)} centered>
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}><Modal.Title>{editandoRutina ? 'Editar Rutina' : 'Nueva Rutina'}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form onSubmit={guardarRutina}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre de la Rutina</Form.Label>
                <Form.Control type="text" required placeholder="Ej: Fuerza Total 5 días" className={claseInput} value={formRutina.nombreRutina} onChange={e => setFormRutina({ ...formRutina, nombreRutina: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control as="textarea" rows={3} placeholder="Descripción breve..." className={claseInput} value={formRutina.descripcion} onChange={e => setFormRutina({ ...formRutina, descripcion: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Check type="switch" label="Activa en catálogo" checked={formRutina.activoCatalogo} onChange={e => setFormRutina({ ...formRutina, activoCatalogo: e.target.checked })} />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setModalRutina(false)}>Cancelar</Button>
                <Button variant="primary" type="submit">{editandoRutina ? 'Guardar Cambios' : 'Crear Rutina'}</Button>
              </div>
            </Form>
          </Modal.Body>
        </div>
      </Modal>

      {/* ════════ MODAL: Crear Nuevo Ejercicio en Catálogo ════════ */}
      <Modal show={modalNuevoEjer} onHide={() => setModalNuevoEjer(false)} size="lg" centered>
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}><Modal.Title>{editandoEjercicio ? 'Editar Ejercicio' : 'Crear Nuevo Ejercicio'}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form onSubmit={guardarEjercicio}>
              <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Nombre del Ejercicio *</Form.Label><Form.Control required type="text" placeholder="Ej: Press de Banca" className={claseInput} value={formNuevoEjer.nombre_ejercicio} onChange={e => setFormNuevoEjer({ ...formNuevoEjer, nombre_ejercicio: e.target.value })} /></Form.Group></Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nivel de Dificultad</Form.Label>
                    <Form.Select value={formNuevoEjer.nivel_dificultad} className={claseInput} onChange={e => setFormNuevoEjer({ ...formNuevoEjer, nivel_dificultad: e.target.value })}>
                      <option value="Principiante">Principiante</option><option value="Ligero">Ligero</option><option value="Moderado">Moderado</option><option value="Intenso">Intenso</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Músculo Objetivo</Form.Label>
                    <Form.Select value={formNuevoEjer.musculo_objetivo} className={claseInput} onChange={e => setFormNuevoEjer({ ...formNuevoEjer, musculo_objetivo: e.target.value })}>
                      <option value="">— Selecciona —</option>
                      {['Abdominales','Glúteos','Isquiotibiales','Cuádriceps','Pecho','Espalda','Hombros','Bíceps','Tríceps','Pantorrillas','Antebrazos','Aductores','Abductores','Flexores de cadera','Erectores espinales','Dorsales','Trapecios'].map(m => <option key={m} value={m}>{m}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Zona Muscular</Form.Label>
                    <Form.Select value={formNuevoEjer.zona_muscular} className={claseInput} onChange={e => setFormNuevoEjer({ ...formNuevoEjer, zona_muscular: e.target.value })}>
                      <option value="">— Selecciona —</option>
                      {['Tren superior','Tren inferior','Core','Cuerpo completo'].map(z => <option key={z} value={z}>{z}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Implemento</Form.Label>
                    <Form.Select value={formNuevoEjer.implemento} className={claseInput} onChange={e => setFormNuevoEjer({ ...formNuevoEjer, implemento: e.target.value })}>
                      <option value="">— Selecciona —</option>
                      {['Peso corporal','Mancuerna','Mancuernas','Barra','Kettlebell','Kettlebells','Polea','Máquina','Banda elástica','Bandas elásticas','Balón medicinal','Balón de estabilidad','Banco','Barra de dominadas','Suspensión','Sin implemento'].map(i => <option key={i} value={i}>{i}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>URL Imagen <small className="text-muted">opcional</small></Form.Label><Form.Control type="text" placeholder="https://..." className={claseInput} value={formNuevoEjer.imagen_ejercicio} onChange={e => setFormNuevoEjer({ ...formNuevoEjer, imagen_ejercicio: e.target.value })} /></Form.Group></Col>
                <Col md={12}><Form.Group className="mb-3"><Form.Label>URL Video <small className="text-muted">opcional</small></Form.Label><Form.Control type="text" placeholder="https://youtube.com/..." className={claseInput} value={formNuevoEjer.video_ejercicio} onChange={e => setFormNuevoEjer({ ...formNuevoEjer, video_ejercicio: e.target.value })} /></Form.Group></Col>
                <Col md={12}><Form.Group className="mb-3"><Form.Label>Descripción</Form.Label><Form.Control as="textarea" rows={3} placeholder="Descripción del ejercicio..." className={claseInput} value={formNuevoEjer.descripcion} onChange={e => setFormNuevoEjer({ ...formNuevoEjer, descripcion: e.target.value })} /></Form.Group></Col>
                <Col md={6}><Form.Check type="switch" label="Activo en catálogo" className="mb-3" checked={formNuevoEjer.activo_catalogo} onChange={e => setFormNuevoEjer({ ...formNuevoEjer, activo_catalogo: e.target.checked })} /></Col>
              </Row>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setModalNuevoEjer(false)}>Cancelar</Button>
                <Button variant="primary" type="submit">{editandoEjercicio ? 'Actualizar Ejercicio' : 'Crear Ejercicio'}</Button>
              </div>
            </Form>
          </Modal.Body>
        </div>
      </Modal>

      {/* ════════ MODAL: Ver Detalle del Ejercicio ════════ */}
      <Modal show={modalVerEjer} onHide={() => { setModalVerEjer(false); setVideoReproduciendo(false); }} centered size="lg">
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title>Detalle del Ejercicio</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {ejercicioSeleccionado ? (() => {
              const videoUrl   = ejercicioSeleccionado.video_ejercicio  ?? ejercicioSeleccionado.videoEjercicio  ?? '';
              const imagenUrl  = ejercicioSeleccionado.imagen_ejercicio ?? ejercicioSeleccionado.imagenEjercicio ?? '';
              const nombre     = obtenerNombreEjercicio(ejercicioSeleccionado);
              const musculo    = ejercicioSeleccionado.musculo_objetivo  ?? ejercicioSeleccionado.musculoObjetivo  ?? '—';
              const zona       = ejercicioSeleccionado.zona_muscular     ?? ejercicioSeleccionado.zonaMuscular     ?? '—';
              const implemento = ejercicioSeleccionado.implemento        ?? '—';
              const nivel      = ejercicioSeleccionado.nivel_dificultad  ?? ejercicioSeleccionado.nivelDificultad  ?? '—';
              const activo     = ejercicioSeleccionado.activo_catalogo   ?? ejercicioSeleccionado.activoCatalogo   ?? false;
              const descripcion= ejercicioSeleccionado.descripcion       ?? '';

              // ── Extraer ID de YouTube ──────────────────────────────────────
              const getYoutubeId = (url) => {
                if (!url) return null;
                const regexps = [
                  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
                  /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
                ];
                for (const re of regexps) {
                  const m = url.match(re);
                  if (m) return m[1];
                }
                return null;
              };

              // ── Extraer ID de Vimeo ────────────────────────────────────────
              const getVimeoId = (url) => {
                if (!url) return null;
                const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                return m ? m[1] : null;
              };

              const youtubeId = getYoutubeId(videoUrl);
              const vimeoId   = !youtubeId ? getVimeoId(videoUrl) : null;
              const esVideoEmbebible = !!(youtubeId || vimeoId);

              const embedUrl = youtubeId
                ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`
                : vimeoId
                  ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1`
                  : '';

              const thumbnailUrl = youtubeId
                ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
                : '';

              const bordeSeccion = modoOscuro ? '1px solid #444' : '1px solid #dee2e6';
              const bgSeccion    = modoOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';

              return (
                <div className="d-flex flex-column gap-3">

                  {/* ── Nombre y descripción ── */}
                  <div>
                    <h5 className="fw-bold mb-1">{nombre}</h5>
                    {descripcion
                      ? <p className="mb-0 text-muted" style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>{descripcion}</p>
                      : <p className="mb-0 text-muted fst-italic" style={{ fontSize: '0.88rem' }}>Sin descripción</p>
                    }
                  </div>

                  {/* ── Ficha técnica ── */}
                  <div style={{ background: bgSeccion, border: bordeSeccion, borderRadius: 8, padding: '12px 16px' }}>
                    <Row className="g-2" style={{ fontSize: '0.88rem' }}>
                      <Col xs={6}>
                        <div className="text-muted mb-1" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Músculo objetivo</div>
                        <div className="fw-bold">{musculo}</div>
                      </Col>
                      <Col xs={6}>
                        <div className="text-muted mb-1" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zona muscular</div>
                        <div className="fw-bold">{zona}</div>
                      </Col>
                      <Col xs={6}>
                        <div className="text-muted mb-1" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Implemento</div>
                        <div className="fw-bold">{implemento}</div>
                      </Col>
                      <Col xs={6}>
                        <div className="text-muted mb-1" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nivel</div>
                        <div className="fw-bold">{nivel}</div>
                      </Col>
                      <Col xs={12} className="mt-1">
                        <Badge bg={activo ? 'success' : 'secondary'}>
                          {activo ? '✓ Activo en catálogo' : '✗ Inactivo en catálogo'}
                        </Badge>
                      </Col>
                    </Row>
                  </div>

                  {/* ── Imagen ── */}
                  {imagenUrl && (
                    <div>
                      <div className="text-muted mb-2" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Imagen</div>
                      <img src={imagenUrl} alt={nombre} className="img-fluid rounded w-100" style={{ maxHeight: 280, objectFit: 'cover' }} />
                    </div>
                  )}

                  {/* ── Sección de video ── */}
                  {videoUrl && (
                    <div>
                      <div className="text-muted mb-2" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Video</div>

                      {/* URL copiable */}
                      <div className="d-flex align-items-center gap-2 mb-2"
                        style={{ background: bgSeccion, border: bordeSeccion, borderRadius: 6, padding: '6px 10px', fontSize: '0.8rem' }}>
                        <span className="text-muted" style={{ flexShrink: 0 }}>🔗</span>
                        <span className="text-truncate flex-grow-1" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{videoUrl}</span>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          style={{ flexShrink: 0, fontSize: '0.75rem', padding: '2px 8px' }}
                          onClick={() => navigator.clipboard.writeText(videoUrl).then(() => alert('URL copiada'))}
                        >
                          Copiar
                        </Button>
                        <a href={videoUrl} target="_blank" rel="noreferrer">
                          <Button variant="outline-primary" size="sm" style={{ flexShrink: 0, fontSize: '0.75rem', padding: '2px 8px' }}>
                            Abrir ↗
                          </Button>
                        </a>
                      </div>

                      {/* Player / Miniatura */}
                      {esVideoEmbebible ? (
                        videoReproduciendo ? (
                          /* iframe embed */
                          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 8, overflow: 'hidden' }}>
                            <iframe
                              src={embedUrl}
                              title={nombre}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
                            />
                          </div>
                        ) : (
                          /* Miniatura clicable */
                          <div
                            onClick={() => setVideoReproduciendo(true)}
                            style={{ position: 'relative', cursor: 'pointer', borderRadius: 8, overflow: 'hidden', background: '#000' }}
                          >
                            {thumbnailUrl ? (
                              <img
                                src={thumbnailUrl}
                                alt="Miniatura del video"
                                className="w-100"
                                style={{ display: 'block', opacity: 0.85, maxHeight: 280, objectFit: 'cover' }}
                              />
                            ) : (
                              /* Vimeo: no miniatura pública disponible sin API, mostramos placeholder */
                              <div style={{ height: 160, background: modoOscuro ? '#1a1a2e' : '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Vista previa no disponible</span>
                              </div>
                            )}
                            {/* Botón play superpuesto */}
                            <div style={{
                              position: 'absolute', top: '50%', left: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: 64, height: 64, borderRadius: '50%',
                              background: 'rgba(220,50,50,0.92)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                              transition: 'transform 0.15s'
                            }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <polygon points="6,4 20,12 6,20" />
                              </svg>
                            </div>
                            {youtubeId && (
                              <div style={{
                                position: 'absolute', bottom: 8, left: 8,
                                background: 'rgba(0,0,0,0.7)', color: '#fff',
                                fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4
                              }}>
                                YouTube · Clic para reproducir
                              </div>
                            )}
                            {vimeoId && (
                              <div style={{
                                position: 'absolute', bottom: 8, left: 8,
                                background: 'rgba(0,0,0,0.7)', color: '#fff',
                                fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4
                              }}>
                                Vimeo · Clic para reproducir
                              </div>
                            )}
                          </div>
                        )
                      ) : (
                        /* URL no embebible: solo enlace */
                        <Alert variant="secondary" className="py-2 px-3 mb-0" style={{ fontSize: '0.85rem' }}>
                          Este video no puede previsualizarse aquí. Usa el botón <strong>Abrir ↗</strong> para verlo en su plataforma.
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Si no hay ni imagen ni video */}
                  {!imagenUrl && !videoUrl && (
                    <p className="text-muted fst-italic mb-0" style={{ fontSize: '0.88rem' }}>
                      Este ejercicio no tiene imagen ni video asociado.
                    </p>
                  )}

                </div>
              );
            })() : <p>No hay ejercicio seleccionado.</p>}
          </Modal.Body>
          <Modal.Footer className={modoOscuro ? 'border-secondary' : ''}>
            <Button variant="secondary" onClick={() => { setModalVerEjer(false); setVideoReproduciendo(false); }}>Cerrar</Button>
          </Modal.Footer>
        </div>
      </Modal>

    </div>
  );
};

export default Rutinas;
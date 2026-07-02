import { useState, useEffect } from 'react';
import { Container, Table, Button, Card, Modal, Form, Spinner, Alert, Badge, Dropdown } from 'react-bootstrap';
import MenuNavegacion from '../components/MenuNavegacion';
import api from '../services/api';

const colorTipo = (nombre) => {
  switch (nombre?.toLowerCase()) {
    case 'vegana': return 'success';
    case 'vegetariana': return 'info';
    case 'keto': return 'danger';
    default: return 'warning';
  }
};

const Recomendaciones = ({ modoOscuro }) => {
  const [comidas, setComidas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalReceta, setModalReceta] = useState(false);
  const [recetaActiva, setRecetaActiva] = useState(null);
  const [editandoReceta, setEditandoReceta] = useState(false);

  const [modalNueva, setModalNueva] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    nombre_comida: '', descripcion_comida: '', cantidad_porcion: '100g',
    calorias_porcion: '', proteina_porcion: '', carbohidratos_porcion: '',
    grasa_porcion: '', id_tipo_alimentacion: ''
  });

  const claseTexto = modoOscuro ? 'text-light' : 'text-dark';
  const claseTarjeta = modoOscuro ? 'bg-dark text-light border-secondary' : 'bg-white text-dark shadow-sm';
  const claseTabla = modoOscuro ? 'table-dark' : 'table-light';
  const fondoPantalla = modoOscuro ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)';
  const claseInput = modoOscuro ? 'bg-secondary text-light border-secondary' : '';
  const claseModal = modoOscuro ? 'bg-dark text-light' : 'bg-white text-dark';

  useEffect(() => {
    const cargar = async () => {
      try {
        console.log('[Recomendaciones] Iniciando carga...');
        const [resComidas, resTipos] = await Promise.all([
          api.get('/nutricion/recetas-cache'),
          api.get('/nutricion/tipos-dieta'),
        ]);
        console.log('[Recomendaciones] comidas raw:', resComidas);
        console.log('[Recomendaciones] comidas data:', resComidas.data);
        console.log('[Recomendaciones] tipos raw:', resTipos);
        console.log('[Recomendaciones] tipos data:', resTipos.data);
        setComidas(resComidas.data);
        setTipos(resTipos.data);
      } catch (err) {
        console.error('[Recomendaciones] Error al cargar:', err);
        console.error('[Recomendaciones] err.response:', err?.response);
        console.error('[Recomendaciones] err.response.data:', err?.response?.data);
        console.error('[Recomendaciones] err.response.status:', err?.response?.status);
        console.error('[Recomendaciones] err.message:', err?.message);
        setError(`Error al cargar: ${err?.response?.status ?? ''} ${err?.message ?? 'desconocido'} — revisa la consola (F12) para más detalles.`);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const abrirReceta = (comida) => {
    setRecetaActiva({ ...comida });
    setEditandoReceta(false);
    setModalReceta(true);
  };

  const guardarRecetaEditada = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...recetaActiva,
        tipo_alimentacion: { id_tipo_alimentacion: recetaActiva.tipo_alimentacion?.id_tipo_alimentacion }
      };
      const res = await api.put(`/nutricion/recetas-cache/${recetaActiva.id}`, payload);
      setComidas(comidas.map(c => c.id === recetaActiva.id ? res.data : c));
      setEditandoReceta(false);
      setModalReceta(false);
    } catch {
      setError('No se pudo guardar los cambios.');
    }
  };

  const resetForm = () => setForm({
    nombre_comida: '', descripcion_comida: '', cantidad_porcion: '100g',
    calorias_porcion: '', proteina_porcion: '', carbohidratos_porcion: '',
    grasa_porcion: '', id_tipo_alimentacion: tipos[0]?.id_tipo_alimentacion ?? ''
  });

  const abrirModalNueva = () => {
    setEditandoId(null);
    resetForm();
    setModalNueva(true);
  };

  const abrirModalEditar = (comida) => {
    setEditandoId(comida.id_comida);
    setForm({
      nombre_comida: comida.nombre_comida ?? '',
      descripcion_comida: comida.descripcion_comida ?? '',
      cantidad_porcion: comida.cantidad_porcion ?? '100g',
      calorias_porcion: comida.calorias_porcion ?? '',
      proteina_porcion: comida.proteina_porcion ?? '',
      carbohidratos_porcion: comida.carbohidratos_porcion ?? '',
      grasa_porcion: comida.grasa_porcion ?? '',
      id_tipo_alimentacion: comida.tipo_alimentacion?.id_tipo_alimentacion ?? ''
    });
    setModalNueva(true);
  };

  const guardarComida = async (e) => {
    e.preventDefault();
    const tipoSeleccionado = tipos.find(t => t.id_tipo_alimentacion === parseInt(form.id_tipo_alimentacion));
    const payload = {
      nombre_comida: form.nombre_comida,
      descripcion_comida: form.descripcion_comida,
      cantidad_porcion: form.cantidad_porcion,
      calorias_porcion: parseFloat(form.calorias_porcion),
      proteina_porcion: parseFloat(form.proteina_porcion),
      carbohidratos_porcion: parseFloat(form.carbohidratos_porcion),
      grasa_porcion: parseFloat(form.grasa_porcion),
      tipo_alimentacion: tipoSeleccionado ? { id_tipo_alimentacion: tipoSeleccionado.id_tipo_alimentacion } : null
    };
    try {
      if (editandoId) {
        const res = await api.put(`/nutricion/comidas/${editandoId}`, payload);
        setComidas(comidas.map(c => c.id_comida === editandoId ? res.data : c));
      } else {
        const res = await api.post('/nutricion/comidas', payload);
        setComidas([...comidas, res.data]);
      }
      setModalNueva(false);
    } catch {
      setError('No se pudo guardar la recomendación.');
    }
  };

  const eliminarComida = async (id) => {
    if (!window.confirm('¿Eliminar esta recomendación?')) return;
    try {
      await api.delete(`/nutricion/recetas-cache/${id}`);
      setComidas(comidas.filter(c => c.id !== id));
    } catch {
      setError('No se pudo eliminar la recomendación.');
    }
  };

  return (
    <div className={`flup-main-content min-vh-100 ${claseTexto}`} style={{ backgroundColor: fondoPantalla }}>
      <MenuNavegacion modoOscuro={modoOscuro} />

      <div className="w-100">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold m-0">Administrar Recomendaciones</h2>
          <Button variant="primary" className="fw-bold" onClick={abrirModalNueva}>
            + Nueva Recomendación
          </Button>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        {/* ── Panel de diagnóstico (solo en desarrollo) ── */}
        {import.meta.env.DEV && (
          <Alert variant="info" className="mb-3" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
            <strong> Debug:</strong> comidas cargadas: <strong>{comidas.length}</strong> |
            tipos cargados: <strong>{tipos.length}</strong> |
            endpoints: <code>/nutricion/comidas</code>, <code>/nutricion/tipos-dieta</code>
            <br />
            <Button size="sm" variant="outline-info" className="mt-1" onClick={async () => {
              try {
                const res = await api.get('/nutricion/comidas');
                alert(`Status: ${res.status}\nItems: ${res.data?.length ?? '?'}\nPrimero: ${JSON.stringify(res.data?.[0] ?? {}, null, 2)}`);
              } catch (e) {
                alert(`ERROR: ${e?.response?.status} ${e?.message}\n${JSON.stringify(e?.response?.data ?? {})}`);
              }
            }}>Probar /nutricion/comidas</Button>
            {' '}
            <Button size="sm" variant="outline-info" className="mt-1" onClick={async () => {
              try {
                const res = await api.get('/nutricion/tipos-dieta');
                alert(`Status: ${res.status}\nItems: ${res.data?.length ?? '?'}\nData: ${JSON.stringify(res.data ?? [], null, 2)}`);
              } catch (e) {
                alert(`ERROR: ${e?.response?.status} ${e?.message}\n${JSON.stringify(e?.response?.data ?? {})}`);
              }
            }}>Probar /nutricion/tipos-dieta</Button>
          </Alert>
        )}

        <Card className={`${claseTarjeta} w-100`}>
          <Card.Body className="p-0 p-md-3">
            {cargando ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Cargando recomendaciones...</p>
              </div>
            ) : (
              <div style={{ width: '100%', overflowX: 'scroll', maxHeight: '480px', overflowY: 'auto' }}>
                <Table striped bordered hover className={`${claseTabla} w-100 align-middle mb-0`}>
                  <thead>
                    <tr>
                      <th>Nombre del Plato</th>
                      <th>Acciones</th>
                      <th>Calorías</th>
                      <th>Proteínas (g)</th>
                      <th>Carbohidratos (g)</th>
                      <th>Grasas (g)</th>
                      <th>Porción</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comidas.length > 0 ? comidas.map((c) => (
                      <tr key={c.id}>
                        <td className="fw-bold">{c.nombre_comida}</td>
                        <td className="text-center">
                          <Dropdown>
                            <Dropdown.Toggle
                              variant={modoOscuro ? 'outline-light' : 'outline-secondary'}
                              size="sm"
                              id={`acciones-comida-${c.id}`}
                            >
                              Acciones
                            </Dropdown.Toggle>
                            <Dropdown.Menu variant={modoOscuro ? 'dark' : undefined}>
                              <Dropdown.Item onClick={() => abrirReceta(c)}> Ver</Dropdown.Item>
                              <Dropdown.Item onClick={() => abrirModalEditar(c)}> Editar</Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger" onClick={() => eliminarComida(c.id)}> Borrar</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                        <td>{c.calorias_porcion ?? '—'} kcal</td>
                        <td className="text-info fw-bold">{c.proteina_porcion ?? '—'}</td>
                        <td className="text-warning fw-bold">{c.carbohidratos_porcion ?? '—'}</td>
                        <td className="text-danger fw-bold">{c.grasa_porcion ?? '—'}</td>
                        <td>{c.cantidad_porcion ?? '—'}</td>
                        <td>
                          <Badge bg={colorTipo(c.tipo_alimentacion?.nombre_tipo)}>
                            {c.tipo_alimentacion?.nombre_tipo ?? '—'}
                          </Badge>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          No hay recomendaciones registradas.
                          {import.meta.env.DEV && (
                            <div className="mt-2 text-muted" style={{ fontSize: '0.8rem' }}>
                              Si esperas datos, abre F12 → Consola y revisa los logs <code>[Recomendaciones]</code>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* ══ MODAL: Ver Receta ══════════════════════════════════════════════════ */}
      <Modal show={modalReceta} onHide={() => setModalReceta(false)} centered size="lg">
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title>
              {editandoReceta ? ' Editando Receta' : ' Detalle de Receta'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {recetaActiva && (
              editandoReceta ? (
                <Form onSubmit={guardarRecetaEditada}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre del Plato</Form.Label>
                    <Form.Control type="text" required className={claseInput}
                      value={recetaActiva.nombre_comida}
                      onChange={e => setRecetaActiva({ ...recetaActiva, nombre_comida: e.target.value })} />
                  </Form.Group>

                  {/* ── Ingredientes ── */}
                  <Form.Group className="mb-3">
                    <Form.Label> Ingredientes <small className="text-muted">(uno por línea)</small></Form.Label>
                    <Form.Control as="textarea" rows={4} className={claseInput}
                      value={(() => {
                        try { return JSON.parse(recetaActiva.ingredientes_json || '[]').join('\n'); }
                        catch { return ''; }
                      })()}
                      onChange={e => setRecetaActiva({
                        ...recetaActiva,
                        ingredientes_json: JSON.stringify(e.target.value.split('\n').filter(l => l.trim() !== ''))
                      })} />
                  </Form.Group>

                  {/* ── Preparación ── */}
                  <Form.Group className="mb-3">
                    <Form.Label> Preparación <small className="text-muted">(un paso por línea)</small></Form.Label>
                    <Form.Control as="textarea" rows={5} className={claseInput}
                      value={(() => {
                        try { return JSON.parse(recetaActiva.preparacion_json || '[]').join('\n'); }
                        catch { return ''; }
                      })()}
                      onChange={e => setRecetaActiva({
                        ...recetaActiva,
                        preparacion_json: JSON.stringify(e.target.value.split('\n').filter(l => l.trim() !== ''))
                      })} />
                  </Form.Group>

                  <div className="row g-3 mb-3">
                    {[
                      ['calorias_porcion', 'Calorías (kcal)'],
                      ['proteina_porcion', 'Proteínas (g)'],
                      ['carbohidratos_porcion', 'Carbohidratos (g)'],
                      ['grasa_porcion', 'Grasas (g)'],
                    ].map(([field, label]) => (
                      <div key={field} className="col-md-3">
                        <Form.Group>
                          <Form.Label>{label}</Form.Label>
                          <Form.Control type="number" min="0" step="0.1" className={claseInput}
                            value={recetaActiva[field] ?? ''}
                            onChange={e => setRecetaActiva({ ...recetaActiva, [field]: e.target.value })} />
                        </Form.Group>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => setEditandoReceta(false)}>Cancelar</Button>
                    <Button variant="success" type="submit">Guardar Cambios</Button>
                  </div>
                </Form>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h4 className="fw-bold mb-1">{recetaActiva.nombre_comida}</h4>
                      <Badge bg={colorTipo(recetaActiva.tipo_alimentacion?.nombre_tipo)}>
                        {recetaActiva.tipo_alimentacion?.nombre_tipo ?? '—'}
                      </Badge>
                    </div>
                    <Button variant="outline-warning" size="sm" className="fw-bold"
                      onClick={() => setEditandoReceta(true)}> Editar</Button>
                  </div>
                  <div className="row text-center mb-4">
                    {[
                      { label: 'Calorías', value: `${recetaActiva.calorias_porcion ?? '—'} kcal`, color: 'text-primary' },
                      { label: 'Proteínas', value: `${recetaActiva.proteina_porcion ?? '—'} g`, color: 'text-info' },
                      { label: 'Carbohidratos', value: `${recetaActiva.carbohidratos_porcion ?? '—'} g`, color: 'text-warning' },
                      { label: 'Grasas', value: `${recetaActiva.grasa_porcion ?? '—'} g`, color: 'text-danger' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="col-3">
                        <div className={`${modoOscuro ? 'bg-secondary' : 'bg-light'} rounded p-2`}>
                          <div className="small text-muted">{label}</div>
                          <div className={`fw-bold fs-5 ${color}`}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Ingredientes ── */}
                  <div className={`p-3 rounded mb-3 ${modoOscuro ? 'bg-secondary' : 'bg-light'}`}>
                    <h6 className="fw-bold mb-2"> Ingredientes</h6>
                    {(() => {
                      try {
                        const lista = JSON.parse(recetaActiva.ingredientes_json || '[]');
                        return lista.length > 0
                          ? <ul className="mb-0 ps-3">{lista.map((ing, i) => <li key={i}>{ing}</li>)}</ul>
                          : <p className="mb-0 text-muted fst-italic">Sin ingredientes registrados.</p>;
                      } catch {
                        return <p className="mb-0 text-muted fst-italic">Sin ingredientes registrados.</p>;
                      }
                    })()}
                  </div>

                  {/* ── Preparación ── */}
                  <div className={`p-3 rounded ${modoOscuro ? 'bg-secondary' : 'bg-light'}`}>
                    <h6 className="fw-bold mb-2"> Preparación</h6>
                    {(() => {
                      try {
                        const pasos = JSON.parse(recetaActiva.preparacion_json || '[]');
                        return pasos.length > 0
                          ? <ol className="mb-0 ps-3">{pasos.map((paso, i) => <li key={i} className="mb-1">{paso}</li>)}</ol>
                          : <p className="mb-0 text-muted fst-italic">Sin preparación registrada.</p>;
                      } catch {
                        return <p className="mb-0 text-muted fst-italic">Sin preparación registrada.</p>;
                      }
                    })()}
                  </div>

                  <div className="mt-2 text-muted small">
                    Porción: {recetaActiva.cantidad_porcion ?? '100g'}
                  </div>
                </>
              )
            )}
          </Modal.Body>
        </div>
      </Modal>

      {/* ══ MODAL: Nueva / Editar Recomendación ═══════════════════════════════ */}
      <Modal show={modalNueva} onHide={() => setModalNueva(false)} centered>
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title>{editandoId ? 'Editar Recomendación' : 'Nueva Recomendación'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={guardarComida}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre del Plato</Form.Label>
                <Form.Control type="text" required className={claseInput}
                  value={form.nombre_comida}
                  onChange={e => setForm({ ...form, nombre_comida: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Alimentación</Form.Label>
                <Form.Select className={claseInput} value={form.id_tipo_alimentacion}
                  onChange={e => setForm({ ...form, id_tipo_alimentacion: e.target.value })}>
                  <option value="">— Selecciona —</option>
                  {tipos.map(t => (
                    <option key={t.id_tipo_alimentacion} value={t.id_tipo_alimentacion}>
                      {t.nombre_tipo}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Descripción / Receta</Form.Label>
                <Form.Control as="textarea" rows={3} className={claseInput}
                  value={form.descripcion_comida}
                  onChange={e => setForm({ ...form, descripcion_comida: e.target.value })} />
              </Form.Group>
              <div className="row g-3 mb-3">
                {[
                  ['calorias_porcion', 'Calorías (kcal)'],
                  ['proteina_porcion', 'Proteínas (g)'],
                  ['carbohidratos_porcion', 'Carbohidratos (g)'],
                  ['grasa_porcion', 'Grasas (g)'],
                ].map(([field, label]) => (
                  <div key={field} className="col-md-6">
                    <Form.Group>
                      <Form.Label>{label}</Form.Label>
                      <Form.Control type="number" min="0" step="0.1" className={claseInput}
                        value={form[field]}
                        onChange={e => setForm({ ...form, [field]: e.target.value })} />
                    </Form.Group>
                  </div>
                ))}
              </div>
              <Form.Group className="mb-4">
                <Form.Label>Cantidad por Porción</Form.Label>
                <Form.Control type="text" placeholder="Ej: 100g" className={claseInput}
                  value={form.cantidad_porcion}
                  onChange={e => setForm({ ...form, cantidad_porcion: e.target.value })} />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setModalNueva(false)}>Cancelar</Button>
                <Button variant="primary" type="submit">
                  {editandoId ? 'Guardar Cambios' : 'Crear Recomendación'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </div>
      </Modal>
    </div>
  );
};

export default Recomendaciones;
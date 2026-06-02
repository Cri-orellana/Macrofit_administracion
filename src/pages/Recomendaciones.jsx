import { useState, useEffect } from 'react';
import { Container, Table, Button, Card, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import MenuNavegacion from '../components/MenuNavegacion';
import api from '../services/api';

const colorTipo = (nombre) => {
  switch (nombre?.toLowerCase()) {
    case 'vegana':       return 'success';
    case 'vegetariana':  return 'info';
    case 'keto':         return 'danger';
    default:             return 'warning';
  }
};

const Recomendaciones = ({ modoOscuro }) => {
  const [comidas,   setComidas]   = useState([]);
  const [tipos,     setTipos]     = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');

  // Modal Ver Receta
  const [modalReceta,   setModalReceta]   = useState(false);
  const [recetaActiva,  setRecetaActiva]  = useState(null);
  const [editandoReceta, setEditandoReceta] = useState(false);

  // Modal Nueva Recomendación
  const [modalNueva,   setModalNueva]   = useState(false);
  const [editandoId,   setEditandoId]   = useState(null);
  const [form, setForm] = useState({
    nombre_comida: '', descripcion_comida: '', cantidad_porcion: '100g',
    calorias_porcion: '', proteina_porcion: '', carbohidratos_porcion: '',
    grasa_porcion: '', id_tipo_alimentacion: ''
  });

  const claseTexto   = modoOscuro ? 'text-light' : 'text-dark';
  const claseTarjeta = modoOscuro ? 'bg-dark text-light border-secondary' : 'bg-white text-dark shadow-sm';
  const claseTabla   = modoOscuro ? 'table-dark' : 'table-light';
  const fondoPantalla= modoOscuro ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)';
  const claseInput   = modoOscuro ? 'bg-secondary text-light border-secondary' : '';
  const claseModal   = modoOscuro ? 'bg-dark text-light' : 'bg-white text-dark';

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const [resComidas, resTipos] = await Promise.all([
          api.get('/nutricion/comidas'),
          api.get('/nutricion/tipos-dieta'),
        ]);
        setComidas(resComidas.data);
        setTipos(resTipos.data);
      } catch {
        setError('No se pudo cargar la información.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // ── Ver Receta ─────────────────────────────────────────────────────────────
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
      const res = await api.put(`/nutricion/comidas/${recetaActiva.id_comida}`, payload);
      setComidas(comidas.map(c => c.id_comida === recetaActiva.id_comida ? res.data : c));
      setEditandoReceta(false);
      setModalReceta(false);
    } catch {
      setError('No se pudo guardar los cambios.');
    }
  };

  // ── CRUD comidas ───────────────────────────────────────────────────────────
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
      nombre_comida:         comida.nombre_comida         ?? '',
      descripcion_comida:    comida.descripcion_comida    ?? '',
      cantidad_porcion:      comida.cantidad_porcion      ?? '100g',
      calorias_porcion:      comida.calorias_porcion      ?? '',
      proteina_porcion:      comida.proteina_porcion      ?? '',
      carbohidratos_porcion: comida.carbohidratos_porcion ?? '',
      grasa_porcion:         comida.grasa_porcion         ?? '',
      id_tipo_alimentacion:  comida.tipo_alimentacion?.id_tipo_alimentacion ?? ''
    });
    setModalNueva(true);
  };

  const guardarComida = async (e) => {
    e.preventDefault();
    const tipoSeleccionado = tipos.find(t => t.id_tipo_alimentacion === parseInt(form.id_tipo_alimentacion));
    const payload = {
      nombre_comida:         form.nombre_comida,
      descripcion_comida:    form.descripcion_comida,
      cantidad_porcion:      form.cantidad_porcion,
      calorias_porcion:      parseFloat(form.calorias_porcion),
      proteina_porcion:      parseFloat(form.proteina_porcion),
      carbohidratos_porcion: parseFloat(form.carbohidratos_porcion),
      grasa_porcion:         parseFloat(form.grasa_porcion),
      tipo_alimentacion:     tipoSeleccionado ? { id_tipo_alimentacion: tipoSeleccionado.id_tipo_alimentacion } : null
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
      await api.delete(`/nutricion/comidas/${id}`);
      setComidas(comidas.filter(c => c.id_comida !== id));
    } catch {
      setError('No se pudo eliminar la recomendación.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`min-vh-100 ${claseTexto}`} style={{ backgroundColor: fondoPantalla }}>
      <MenuNavegacion modoOscuro={modoOscuro} />

      <Container className="mt-4 pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold m-0">Administrar Recomendaciones</h2>
          <Button variant="primary" className="fw-bold" onClick={abrirModalNueva}>
            + Nueva Recomendación
          </Button>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        <Card className={claseTarjeta}>
          <Card.Body>
            {cargando ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Cargando recomendaciones...</p>
              </div>
            ) : (
              <Table responsive striped bordered hover className={claseTabla}>
                <thead>
                  <tr>
                    <th>Nombre del Plato</th>
                    <th>Tipo</th>
                    <th>Calorías</th>
                    <th>Proteínas (g)</th>
                    <th>Carbohidratos (g)</th>
                    <th>Grasas (g)</th>
                    <th>Porción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {comidas.length > 0 ? comidas.map((c) => (
                    <tr key={c.id_comida}>
                      <td className="fw-bold">{c.nombre_comida}</td>
                      <td>
                        <Badge bg={colorTipo(c.tipo_alimentacion?.nombre_tipo)}>
                          {c.tipo_alimentacion?.nombre_tipo ?? '—'}
                        </Badge>
                      </td>
                      <td>{c.calorias_porcion ?? '—'} kcal</td>
                      <td className="text-info fw-bold">{c.proteina_porcion ?? '—'}</td>
                      <td className="text-warning fw-bold">{c.carbohidratos_porcion ?? '—'}</td>
                      <td className="text-danger fw-bold">{c.grasa_porcion ?? '—'}</td>
                      <td>{c.cantidad_porcion ?? '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="d-flex gap-1">
                          <Button variant="info" size="sm" className="text-white fw-bold"
                            onClick={() => abrirReceta(c)}>
                            Ver
                          </Button>
                          <Button variant="warning" size="sm" className="fw-bold text-dark"
                            onClick={() => abrirModalEditar(c)}>
                            Editar
                          </Button>
                          <Button variant="danger" size="sm" className="fw-bold"
                            onClick={() => eliminarComida(c.id_comida)}>
                            Borrar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="8" className="text-center py-4">No hay recomendaciones registradas.</td></tr>
                  )}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: Ver Receta
      ══════════════════════════════════════════════════════════════════ */}
      <Modal show={modalReceta} onHide={() => setModalReceta(false)} centered size="lg">
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title>
              {editandoReceta ? '✏️ Editando Receta' : '🍽️ Detalle de Receta'}
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
                  <Form.Group className="mb-3">
                    <Form.Label>Descripción / Receta</Form.Label>
                    <Form.Control as="textarea" rows={5} className={claseInput}
                      value={recetaActiva.descripcion_comida ?? ''}
                      onChange={e => setRecetaActiva({ ...recetaActiva, descripcion_comida: e.target.value })} />
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
                      onClick={() => setEditandoReceta(true)}>
                      ✏️ Editar
                    </Button>
                  </div>

                  {/* Macros */}
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

                  {/* Descripción */}
                  <div className={`p-3 rounded ${modoOscuro ? 'bg-secondary' : 'bg-light'}`}>
                    <h6 className="fw-bold mb-2">📝 Descripción</h6>
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {recetaActiva.descripcion_comida || 'Sin descripción registrada.'}
                    </p>
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

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: Nueva / Editar Recomendación
      ══════════════════════════════════════════════════════════════════ */}
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
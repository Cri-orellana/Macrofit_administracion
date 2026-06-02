import { useState } from 'react';
import { Container, Table, Button, Card, Modal, Form } from 'react-bootstrap';
import MenuNavegacion from '../components/MenuNavegacion';

const Recomendaciones = ({ modoOscuro }) => {
  // Datos simulados de recomendaciones
  const [recomendaciones, setRecomendaciones] = useState([
    { id: 1, titulo: 'Pollo con Quínoa', tipo: 'Omnívora', calorias: 450 },
    { id: 2, titulo: 'Bowl de Garbanzos', tipo: 'Vegana', calorias: 520 }
  ]);

  // Estados para controlar la ventana emergente (Modal)
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevaRecomendacion, setNuevaRecomendacion] = useState({ titulo: '', tipo: 'Omnívora', calorias: '' });
  const [editandoId, setEditandoId] = useState(null);

  // Funciones para abrir y cerrar el modal
  const abrirModal = () => {
    setEditandoId(null);
    setNuevaRecomendacion({ titulo: '', tipo: 'Omnívora', calorias: '' });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditandoId(null);
    setNuevaRecomendacion({ titulo: '', tipo: 'Omnívora', calorias: '' }); // Limpiamos el formulario
  };

  const abrirModalEditarRecomendacion = (recomendacion) => {
    setEditandoId(recomendacion.id);
    setNuevaRecomendacion({
      titulo: recomendacion.titulo,
      tipo: recomendacion.tipo,
      calorias: recomendacion.calorias
    });
    setMostrarModal(true);
  };

  // Función para simular el guardado
  const guardarRecomendacion = (e) => {
    e.preventDefault();

    if (editandoId !== null) {
      const actualizadas = recomendaciones.map((rec) =>
        rec.id === editandoId ? { ...rec, ...nuevaRecomendacion } : rec
      );
      setRecomendaciones(actualizadas);
    } else {
      const nueva = {
        id: recomendaciones.length + 1,
        ...nuevaRecomendacion
      };
      setRecomendaciones([...recomendaciones, nueva]);
    }

    cerrarModal();
  };

  // Clases dinámicas para el diseño oscuro/claro
  const claseTexto = modoOscuro ? 'text-light' : 'text-dark';
  const claseTarjeta = modoOscuro ? 'bg-dark text-light border-secondary' : 'bg-white text-dark shadow-sm';
  const claseTabla = modoOscuro ? 'table-dark' : 'table-light';
  const fondoPantalla = modoOscuro ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)';
  const claseInput = modoOscuro ? 'bg-secondary text-light border-secondary' : '';

  return (
    <div className={`min-vh-100 ${claseTexto}`} style={{ backgroundColor: fondoPantalla }}>
      <MenuNavegacion modoOscuro={modoOscuro} />

      <Container className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold m-0">Administrar Recomendaciones</h2>
          <Button variant="primary" className="fw-bold" onClick={abrirModal}>
            + Nueva Recomendación
          </Button>
        </div>

        {/* Tabla de Recomendaciones */}
        <Card className={claseTarjeta}>
          <Card.Body>
            <Table responsive striped bordered hover className={claseTabla}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título / Nombre del Plato</th>
                  <th>Tipo de Alimentación</th>
                  <th>Calorías</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recomendaciones.map((rec) => (
                  <tr key={rec.id}>
                    <td>{rec.id}</td>
                    <td>{rec.titulo}</td>
                    <td>
                      <span className={`badge ${rec.tipo === 'Vegana' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {rec.tipo}
                      </span>
                    </td>
                    <td>{rec.calorias} kcal</td>
                    <td>
                      <Button
                        variant="warning"
                        size="sm"
                        className="me-2 fw-bold text-dark"
                        onClick={() => abrirModalEditarRecomendacion(rec)}
                      >
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" className="fw-bold">Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>

      {/* Ventana Emergente (Modal) para agregar recomendaciones */}
      <Modal show={mostrarModal} onHide={cerrarModal} centered>
        <div className={modoOscuro ? 'bg-dark text-light' : 'bg-white text-dark'}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title>{editandoId !== null ? 'Editar Recomendación' : 'Agregar Nueva Recomendación'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={guardarRecomendacion}>
              <Form.Group className="mb-3">
                <Form.Label>Título del Plato</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Ej: Ensalada César" 
                  required
                  className={claseInput}
                  value={nuevaRecomendacion.titulo}
                  onChange={(e) => setNuevaRecomendacion({...nuevaRecomendacion, titulo: e.target.value})}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Alimentación</Form.Label>
                <Form.Select 
                  className={claseInput}
                  value={nuevaRecomendacion.tipo}
                  onChange={(e) => setNuevaRecomendacion({...nuevaRecomendacion, tipo: e.target.value})}
                >
                  <option value="Omnívora">Omnívora</option>
                  <option value="Vegetariana">Vegetariana</option>
                  <option value="Vegana">Vegana</option>
                  <option value="Keto">Keto</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Calorías (kcal)</Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="Ej: 350" 
                  required
                  className={claseInput}
                  value={nuevaRecomendacion.calorias}
                  onChange={(e) => setNuevaRecomendacion({...nuevaRecomendacion, calorias: e.target.value})}
                />
              </Form.Group>

              <div className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" onClick={cerrarModal}>Cancelar</Button>
                <Button variant="primary" type="submit">
                  {editandoId !== null ? 'Guardar Cambios' : 'Guardar Plato'}
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
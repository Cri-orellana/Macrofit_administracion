import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import MenuNavegacion from '../components/MenuNavegacion';
import api from '../services/api';

const HistorialUsuario = ({ modoOscuro }) => {
  const { id } = useParams();
  const navegar = useNavigate();

  const [u,         setU]         = useState(null);
  const [objetivos, setObjetivos] = useState([]);
  const [niveles,   setNiveles]   = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resUsuario, resObjetivos, resNiveles] = await Promise.all([
          api.get(`/usuarios/${id}`),
          api.get('/catalogos/objetivos'),
          api.get('/catalogos/actividades'),
        ]);
        setU(resUsuario.data);
        setObjetivos(resObjetivos.data);
        setNiveles(resNiveles.data);
      } catch (err) {
        setError('No se pudo cargar el usuario.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  const nombreObjetivo = (idObj) =>
    objetivos.find(o => o.id_objetivo === idObj)?.descrip_obj ?? '—';
  const nombreNivel = (idNv) =>
    niveles.find(n => n.id_nv_act === idNv)?.desc_nv_act ?? '—';

  const campo = (valor, sufijo = '') =>
    valor !== null && valor !== undefined && valor !== 0
      ? `${valor}${sufijo}` : '—';

  const claseTexto   = modoOscuro ? 'text-light' : 'text-dark';
  const claseTarjeta = modoOscuro ? 'bg-dark text-light border-secondary' : 'bg-white text-dark shadow-sm';
  const claseTabla   = modoOscuro ? 'table-dark' : 'table-light';
  const fondoPantalla= modoOscuro ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)';
  const claseInterno = modoOscuro ? 'bg-secondary text-light' : 'bg-light text-dark';

  if (cargando) return (
    <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>
  );
  if (error) return <Alert variant="danger" className="m-4">{error}</Alert>;

  return (
    <div className={`min-vh-100 ${claseTexto}`} style={{ backgroundColor: fondoPantalla }}>
      <MenuNavegacion modoOscuro={modoOscuro} />

      <Container className="mt-4 pb-5">
        <Button variant="secondary" className="mb-4 fw-bold" onClick={() => navegar(-1)}>
          ← Volver a Usuarios
        </Button>

        <h2 className="fw-bold mb-4">
          Expediente: <span className="text-primary">{u.nom_usuario ?? 'Sin nombre'}</span>
          <Badge className="ms-3 fs-6" bg={u.rol === 'ADMIN' ? 'danger' : 'success'}>
            {u.rol}
          </Badge>
        </h2>

        <Row className="g-4">

          {/* Datos Personales */}
          <Col md={6}>
            <Card className={`h-100 ${claseTarjeta}`}>
              <Card.Header className="fw-bold bg-primary text-white">👤 Datos Personales</Card.Header>
              <Card.Body>
                <Row>
                  <Col xs={6}><p><strong>Correo:</strong> {u.correo}</p></Col>
                  <Col xs={6}><p><strong>Edad:</strong> {campo(u.edad, ' años')}</p></Col>
                  <Col xs={6}><p><strong>Sexo:</strong> {campo(u.sexo)}</p></Col>
                  <Col xs={6}><p><strong>Peso:</strong> {campo(u.peso, ' kg')}</p></Col>
                  <Col xs={6}><p><strong>Altura:</strong> {campo(u.altura, ' cm')}</p></Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Métricas Nutricionales */}
          <Col md={6}>
            <Card className={`h-100 ${claseTarjeta}`}>
              <Card.Header className="fw-bold bg-success text-white">🔥 Métricas Nutricionales</Card.Header>
              <Card.Body>
                <Row className="text-center">
                  <Col xs={6} className="mb-3">
                    <div className={`rounded p-2 ${claseInterno}`}>
                      <p className={`mb-1 small ${claseTexto}`}>TMB Objetivo</p>
                      <h5 className="fw-bold text-warning mb-0">{campo(u.tmb_objetivo, ' kcal')}</h5>
                    </div>
                  </Col>
                  <Col xs={6} className="mb-3">
                    <div className={`rounded p-2 ${claseInterno}`}>
                      <p className={`mb-1 small ${claseTexto}`}>Calorías Diarias</p>
                      <h5 className="fw-bold text-info mb-0">{campo(u.cal_diaria, ' kcal')}</h5>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className={`rounded p-2 ${claseInterno}`}>
                      <p className={`mb-1 small ${claseTexto}`}>Objetivo</p>
                      <p className={`fw-bold mb-0 small ${claseTexto}`}>{nombreObjetivo(u.id_objetivo)}</p>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className={`rounded p-2 ${claseInterno}`}>
                      <p className={`mb-1 small ${claseTexto}`}>Nivel de Actividad</p>
                      <p className={`fw-bold mb-0 small ${claseTexto}`}>{nombreNivel(u.id_nv_act)}</p>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

        </Row>

        {/* Historial de pesos — solo si el backend lo incluye */}
        {u.historialPesos?.length > 0 && (
          <Card className={`mt-4 ${claseTarjeta}`}>
            <Card.Header className="fw-bold">Evolución de Peso</Card.Header>
            <Card.Body>
              <Table responsive striped bordered hover className={claseTabla}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Peso (kg)</th>
                    <th>Progreso</th>
                  </tr>
                </thead>
                <tbody>
                  {u.historialPesos.map((registro, index) => (
                    <tr key={index}>
                      <td>{registro.fecha}</td>
                      <td className="fw-bold">{registro.peso} kg</td>
                      <td>
                        {index === 0 ? '—' : (
                          registro.peso < u.historialPesos[index - 1].peso
                            ? <span className="text-success">↓ Bajó</span>
                            : <span className="text-danger">↑ Subió</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}

      </Container>
    </div>
  );
};

export default HistorialUsuario;
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import MenuNavegacion from '../components/MenuNavegacion';
import api from '../services/api';

const HistorialUsuario = ({ modoOscuro }) => {
  const { id } = useParams();
  const navegar = useNavigate();
  const [u, setU] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const respuesta = await api.get(`/usuarios/${id}`);
        setU(respuesta.data);
      } catch (err) {
        setError('No se pudo cargar el usuario.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  const claseTarjeta = modoOscuro ? 'bg-dark text-light border-secondary' : 'bg-white text-dark shadow-sm';
  const claseTexto = modoOscuro ? 'text-light' : 'text-dark';
  const fondoPantalla = modoOscuro ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)';

  if (cargando) return (
    <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>
  );
  if (error) return <Alert variant="danger" className="m-4">{error}</Alert>;

  const campo = (valor, sufijo = '') =>
    valor !== null && valor !== undefined && valor !== 0 ? `${valor}${sufijo}` : '—';

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
                  <Col xs={6}><p><strong>ID:</strong> #{u.id_usuario}</p></Col>
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
                    <p className="text-muted mb-1 small">TMB Objetivo</p>
                    <h4 className="fw-bold text-warning">{campo(u.tmb_objetivo, ' kcal')}</h4>
                  </Col>
                  <Col xs={6} className="mb-3">
                    <p className="text-muted mb-1 small">Calorías Diarias</p>
                    <h4 className="fw-bold text-info">{campo(u.cal_diaria, ' kcal')}</h4>
                  </Col>
                  <Col xs={6}>
                    <p className="text-muted mb-1 small">ID Objetivo</p>
                    <h4 className="fw-bold">{campo(u.id_objetivo)}</h4>
                  </Col>
                  <Col xs={6}>
                    <p className="text-muted mb-1 small">Nivel de Actividad</p>
                    <h4 className="fw-bold">{campo(u.id_nv_act)}</h4>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

        </Row>
      </Container>
    </div>
  );
};

export default HistorialUsuario;
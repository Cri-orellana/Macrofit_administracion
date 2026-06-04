import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import MenuNavegacion from '../components/MenuNavegacion';
import api from '../services/api';

const HistorialUsuario = ({ modoOscuro }) => {
  const { id } = useParams();
  const navegar = useNavigate();

  // Estados del usuario
  const [u,         setU]         = useState(null);
  const [objetivos, setObjetivos] = useState([]);
  const [niveles,   setNiveles]   = useState([]);
  const [ejerciciosCatalogo, setEjerciciosCatalogo] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');

  // Estados de la Rutina
  const [rutinaActiva, setRutinaActiva] = useState(null);
  const [ejerciciosRutina, setEjerciciosRutina] = useState([]);
  const [cargandoRutina, setCargandoRutina] = useState(true);

  // Cargar datos
  useEffect(() => {
    const cargar = async () => {
      try {
        const [resUsuario, resObjetivos, resNiveles, resEjs] = await Promise.all([
          api.get(`/usuarios/${id}`),
          api.get('/catalogos/objetivos'),
          api.get('/catalogos/actividades'),
          api.get('/ejercicios/activos') // Traemos nombres de ejercicios
        ]);
        setU(resUsuario.data);
        setObjetivos(resObjetivos.data);
        setNiveles(resNiveles.data);
        setEjerciciosCatalogo(resEjs.data);
      } catch (err) {
        setError('No se pudo cargar el usuario.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  useEffect(() => {
    const cargarRutinaDelUsuario = async () => {
      try {
        const resAsignacion = await api.get(`/rutina-usuario/usuario/${id}/activa`);
        
        if (resAsignacion.data && resAsignacion.data.idRutina) {
          const [resRutina, resEjerRutina] = await Promise.all([
            api.get(`/rutinas/${resAsignacion.data.idRutina}`),
            api.get(`/rutina-ejercicio/rutina/${resAsignacion.data.idRutina}`)
          ]);
          setRutinaActiva(resRutina.data);
          setEjerciciosRutina(resEjerRutina.data);
        }
      } catch (error) {
        setRutinaActiva(null);
      } finally {
        setCargandoRutina(false);
      }
    };
    cargarRutinaDelUsuario();
  }, [id]);

  const nombreEjercicio = (idEjercicio) => {
    const e = ejerciciosCatalogo.find(ej => ej.id_ejercicio === idEjercicio || ej.idEjercicio === idEjercicio);
    return e?.nombreEjercicio || `Ejercicio #${idEjercicio}`;
  };

  const nombreObjetivo = (idObj) => objetivos.find(o => o.id_objetivo === idObj)?.descrip_obj ?? '—';
  const nombreNivel = (idNv) => niveles.find(n => n.id_nv_act === idNv)?.desc_nv_act ?? '—';
  const campo = (valor, sufijo = '') => valor ? `${valor}${sufijo}` : '—';

  const maxDiasEjercicios = ejerciciosRutina.reduce((max, e) => (e.dia > max ? e.dia : max), 0);
  const totalDíasRutina = maxDiasEjercicios < 4 && ejerciciosRutina.length > 0 ? 4 : (maxDiasEjercicios || 3);
  const diasArray = Array.from({ length: totalDíasRutina });

  const claseTexto   = modoOscuro ? 'text-light' : 'text-dark';
  const claseTarjeta = modoOscuro ? 'bg-dark text-light border-secondary' : 'bg-white text-dark shadow-sm';
  const claseTabla   = modoOscuro ? 'table-dark' : 'table-light';
  const fondoPantalla= modoOscuro ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)';
  const claseInterno = modoOscuro ? 'bg-secondary text-light' : 'bg-light text-dark';

  if (cargando) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger" className="m-4">{error}</Alert>;

  return (
    <div className={`min-vh-100 ${claseTexto}`} style={{ backgroundColor: fondoPantalla }}>
      <MenuNavegacion modoOscuro={modoOscuro} />

      <Container className="mt-4 pb-5">
        <Button variant="secondary" className="mb-4 fw-bold" onClick={() => navegar(-1)}>← Volver a Usuarios</Button>

        <h2 className="fw-bold mb-4">
          Expediente: <span className="text-primary">{u.nom_usuario ?? 'Sin nombre'}</span>
          <Badge className="ms-3 fs-6" bg={u.rol === 'ADMIN' ? 'danger' : 'success'}>
            {u.rol}
          </Badge>
        </h2>

{/* ════════ TARJETA DE RUTINA ASIGNADA CON EJERCICIOS ════════ */}
        <Row className="mb-4">
          <Col>
            <Card className={claseTarjeta}>
              <Card.Header className={`fw-bold text-white ${modoOscuro ? 'bg-primary' : 'bg-primary'}`}>
                🏋️‍♂️ Rutina de Entrenamiento Actual
              </Card.Header>
              <Card.Body>
                {cargandoRutina ? (
                  <div className="text-center py-2"><Spinner animation="border" size="sm" variant="primary" /></div>
                ) : rutinaActiva ? (
                  <div>
                    <h4 className="fw-bold text-success mb-2">{rutinaActiva.nombreRutina}</h4>
                    <p className={`mb-4 ${modoOscuro ? 'text-light' : 'text-muted'}`}>{rutinaActiva.descripcion}</p>
                    
                    <Row className="g-3">
                      {diasArray.map((_, i) => {
                        const dia = i + 1;
                        const ejerciciosDelDia = ejerciciosRutina.filter(e => (e.dia || 1) === dia).sort((a,b) => a.orden - b.orden);
                        
                        return (
                          <Col md={6} lg={4} key={dia}>
                            <Card className={`h-100 ${modoOscuro ? 'bg-dark border-secondary' : 'bg-light border-light'}`}>
                              <Card.Header className={`fw-bold py-2 ${modoOscuro ? 'bg-secondary text-white' : 'bg-white text-dark border-bottom'}`}>
                                Día {dia}
                              </Card.Header>
                              <Card.Body className="p-2">
                                {ejerciciosDelDia.length > 0 ? ejerciciosDelDia.map(e => (
                                  <div key={e.idRutinaEjercicio} className={`p-2 mb-2 rounded border ${modoOscuro ? 'bg-black border-secondary' : 'bg-white border-light'} shadow-sm`}>
                                    <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{nombreEjercicio(e.idEjercicio)}</div>
                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                      {e.series} series × {e.repeticiones} reps
                                      {e.pesoReferencia > 0 && ` • ${e.pesoReferencia} kg`}
                                    </div>
                                  </div>
                                )) : (
                                  <div className="text-center text-muted py-3 fst-italic" style={{fontSize: '0.85rem'}}>
                                    Día de descanso
                                  </div>
                                )}
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </div>
                ) : (
                  <Alert variant="warning" className="m-0 text-center fw-bold">Este usuario no tiene rutina asignada.</Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
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

        {/* Historial de pesos */}
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
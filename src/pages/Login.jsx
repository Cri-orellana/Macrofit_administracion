import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css';
import logoApp from '../assets/logo_app.png';

const Login = ({ modoOscuro }) => {
  const [correo, setCorreo] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navegar = useNavigate();

  const manejarIngreso = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const respuesta = await api.post('/usuarios/login', {
        correo: correo,
        contrasena: contrasenia
      });

      const datosUsuario = respuesta.data !== undefined ? respuesta.data : respuesta;

      if (!datosUsuario || !datosUsuario.rol) {
        setError("El servidor respondió, pero no envió los datos correctos del usuario.");
        setCargando(false);
        return;
      }

      if (datosUsuario.rol === 'Admin' || datosUsuario.rol === 'ADMIN') {
        localStorage.setItem('token_usuario', datosUsuario.token);
        localStorage.setItem('rol_usuario', 'Admin');
        localStorage.setItem('usuario_admin', JSON.stringify(datosUsuario));
        navegar('/panel');
      } else {
        setError("Acceso denegado: No tienes permisos de administrador.");
      }

    } catch (err) {
      console.error("Error en el login:", err);
      if (err.response?.status === 401) {
        setError("Credenciales incorrectas.");
      } else {
        setError("Error de conexión con el servidor.");
      }
    } finally {
      setCargando(false);
    }
  };

  const cardClass = modoOscuro ? 'glass-card-dark text-light' : 'glass-card-light text-dark';
  const inputClass = modoOscuro ? 'dark-input' : 'light-input';

  return (
    <div className="login-wrapper">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xs={12} md={6} lg={4}>

            <div className="text-center mb-4">
              <img src={logoApp} alt="Macrofit Logo" className="login-logo shadow" />
            </div>

            <Card className={`shadow-lg ${cardClass}`}>
              <Card.Body className="p-4">
                <h3 className="text-center mb-4 fw-bold">MacroFit Admin</h3>

                {error && <Alert variant="danger" className="text-center py-2">{error}</Alert>}

                <Form onSubmit={manejarIngreso}>
                  <Form.Group className="mb-3">
                    <Form.Label>Correo Electrónico</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="admin@macrofit.com"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      required
                      className={inputClass}
                      disabled={cargando}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Tu contraseña"
                      value={contrasenia}
                      onChange={(e) => setContrasenia(e.target.value)}
                      required
                      className={inputClass}
                      disabled={cargando}
                    />
                  </Form.Group>

                  <div className="d-grid">
                    <Button variant="primary" type="submit" className="btn-macrofit fw-bold" disabled={cargando}>
                      {cargando ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Ingresando...
                        </>
                      ) : (
                        "Ingresar"
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
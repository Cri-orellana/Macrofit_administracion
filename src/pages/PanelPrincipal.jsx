import { Container, Navbar, Nav, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import MenuNavegacion from '../components/MenuNavegacion';

const PanelPrincipal = ({ modoOscuro }) => {
  const navegar = useNavigate();

  const cerrarSesion = () => {
    localStorage.removeItem('rol_usuario');
    navegar('/');
  };

  const claseTexto = modoOscuro ? 'text-light' : 'text-dark';
  const claseBarraNavegacion = modoOscuro ? 'navbar-dark bg-dark' : 'navbar-light bg-light';
  const claseTarjeta = modoOscuro ? 'bg-dark text-light border-secondary' : 'bg-white text-dark shadow-sm';

  return (
    <div className={`min-vh-100 ${claseTexto}`} style={{ backgroundColor: modoOscuro ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)' }}>
      
      {/* Barra de Navegación Superior */}
      <MenuNavegacion modoOscuro={modoOscuro} />

      {/* Contenido Principal */}
      <Container className="mt-5">
        <h2 className="fw-bold mb-4">Bienvenido al Centro de Control</h2>
        
        <div className="row">
          <div className="col-md-4 mb-3">
            <Card className={claseTarjeta}>
              <Card.Body>
                <Card.Title>Total Usuarios</Card.Title>
                <Card.Text className="fs-1 fw-bold text-success">142</Card.Text>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-4 mb-3">
            <Card className={claseTarjeta}>
              <Card.Body>
                <Card.Title>Recomendaciones Activas</Card.Title>
                <Card.Text className="fs-1 fw-bold text-warning">24</Card.Text>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PanelPrincipal;
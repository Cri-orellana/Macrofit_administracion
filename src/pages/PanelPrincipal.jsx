import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Modal, Button, ProgressBar } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import MenuNavegacion from '../components/MenuNavegacion';
import api from '../services/api';
import usuariosPrueba from '../utils/usuariosPrueba'; 
import { ejerciciosPrueba, rutinasPrueba } from '../utils/datosPrueba';

const PanelPrincipal = ({ modoOscuro }) => {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // ─── Estados para las estadísticas y gráficos ────────────────────────────
  const [stats, setStats] = useState({
    rutinasActivas: 0, rutinasTotales: 0, ejercicioMasUsado: { nombre: 'N/A', cantidad: 0 },
    rutinaMasUsada: { nombre: 'N/A', cantidad: 0 }, usuariosActivos: 0, usuariosInactivos: 0, totalUsuarios: 0
  });

  const [graficos, setGraficos] = useState({ topEjercicios: [], topRutinas: [], estadoUsuarios: [], estadoRutinas: [] });
  const [modal, setModal] = useState({ show: false, tipo: null, titulo: '' });

  // ─── Estados para la Carga de Prueba (Barra de Progreso) ─────────────────
  const [progresoOp, setProgresoOp] = useState({ activa: false, porcentaje: 0, texto: '' });

  // ─── Colores para gráficos y dinámicos ───────────────────────────────────
  const COLORES_PIE = ['#00C49F', '#FF8042'];
  const COLOR_BARRA = modoOscuro ? '#8884d8' : '#0d6efd';
  const claseTexto = modoOscuro ? 'text-light' : 'text-dark';
  const claseTarjeta = modoOscuro ? 'bg-dark text-light border-secondary shadow' : 'bg-white text-dark shadow-sm';
  const fondoPantalla = modoOscuro ? 'rgba(18,18,18,0.85)' : 'rgba(255,255,255,0.85)';
  const claseModal = modoOscuro ? 'bg-dark text-light' : 'bg-white text-dark';

  // ─── FUNCIÓN CENTRAL DE CARGA DE DATOS ───────────────────────────────────
  const cargarDatosDashboard = async () => {
    setCargando(true);
    try {
      const [resRutinas, resUsuarios, resRutinaEjer, resRutinaUsu, resEjercicios] = await Promise.all([
        api.get('/rutinas'), api.get('/usuarios'), api.get('/rutina-ejercicio'), api.get('/rutina-usuario'), api.get('/ejercicios/activos')
      ]);

      const rutinas = resRutinas.data;
      const usuarios = resUsuarios.data;
      const rutinaEjercicios = resRutinaEjer.data;
      const rutinaUsuarios = resRutinaUsu.data;
      const ejercicios = resEjercicios.data;

      // 1. Rutinas Activas
      const rutinasActivas = rutinas.filter(r => r.activoCatalogo).length;

      // 2. Ejercicios más utilizados
      const conteoEjercicios = {};
      rutinaEjercicios.forEach(re => { conteoEjercicios[re.idEjercicio] = (conteoEjercicios[re.idEjercicio] || 0) + 1; });
      const topEjerciciosData = Object.keys(conteoEjercicios).map(id => {
        const ej = ejercicios.find(e => e.idEjercicio === parseInt(id) || e.id_ejercicio === parseInt(id));
        return { nombre: ej ? (ej.nombreEjercicio || 'Desconocido') : `Ej. #${id}`, usos: conteoEjercicios[id] };
      }).sort((a, b) => b.usos - a.usos);
      const ejercicioMasUsado = topEjerciciosData.length > 0 ? topEjerciciosData[0] : { nombre: 'Ninguno', usos: 0 };

      // 3. Rutinas más asignadas
      const conteoRutinas = {};
      const usuariosActivosSet = new Set();
      rutinaUsuarios.forEach(ru => {
        if (ru.activo) {
          conteoRutinas[ru.idRutina] = (conteoRutinas[ru.idRutina] || 0) + 1;
          usuariosActivosSet.add(ru.idUsuario);
        }
      });
      const topRutinasData = Object.keys(conteoRutinas).map(id => {
        const rut = rutinas.find(r => r.idRutina === parseInt(id));
        return { nombre: rut ? rut.nombreRutina : `Rutina #${id}`, asignaciones: conteoRutinas[id] };
      }).sort((a, b) => b.asignaciones - a.asignaciones);
      const rutinaMasUsada = topRutinasData.length > 0 ? topRutinasData[0] : { nombre: 'Ninguna', asignaciones: 0 };

      // 4. Estadísticas de Usuarios
      const usuariosActivos = usuariosActivosSet.size;
      const usuariosInactivos = usuarios.length - usuariosActivos;

      setStats({
        rutinasActivas, rutinasTotales: rutinas.length,
        ejercicioMasUsado: { nombre: ejercicioMasUsado.nombre, cantidad: ejercicioMasUsado.usos },
        rutinaMasUsada: { nombre: rutinaMasUsada.nombre, cantidad: rutinaMasUsada.asignaciones },
        usuariosActivos, usuariosInactivos, totalUsuarios: usuarios.length
      });

      setGraficos({
        topEjercicios: topEjerciciosData.slice(0, 10),
        topRutinas: topRutinasData.slice(0, 10),
        estadoUsuarios: [ { name: 'Con Rutina Activa', value: usuariosActivos }, { name: 'Sin Rutina (Inactivos)', value: usuariosInactivos } ],
        estadoRutinas: [ { name: 'Activas', value: rutinasActivas }, { name: 'Inactivas', value: rutinas.length - rutinasActivas } ]
      });
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las estadísticas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatosDashboard(); }, []);

  // ─── FUNCIONES DE DATOS DE PRUEBA (USUARIOS) ─────────────────────────────

  const inyectarUsuariosPrueba = async () => {
    if (!window.confirm("¿Seguro que deseas inyectar 50 usuarios de prueba?")) return;
    
    setProgresoOp({ activa: true, porcentaje: 0, texto: 'Iniciando inyección de usuarios...' });
    let completados = 0;
    const total = usuariosPrueba.length;

    for (const usuario of usuariosPrueba) {
      try {
        await api.post('/usuarios/registro', usuario);
      } catch (err) {
        // Ignorar si existe
      }
      completados++;
      setProgresoOp({ 
        activa: true, 
        porcentaje: Math.round((completados / total) * 100), 
        texto: `Creando usuario ${completados} de ${total}...` 
      });
    }

    setTimeout(() => {
      setProgresoOp({ activa: false, porcentaje: 0, texto: '' });
      cargarDatosDashboard(); 
    }, 1000);
  };

  const eliminarUsuariosPrueba = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar todos los usuarios de prueba (@macrofit.test)?")) return;

    setProgresoOp({ activa: true, porcentaje: 0, texto: 'Buscando usuarios de prueba...' });
    
    try {
      const res = await api.get('/usuarios');
      const usuariosTest = res.data.filter(u => u.correo && u.correo.endsWith('@macrofit.test'));

      if (usuariosTest.length === 0) {
        alert("No se encontraron usuarios de prueba para eliminar.");
        setProgresoOp({ activa: false, porcentaje: 0, texto: '' });
        return;
      }

      let completados = 0;
      const total = usuariosTest.length;

      for (const u of usuariosTest) {
        try {
          await api.delete(`/usuarios/${u.id_usuario}`);
        } catch (err) {} 
        
        completados++;
        setProgresoOp({ 
          activa: true, 
          porcentaje: Math.round((completados / total) * 100), 
          texto: `Eliminando usuario ${completados} de ${total}...` 
        });
      }

      setTimeout(() => {
        setProgresoOp({ activa: false, porcentaje: 0, texto: '' });
        cargarDatosDashboard(); 
      }, 1000);

    } catch (e) {
      setProgresoOp({ activa: false, porcentaje: 0, texto: '' });
      alert("Hubo un error al buscar los usuarios.");
    }
  };

  // ─── NUEVO: FUNCIONES DE DATOS DE PRUEBA (RUTINAS/EJERCICIOS) ────────────

  const cargarTodoDePrueba = async () => {
      if (!window.confirm("¿Inyectar ejercicios y rutinas de prueba (Prefijo TEST-)?")) return;
      
      setProgresoOp({ activa: true, porcentaje: 0, texto: 'Iniciando inyección de catálogo...' });
      
      try {
          // 1. Crear Ejercicios
          let completados = 0;
          const totalEjercicios = ejerciciosPrueba.length;
          
          for (const ejercicio of ejerciciosPrueba) {
              await api.post('/ejercicios', ejercicio);
              completados++;
              setProgresoOp({ 
                  activa: true, 
                  porcentaje: Math.round((completados / (totalEjercicios + rutinasPrueba.length)) * 100), 
                  texto: `Creando ejercicio ${completados} de ${totalEjercicios}...` 
              });
          }

          // 2. Crear Rutinas
          for (let i = 0; i < rutinasPrueba.length; i++) {
              await api.post('/rutinas', rutinasPrueba[i]);
              completados++;
              setProgresoOp({ 
                  activa: true, 
                  porcentaje: Math.round((completados / (totalEjercicios + rutinasPrueba.length)) * 100), 
                  texto: `Creando rutina ${i + 1} de ${rutinasPrueba.length}...` 
              });
          }

          setTimeout(() => {
              setProgresoOp({ activa: false, porcentaje: 0, texto: '' });
              alert("✅ Catálogo de prueba cargado correctamente.");
              cargarDatosDashboard();
          }, 1000);

      } catch (err) {
          console.error(err);
          setProgresoOp({ activa: false, porcentaje: 0, texto: '' });
          alert("Error al cargar los datos de prueba del catálogo.");
      }
  };

  const limpiarDatosDePruebaCatalogo = async () => {
      if (!window.confirm("¿ELIMINAR todos los ejercicios y rutinas de prueba (que comienzan con 'TEST-')?")) return;
      
      setProgresoOp({ activa: true, porcentaje: 0, texto: 'Buscando datos de prueba en el catálogo...' });

      try {
          // Obtener todo
          const [resRutinas, resEjercicios] = await Promise.all([
              api.get('/rutinas'),
              api.get('/ejercicios/activos') // Asumiendo que trae todos o ajusta si hay un endpoint general
          ]);

          const rutinasTest = resRutinas.data.filter(r => r.nombreRutina && r.nombreRutina.startsWith('TEST-'));
          const ejerciciosTest = resEjercicios.data.filter(e => e.nombreEjercicio && e.nombreEjercicio.startsWith('TEST-'));

          if (rutinasTest.length === 0 && ejerciciosTest.length === 0) {
              alert("No se encontraron datos de prueba (TEST-) para eliminar.");
              setProgresoOp({ activa: false, porcentaje: 0, texto: '' });
              return;
          }

          let completados = 0;
          const total = rutinasTest.length + ejerciciosTest.length;

          // Eliminar Rutinas (es importante eliminar estas primero si hay dependencias, aunque la BD debería manejarlas)
          for (const r of rutinasTest) {
              try { await api.delete(`/rutinas/${r.idRutina}`); } catch (e) {}
              completados++;
              setProgresoOp({ 
                  activa: true, 
                  porcentaje: Math.round((completados / total) * 100), 
                  texto: `Eliminando rutina de prueba...` 
              });
          }

          // Eliminar Ejercicios
          for (const e of ejerciciosTest) {
              const id = e.id_ejercicio ?? e.idEjercicio; // Dependiendo de cómo lo devuelva tu backend
              try { await api.delete(`/ejercicios/${id}`); } catch (err) {}
              completados++;
              setProgresoOp({ 
                  activa: true, 
                  porcentaje: Math.round((completados / total) * 100), 
                  texto: `Eliminando ejercicio de prueba...` 
              });
          }

          setTimeout(() => {
              setProgresoOp({ activa: false, porcentaje: 0, texto: '' });
              cargarDatosDashboard();
          }, 1000);

      } catch (e) {
          setProgresoOp({ activa: false, porcentaje: 0, texto: '' });
          alert("Error al limpiar el catálogo de prueba.");
      }
  };

  // ─── UI Y RENDERIZADO ────────────────────────────────────────────────────

  const abrirGrafico = (tipo, titulo) => setModal({ show: true, tipo, titulo });

  const TarjetaEstadistica = ({ titulo, valorPrincipal, subtitulo, icono, onClick }) => (
    <Card 
      className={`${claseTarjeta} h-100`} 
      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <Card.Body className="d-flex flex-column justify-content-center text-center">
        <div className="fs-1 mb-2">{icono}</div>
        <h6 className={`text-uppercase fw-bold ${modoOscuro ? 'text-light' : 'text-secondary'}`} style={{ fontSize: '0.85rem', opacity: modoOscuro ? 0.85 : 1, letterSpacing: '0.5px' }}>{titulo}</h6>
        <h2 className="fw-bold mb-1">{valorPrincipal}</h2>
        {subtitulo && <small className={modoOscuro ? 'text-info' : 'text-primary'}>{subtitulo}</small>}
      </Card.Body>
    </Card>
  );

  return (
    <div className={`min-vh-100 ${claseTexto}`} style={{ backgroundColor: fondoPantalla }}>
      <MenuNavegacion modoOscuro={modoOscuro} />

      <Container className="mt-4 pb-5">
        <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
          <h2 className="fw-bold m-0 mt-2">Panel Principal - Dashboard</h2>
          
          {/* BOTONES DE DESARROLLO (SEEDING) ACTUALIZADOS */}
          <div className="d-flex flex-column gap-2 p-3 rounded shadow-sm" style={{ backgroundColor: modoOscuro ? '#2a2a2a' : '#f8f9fa', border: `1px solid ${modoOscuro ? '#444' : '#dee2e6'}` }}>
            <span className={`fw-bold mb-1 ${modoOscuro ? 'text-light' : 'text-secondary'}`} style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>🛠️ HERRAMIENTAS DE PRUEBA (DEV TOOLS)</span>
            
            <div className="d-flex gap-2">
              <Button variant="outline-success" size="sm" className="fw-bold" onClick={inyectarUsuariosPrueba} disabled={progresoOp.activa}>
                + Usuarios (50)
              </Button>
              <Button variant="outline-info" size="sm" className="fw-bold" onClick={cargarTodoDePrueba} disabled={progresoOp.activa}>
                + Catálogo (Rutinas/Ejercicios)
              </Button>
            </div>
            
            <div className="d-flex gap-2">
              <Button variant="outline-danger" size="sm" className="fw-bold w-50" onClick={eliminarUsuariosPrueba} disabled={progresoOp.activa}>
                - Limpiar Usuarios
              </Button>
              <Button variant="outline-danger" size="sm" className="fw-bold w-50" onClick={limpiarDatosDePruebaCatalogo} disabled={progresoOp.activa}>
                - Limpiar Catálogo
              </Button>
            </div>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* MODAL DE PROGRESO DE CARGA/ELIMINACIÓN */}
        <Modal show={progresoOp.activa} backdrop="static" keyboard={false} centered>
          <div className={claseModal}>
            <Modal.Body className="text-center p-4">
              <h5 className="fw-bold mb-3">Sincronizando Base de Datos</h5>
              <p className="text-muted">{progresoOp.texto}</p>
              <ProgressBar 
                animated 
                now={progresoOp.porcentaje} 
                label={`${progresoOp.porcentaje}%`} 
                variant={progresoOp.texto.includes('Eliminando') ? 'danger' : 'success'}
                style={{ height: '25px' }} 
              />
            </Modal.Body>
          </div>
        </Modal>

        {cargando ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Calculando estadísticas...</p>
          </div>
        ) : (
          <Row className="g-4">
            <Col md={4} lg={3}>
              <TarjetaEstadistica 
                titulo="Rutinas Activas" 
                valorPrincipal={stats.rutinasActivas} 
                subtitulo={`De un total de ${stats.rutinasTotales}`}
                icono="📋"
                onClick={() => abrirGrafico('rutinas', 'Estado del Catálogo de Rutinas')}
              />
            </Col>
            <Col md={4} lg={3}>
              <TarjetaEstadistica 
                titulo="Usuarios Entrenando" 
                valorPrincipal={stats.usuariosActivos} 
                subtitulo={`${stats.usuariosInactivos} inactivos`}
                icono="👥"
                onClick={() => abrirGrafico('usuarios', 'Proporción de Usuarios Activos')}
              />
            </Col>
            <Col md={4} lg={3}>
              <TarjetaEstadistica 
                titulo="Ejercicio Más Usado" 
                valorPrincipal={stats.ejercicioMasUsado.cantidad > 0 ? stats.ejercicioMasUsado.nombre : 'N/A'} 
                subtitulo={`${stats.ejercicioMasUsado.cantidad} apariciones`}
                icono="🏋️‍♂️"
                onClick={() => abrirGrafico('ejercicios', 'Top 10 Ejercicios Más Utilizados')}
              />
            </Col>
            <Col md={12} lg={3}>
              <TarjetaEstadistica 
                titulo="Rutina Más Asignada" 
                valorPrincipal={stats.rutinaMasUsada.cantidad > 0 ? stats.rutinaMasUsada.nombre : 'N/A'} 
                subtitulo={`${stats.rutinaMasUsada.cantidad} usuarios la tienen`}
                icono="🔥"
                onClick={() => abrirGrafico('top_rutinas', 'Top 10 Rutinas Más Asignadas')}
              />
            </Col>
          </Row>
        )}
      </Container>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL DE GRÁFICOS
      ══════════════════════════════════════════════════════════════════ */}
      <Modal show={modal.show} onHide={() => setModal({ ...modal, show: false })} size="lg" centered>
        <div className={claseModal}>
          <Modal.Header closeButton className={modoOscuro ? 'border-secondary' : ''}>
            <Modal.Title className="fw-bold">{modal.titulo}</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ height: '400px' }}>
            
            {modal.tipo === 'rutinas' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={graficos.estadoRutinas} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="value">
                    {graficos.estadoRutinas.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES_PIE[index % COLORES_PIE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: modoOscuro ? '#333' : '#fff', color: modoOscuro ? '#fff' : '#000' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}

            {modal.tipo === 'usuarios' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={graficos.estadoUsuarios} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="value">
                    {graficos.estadoUsuarios.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES_PIE[index % COLORES_PIE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: modoOscuro ? '#333' : '#fff', color: modoOscuro ? '#fff' : '#000' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}

            {modal.tipo === 'ejercicios' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graficos.topEjercicios} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <XAxis type="number" stroke={modoOscuro ? '#ccc' : '#333'} />
                  <YAxis dataKey="nombre" type="category" stroke={modoOscuro ? '#ccc' : '#333'} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: modoOscuro ? '#333' : '#fff', color: modoOscuro ? '#fff' : '#000' }} />
                  <Bar dataKey="usos" fill={COLOR_BARRA} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {modal.tipo === 'top_rutinas' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graficos.topRutinas} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <XAxis type="number" stroke={modoOscuro ? '#ccc' : '#333'} />
                  <YAxis dataKey="nombre" type="category" stroke={modoOscuro ? '#ccc' : '#333'} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: modoOscuro ? '#333' : '#fff', color: modoOscuro ? '#fff' : '#000' }} />
                  <Bar dataKey="asignaciones" fill={COLOR_BARRA} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

          </Modal.Body>
        </div>
      </Modal>

    </div>
  );
};

export default PanelPrincipal;
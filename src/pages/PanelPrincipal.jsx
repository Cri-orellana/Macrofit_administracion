import { useState, useEffect } from 'react';
import { Spinner, Alert, Modal, Button, ProgressBar } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import MenuNavegacion from '../components/MenuNavegacion';
import api from '../services/api';
import usuariosPrueba from '../utils/usuariosPrueba'; 
import { ejerciciosPrueba, rutinasPrueba } from '../utils/datosPrueba';
import './Dashboard.css'; 

const PanelPrincipal = ({ modoOscuro }) => {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [stats, setStats] = useState({
    rutinasActivas: 0, rutinasTotales: 0, ejercicioMasUsado: { nombre: 'N/A', cantidad: 0 },
    rutinaMasUsada: { nombre: 'N/A', cantidad: 0 }, usuariosActivos: 0, usuariosInactivos: 0, totalUsuarios: 0
  });

  const [graficos, setGraficos] = useState({ topEjercicios: [], topRutinas: [], estadoUsuarios: [], estadoRutinas: [] });
  
  const [graficosExtra, setGraficosExtra] = useState({ objetivos: [], niveles: [], alimentacion: [] });

  const [progresoOp, setProgresoOp] = useState({ activa: false, porcentaje: 0, texto: '' });

  const COLORES_PIE = ['#4e74ff', '#eef0f4']; 
  const COLORES_OBJETIVOS = ['#4e74ff', '#ff9f43', '#00b884', '#a55eea']; 
  const COLOR_BARRAS = '#4e74ff';
  const COLOR_BARRAS_ALT = '#00b884';

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

      // 3. Rutinas más asignadas y Usuarios Activos
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

      const usuariosActivos = usuariosActivosSet.size;
      const usuariosInactivos = usuarios.length - usuariosActivos;

      setStats({
        rutinasActivas, rutinasTotales: rutinas.length,
        ejercicioMasUsado: { nombre: ejercicioMasUsado.nombre, cantidad: ejercicioMasUsado.usos },
        rutinaMasUsada: { nombre: rutinaMasUsada.nombre, cantidad: rutinaMasUsada.asignaciones },
        usuariosActivos, usuariosInactivos, totalUsuarios: usuarios.length
      });

      setGraficos({
        topEjercicios: topEjerciciosData.slice(0, 7), 
        topRutinas: topRutinasData.slice(0, 10),
        estadoUsuarios: [ { name: 'Con Rutina', value: usuariosActivos }, { name: 'Sin Rutina', value: usuariosInactivos } ],
        estadoRutinas: [ { name: 'Activas', value: rutinasActivas }, { name: 'Inactivas', value: rutinas.length - rutinasActivas } ]
      });

      // ─── PROCESAMIENTO DINÁMICO DE DEMOGRAFÍA ───
      
      // A. Procesar Objetivos Físicos (Ajusta los IDs si difieren de tu BD)
      const conteoObjetivos = {};
      const mapeoObjetivos = { 1: 'Pérdida de Grasa', 2: 'Hipertrofia', 3: 'Mantenimiento' };
      
      usuarios.forEach(u => {
        const idObj = u.id_objetivo || u.idObjetivo;
        if (idObj) {
          const nombreObj = mapeoObjetivos[idObj] || `Objetivo #${idObj}`;
          conteoObjetivos[nombreObj] = (conteoObjetivos[nombreObj] || 0) + 1;
        }
      });

      // B. Procesar Niveles de Actividad
      const conteoNiveles = {};
      const mapeoNiveles = { 1: 'Principiante', 2: 'Ligero', 3: 'Moderado', 4: 'Intenso' };
      
      usuarios.forEach(u => {
        const idNav = u.id_nv_act || u.idNvAct;
        if (idNav) {
          const nombreNav = mapeoNiveles[idNav] || `Nivel #${idNav}`;
          conteoNiveles[nombreNav] = (conteoNiveles[nombreNav] || 0) + 1;
        }
      });

      // C. Procesar Tipos de Alimentación
      const conteoAlimentacion = {};
      const mapeoDieta = { 1: 'Tradicional', 2: 'Vegana', 3: 'Keto', 4: 'Vegetariana' };
      
      usuarios.forEach(u => {
        const idDiet = u.id_tipo_alimentacion || u.idTipoAlimentacion;
        if (idDiet) {
          const nombreDiet = mapeoDieta[idDiet] || `Dieta #${idDiet}`;
          conteoAlimentacion[nombreDiet] = (conteoAlimentacion[nombreDiet] || 0) + 1;
        }
      });

      setGraficosExtra({
        objetivos: Object.keys(conteoObjetivos).map(name => ({ name, value: conteoObjetivos[name] })),
        niveles: Object.keys(conteoNiveles).map(name => ({ name, cantidad: conteoNiveles[name] })),
        alimentacion: Object.keys(conteoAlimentacion).map(name => ({ name, cantidad: conteoAlimentacion[name] }))
      });

    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las estadísticas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatosDashboard(); }, []);

  // ─── FUNCIONES DE HERRAMIENTAS DE PRUEBA ───
  const inyectarUsuariosPrueba = async () => { 
    if (!window.confirm("¿Seguro que deseas inyectar 50 usuarios de prueba?")) return;
    setProgresoOp({ activa: true, porcentaje: 0, texto: 'Iniciando inyección de usuarios...' });
    let completados = 0;
    const total = usuariosPrueba.length;
    for (const usuario of usuariosPrueba) {
      try { await api.post('/usuarios/registro', usuario); } catch (err) {}
      completados++;
      setProgresoOp({ activa: true, porcentaje: Math.round((completados / total) * 100), texto: `Creando usuario ${completados} de ${total}...` });
    }
    setTimeout(() => { setProgresoOp({ activa: false, porcentaje: 0, texto: '' }); cargarDatosDashboard(); }, 1000);
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
        try { await api.delete(`/usuarios/${u.id_usuario}`); } catch (err) {} 
        completados++;
        setProgresoOp({ activa: true, porcentaje: Math.round((completados / total) * 100), texto: `Eliminando usuario ${completados} de ${total}...` });
      }
      setTimeout(() => { setProgresoOp({ activa: false, porcentaje: 0, texto: '' }); cargarDatosDashboard(); }, 1000);
    } catch (e) {
      setProgresoOp({ activa: false, porcentaje: 0, texto: '' });
      alert("Hubo un error al buscar los usuarios.");
    }
  };

  const cargarTodoDePrueba = async () => { 
      if (!window.confirm("¿Inyectar ejercicios y rutinas de prueba (Prefijo TEST-)?")) return;
      setProgresoOp({ activa: true, porcentaje: 0, texto: 'Iniciando inyección de catálogo...' });
      try {
          let completados = 0;
          const totalEjercicios = ejerciciosPrueba.length;
          for (const ejercicio of ejerciciosPrueba) {
              await api.post('/ejercicios', ejercicio);
              completados++;
              setProgresoOp({ activa: true, porcentaje: Math.round((completados / (totalEjercicios + rutinasPrueba.length)) * 100), texto: `Creando ejercicio ${completados} de ${totalEjercicios}...` });
          }
          for (let i = 0; i < rutinasPrueba.length; i++) {
              await api.post('/rutinas', rutinasPrueba[i]);
              completados++;
              setProgresoOp({ activa: true, porcentaje: Math.round((completados / (totalEjercicios + rutinasPrueba.length)) * 100), texto: `Creando rutina ${i + 1} de ${rutinasPrueba.length}...` });
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
          const [resRutinas, resEjercicios] = await Promise.all([ api.get('/rutinas'), api.get('/ejercicios/activos') ]);
          const rutinasTest = resRutinas.data.filter(r => r.nombreRutina && r.nombreRutina.startsWith('TEST-'));
          const ejerciciosTest = resEjercicios.data.filter(e => e.nombreEjercicio && e.nombreEjercicio.startsWith('TEST-'));

          if (rutinasTest.length === 0 && ejerciciosTest.length === 0) {
              alert("No se encontraron datos de prueba (TEST-) para eliminar.");
              setProgresoOp({ activa: false, porcentaje: 0, texto: '' });
              return;
          }
          let completados = 0;
          const total = rutinasTest.length + ejerciciosTest.length;
          for (const r of rutinasTest) {
              try { await api.delete(`/rutinas/${r.idRutina}`); } catch (e) {}
              completados++;
              setProgresoOp({ activa: true, porcentaje: Math.round((completados / total) * 100), texto: `Eliminando rutina de prueba...` });
          }
          for (const e of ejerciciosTest) {
              const id = e.id_ejercicio ?? e.idEjercicio; 
              try { await api.delete(`/ejercicios/${id}`); } catch (err) {}
              completados++;
              setProgresoOp({ activa: true, porcentaje: Math.round((completados / total) * 100), texto: `Eliminando ejercicio de prueba...` });
          }
          setTimeout(() => { setProgresoOp({ activa: false, porcentaje: 0, texto: '' }); cargarDatosDashboard(); }, 1000);
      } catch (e) {
          setProgresoOp({ activa: false, porcentaje: 0, texto: '' });
          alert("Error al limpiar el catálogo de prueba.");
      }
  };

  return (
    <div className={`flup-dashboard-wrapper ${modoOscuro ? 'dark-mode-dashboard' : ''}`}>
      <MenuNavegacion modoOscuro={modoOscuro} />

      <div className="flup-content">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Dashboard</h2>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Modal de Progreso */}
        <Modal show={progresoOp.activa} backdrop="static" keyboard={false} centered>
          <div className={modoOscuro ? 'bg-dark text-light' : 'bg-white text-dark'}>
            <Modal.Body className="text-center p-4">
              <h5 className="fw-bold mb-3">Sincronizando Base de Datos</h5>
              <p className="text-muted">{progresoOp.texto}</p>
              <ProgressBar animated now={progresoOp.porcentaje} label={`${progresoOp.porcentaje}%`} variant={progresoOp.texto.includes('Eliminando') ? 'danger' : 'success'} style={{ height: '25px' }} />
            </Modal.Body>
          </div>
        </Modal>

        {cargando ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Sincronizando métricas...</p>
          </div>
        ) : (
          <>
            {/* ── Tarjetas Superiores ── */}
            <div className="flup-metric-grid">
              <div className="flup-metric-card">
                <div className="flup-metric-header"><span>👥</span> Usuarios Registrados</div>
                <div className="flup-metric-value">{stats.totalUsuarios}</div>
                <div className="flup-metric-trend trend-neutral">Total en plataforma</div>
              </div>
              <div className="flup-metric-card">
                <div className="flup-metric-header"><span>🏃‍♂️</span> Usuarios Entrenando</div>
                <div className="flup-metric-value">{stats.usuariosActivos}</div>
                <div className="flup-metric-trend trend-up">↗ {stats.usuariosInactivos} inactivos</div>
              </div>
              <div className="flup-metric-card">
                <div className="flup-metric-header"><span>📋</span> Rutinas Activas</div>
                <div className="flup-metric-value">{stats.rutinasActivas}</div>
                <div className="flup-metric-trend trend-neutral">De {stats.rutinasTotales} en catálogo</div>
              </div>
              <div className="flup-metric-card">
                <div className="flup-metric-header"><span>🏋️‍♂️</span> Ejercicio Top</div>
                <div className="flup-metric-value" style={{ fontSize: '1.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {stats.ejercicioMasUsado.cantidad > 0 ? stats.ejercicioMasUsado.nombre : 'N/A'}
                </div>
                <div className="flup-metric-trend trend-up">↗ Usado {stats.ejercicioMasUsado.cantidad} veces</div>
              </div>
            </div>

            {/* ── Fila 1: Gráficos Principales ── */}
            <div className="flup-charts-layout mb-4">
              <div className="flup-chart-card">
                <div className="flup-chart-title">Uso de Ejercicios en Rutinas</div>
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={graficos.topEjercicios} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                      <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{fill: 'var(--flup-text-muted)', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--flup-text-muted)', fontSize: 12}} allowDecimals={false} />
                      <Tooltip cursor={{fill: modoOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}} contentStyle={{ backgroundColor: modoOscuro ? '#333' : '#fff', borderRadius: '8px', border: 'none', color: modoOscuro ? '#fff' : '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="usos" fill={COLOR_BARRAS} radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flup-chart-card">
                <div className="flup-chart-title">Estado de Usuarios</div>
                <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={graficos.estadoUsuarios} innerRadius={75} outerRadius={105} paddingAngle={3} dataKey="value" stroke="none">
                        {graficos.estadoUsuarios.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES_PIE[index % COLORES_PIE.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: modoOscuro ? '#333' : '#fff', borderRadius: '8px', border: 'none', color: modoOscuro ? '#fff' : '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginTop: '10px' }}>
                  {graficos.estadoUsuarios.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--flup-text-muted)', fontWeight: 500 }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORES_PIE[i], marginRight: '8px' }}></div>
                      {item.name} ({item.value})
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Fila 2: Los 3 Nuevos Gráficos (Objetivos, Niveles, Alimentación) ── */}
            <div className="flup-charts-grid-3">
              
              {/* Gráfico 1: Objetivos */}
              <div className="flup-chart-card">
                <div className="flup-chart-title">Objetivos Físicos</div>
                {graficosExtra.objetivos.length > 0 ? (
                  <>
                    <div style={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={graficosExtra.objetivos} innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                            {graficosExtra.objetivos.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES_OBJETIVOS[index % COLORES_OBJETIVOS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: modoOscuro ? '#333' : '#fff', borderRadius: '8px', border: 'none', color: modoOscuro ? '#fff' : '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '10px' }}>
                      {graficosExtra.objetivos.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--flup-text-muted)' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORES_OBJETIVOS[i], marginRight: '6px' }}></div>
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 220, fontSize: '0.9rem' }}>Sin datos registrados</div>
                )}
              </div>

              {/* Gráfico 2: Niveles de Experiencia */}
              <div className="flup-chart-card">
                <div className="flup-chart-title">Niveles de Actividad</div>
                {graficosExtra.niveles.length > 0 ? (
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <BarChart data={graficosExtra.niveles} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--flup-text-muted)', fontSize: 11}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--flup-text-muted)', fontSize: 11}} allowDecimals={false} />
                        <Tooltip cursor={{fill: modoOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}} contentStyle={{ backgroundColor: modoOscuro ? '#333' : '#fff', borderRadius: '8px', border: 'none', color: modoOscuro ? '#fff' : '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="cantidad" fill={COLOR_BARRAS_ALT} radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 250, fontSize: '0.9rem' }}>Sin datos registrados</div>
                )}
              </div>

              {/* Gráfico 3: Alimentación */}
              <div className="flup-chart-card">
                <div className="flup-chart-title">Tipos de Alimentación</div>
                {graficosExtra.alimentacion.length > 0 ? (
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <BarChart data={graficosExtra.alimentacion} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'var(--flup-text-muted)', fontSize: 12}} width={80} />
                        <Tooltip cursor={{fill: modoOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}} contentStyle={{ backgroundColor: modoOscuro ? '#333' : '#fff', borderRadius: '8px', border: 'none', color: modoOscuro ? '#fff' : '#000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="cantidad" fill={COLORES_OBJETIVOS[1]} radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 250, fontSize: '0.9rem' }}>Sin datos registrados</div>
                )}
              </div>

            </div>

            {/* ── Herramientas de Desarrollo ── */}
            <div className="flup-dev-tools">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--flup-text-muted)' }}>
                  🛠️ Herramientas de Prueba (Dev Tools)
                </span>
                <div className="d-flex gap-2 flex-wrap">
                  <Button variant={modoOscuro ? "outline-light" : "outline-dark"} size="sm" onClick={inyectarUsuariosPrueba} disabled={progresoOp.activa}>+ 50 Usuarios</Button>
                  <Button variant={modoOscuro ? "outline-light" : "outline-dark"} size="sm" onClick={cargarTodoDePrueba} disabled={progresoOp.activa}>+ Catálogo Base</Button>
                  <Button variant="outline-danger" size="sm" onClick={eliminarUsuariosPrueba} disabled={progresoOp.activa}>Limpiar Usuarios</Button>
                  <Button variant="outline-danger" size="sm" onClick={limpiarDatosDePruebaCatalogo} disabled={progresoOp.activa}>Limpiar Catálogo</Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PanelPrincipal;
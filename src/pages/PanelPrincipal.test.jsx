import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PanelPrincipal from './PanelPrincipal';
import api from '../services/api';

vi.mock('../services/api');
vi.mock('../components/MenuNavegacion', () => ({ default: () => <nav>Menu Mock</nav> }));
vi.mock('../utils/usuariosPrueba', () => ({ default: [] }));
vi.mock('../utils/datosPrueba', () => ({ ejerciciosPrueba: [], rutinasPrueba: [] }));

vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 800, height: 600 }}>{children}</div>
    ),
  };
});

const RUTINAS_MOCK = [
  { idRutina: 1, nombreRutina: 'Rutina Fuerza', activoCatalogo: true },
  { idRutina: 2, nombreRutina: 'Rutina Cardio', activoCatalogo: false },
  { idRutina: 3, nombreRutina: 'Rutina Yoga',   activoCatalogo: true },
];

const USUARIOS_MOCK = [
  { id_usuario: 1, correo: 'ana@mail.com',  id_objetivo: 1, id_nv_act: 1, id_tipo_alimentacion: 1 },
  { id_usuario: 2, correo: 'luis@mail.com', id_objetivo: 2, id_nv_act: 2, id_tipo_alimentacion: 2 },
  { id_usuario: 3, correo: 'mia@macrofit.test', id_objetivo: 1, id_nv_act: 3, id_tipo_alimentacion: 1 },
];

const EJERCICIOS_MOCK = [
  { idEjercicio: 10, nombreEjercicio: 'Sentadilla' },
  { idEjercicio: 20, nombreEjercicio: 'Press Banca' },
];

const RUTINA_EJERCICIO_MOCK = [
  { idRutina: 1, idEjercicio: 10 },
  { idRutina: 1, idEjercicio: 10 },
  { idRutina: 2, idEjercicio: 20 },
];

const RUTINA_USUARIO_MOCK = [
  { idRutina: 1, idUsuario: 1, activo: true },
  { idRutina: 2, idUsuario: 2, activo: true },
  { idRutina: 1, idUsuario: 3, activo: false },
];

const mockApiConDatos = () => {
  api.get.mockImplementation((url) => {
    if (url === '/rutinas')          return Promise.resolve({ data: RUTINAS_MOCK });
    if (url === '/usuarios')         return Promise.resolve({ data: USUARIOS_MOCK });
    if (url === '/rutina-ejercicio') return Promise.resolve({ data: RUTINA_EJERCICIO_MOCK });
    if (url === '/rutina-usuario')   return Promise.resolve({ data: RUTINA_USUARIO_MOCK });
    if (url === '/ejercicios/activos') return Promise.resolve({ data: EJERCICIOS_MOCK });
    return Promise.resolve({ data: [] });
  });
};

describe('Pruebas del PanelPrincipal (Dashboard)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: [] });
    window.confirm = vi.fn();
    window.alert  = vi.fn();
  });


  it('1. Debe mostrar el título "Dashboard"', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('2. Debe mostrar el spinner con texto "Sincronizando métricas..." mientras carga', () => {
    render(<PanelPrincipal modoOscuro={false} />);
    expect(screen.getByText('Sincronizando métricas...')).toBeInTheDocument();
  });

  it('3. Debe mostrar alerta de error si la API falla', async () => {
    api.get.mockRejectedValue(new Error('Error del servidor'));
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar las estadísticas.')).toBeInTheDocument();
    });
  });

  it('4. Debe mostrar la tarjeta "Rutinas Activas" tras cargar', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('Rutinas Activas')).toBeInTheDocument();
    });
  });

  it('5. Debe mostrar la tarjeta "Usuarios Registrados" tras cargar', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('Usuarios Registrados')).toBeInTheDocument();
    });
  });

  it('6. Debe mostrar la tarjeta "Usuarios Entrenando" tras cargar', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('Usuarios Entrenando')).toBeInTheDocument();
    });
  });

  it('7. Debe mostrar la tarjeta "Ejercicio Top" tras cargar', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('Ejercicio Top')).toBeInTheDocument();
    });
  });

  it('8. Debe ocultar el spinner después de que la API responde', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    expect(screen.getByText('Sincronizando métricas...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Sincronizando métricas...')).not.toBeInTheDocument();
    });
  });

  it('9. No debe mostrar el mensaje de error cuando la API responde bien', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => screen.getByText('Rutinas Activas'));
    expect(screen.queryByText('No se pudieron cargar las estadísticas.')).not.toBeInTheDocument();
  });

  it('10. Debe mostrar el menú de navegación mockeado', () => {
    render(<PanelPrincipal modoOscuro={false} />);
    expect(screen.getByText('Menu Mock')).toBeInTheDocument();
  });



  it('11. Debe calcular 0 en todas las métricas cuando la API devuelve listas vacías', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      const ceros = screen.getAllByText('0');
      expect(ceros.length).toBeGreaterThan(0);
    });
  });

  it('12. Debe calcular correctamente el total de rutinas activas', async () => {
    mockApiConDatos();
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('13. Debe mostrar el total de usuarios correctamente', async () => {
    mockApiConDatos();
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('14. Debe mostrar "N/A" como ejercicio top cuando no hay datos de ejercicios', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  it('15. Debe calcular correctamente el ejercicio más usado', async () => {
    mockApiConDatos();
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('Sentadilla')).toBeInTheDocument();
    });
  });



  it('16. Debe mostrar la sección "Herramientas de Prueba (Dev Tools)"', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Herramientas de Prueba/i)).toBeInTheDocument();
    });
  });

  it('17. El botón "+ 50 Usuarios" debe estar visible y habilitado', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('+ 50 Usuarios')).not.toBeDisabled();
    });
  });

  it('18. El botón "+ Catálogo Base" debe estar visible y habilitado', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('+ Catálogo Base')).not.toBeDisabled();
    });
  });

  it('19. El botón "Limpiar Usuarios" debe estar visible y habilitado', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('Limpiar Usuarios')).not.toBeDisabled();
    });
  });

  it('20. El botón "Limpiar Catálogo" debe estar visible y habilitado', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('Limpiar Catálogo')).not.toBeDisabled();
    });
  });

  it('21. Debe pedir confirmación al hacer clic en "+ 50 Usuarios"', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => screen.getByText('+ 50 Usuarios'));
    fireEvent.click(screen.getByText('+ 50 Usuarios'));

    expect(window.confirm).toHaveBeenCalledWith(
      '¿Seguro que deseas inyectar 50 usuarios de prueba?'
    );
  });

  it('22. Debe pedir confirmación al hacer clic en "Limpiar Usuarios"', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => screen.getByText('Limpiar Usuarios'));
    fireEvent.click(screen.getByText('Limpiar Usuarios'));

    expect(window.confirm).toHaveBeenCalledWith(
      '¿Seguro que deseas eliminar todos los usuarios de prueba (@macrofit.test)?'
    );
  });

  it('23. Debe pedir confirmación al hacer clic en "+ Catálogo Base"', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => screen.getByText('+ Catálogo Base'));
    fireEvent.click(screen.getByText('+ Catálogo Base'));

    expect(window.confirm).toHaveBeenCalledWith(
      '¿Inyectar ejercicios y rutinas de prueba (Prefijo TEST-)?'
    );
  });

  it('24. Debe pedir confirmación al hacer clic en "Limpiar Catálogo"', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => screen.getByText('Limpiar Catálogo'));
    fireEvent.click(screen.getByText('Limpiar Catálogo'));

    expect(window.confirm).toHaveBeenCalledWith(
      "¿ELIMINAR todos los ejercicios y rutinas de prueba (que comienzan con 'TEST-')?"
    );
  });

  it('25. No debe llamar a la API si el usuario cancela la inyección de usuarios', async () => {
    window.confirm.mockReturnValue(false); // usuario presiona "Cancelar"
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => screen.getByText('+ 50 Usuarios'));
    fireEvent.click(screen.getByText('+ 50 Usuarios'));

    expect(api.post).not.toHaveBeenCalled();
  });

  it('26. No debe llamar a api.delete si el usuario cancela "Limpiar Usuarios"', async () => {
    window.confirm.mockReturnValue(false);
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => screen.getByText('Limpiar Usuarios'));
    fireEvent.click(screen.getByText('Limpiar Usuarios'));

    expect(api.delete).not.toHaveBeenCalled();
  });

  it('27. Debe mostrar aviso si no hay usuarios de prueba para eliminar', async () => {
    window.confirm.mockReturnValue(true);
    api.get.mockResolvedValue({ data: USUARIOS_MOCK.filter(u => !u.correo.endsWith('@macrofit.test')) });
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => screen.getByText('Limpiar Usuarios'));
    fireEvent.click(screen.getByText('Limpiar Usuarios'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'No se encontraron usuarios de prueba para eliminar.'
      );
    });
  });

  it('28. Debe mostrar aviso si no hay datos TEST- para limpiar en el catálogo', async () => {
    window.confirm.mockReturnValue(true);
    api.get.mockImplementation((url) => {
      if (url === '/rutinas')            return Promise.resolve({ data: RUTINAS_MOCK });
      if (url === '/ejercicios/activos') return Promise.resolve({ data: EJERCICIOS_MOCK });
      return Promise.resolve({ data: [] });
    });
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => screen.getByText('Limpiar Catálogo'));
    fireEvent.click(screen.getByText('Limpiar Catálogo'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'No se encontraron datos de prueba (TEST-) para eliminar.'
      );
    });
  });

  it('29. Debe mostrar los títulos de los gráficos principales tras cargar', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('Uso de Ejercicios en Rutinas')).toBeInTheDocument();
      expect(screen.getByText('Estado de Usuarios')).toBeInTheDocument();
    });
  });

  it('30. Debe mostrar los títulos de los gráficos demográficos tras cargar', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('Objetivos Físicos')).toBeInTheDocument();
      expect(screen.getByText('Niveles de Actividad')).toBeInTheDocument();
      expect(screen.getByText('Tipos de Alimentación')).toBeInTheDocument();
    });
  });
});
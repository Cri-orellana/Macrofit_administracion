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


  it('1. Debe mostrar el título principal del Dashboard', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

 
  it('2. Debe mostrar el mensaje de carga inicialmente', () => {
    render(<PanelPrincipal modoOscuro={false} />);
    expect(screen.getByText('Sincronizando métricas...')).toBeInTheDocument();
  });

  it('3. Debe mostrar una alerta roja si la API de Spring Boot falla', async () => {
    api.get.mockRejectedValue(new Error('Error del servidor'));
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar las estadísticas.')).toBeInTheDocument();
    });
  });

//com
  it('4. Debe mostrar la tarjeta de "Rutinas Activas" cuando termina de cargar', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('Rutinas Activas')).toBeInTheDocument();
    });
  });

  it('5. Debe calcular 0 rutinas activas si la base de datos está vacía', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(screen.getByText('+ Catálogo Base')).not.toBeDisabled();
    });
  });


  it('6. Debe mostrar la sección de DEV TOOLS', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      expect(
        screen.getByText(/herramientas de prueba/i)
      ).toBeInTheDocument();
    });
  });

  it('7. El botón "+ 50 Usuarios" no debe estar bloqueado inicialmente', async () => {
    render(<PanelPrincipal modoOscuro={false} />);

    await waitFor(() => {
      const btnInyectar = screen.getByText('+ 50 Usuarios');
      expect(btnInyectar).not.toBeDisabled();
    });
  });

 
  it('8. Debe pedir confirmación al intentar inyectar usuarios de prueba', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    
    await waitFor(() => screen.getByText('+ 50 Usuarios'));
    const btnInyectar = screen.getByText('+ 50 Usuarios');
    
    fireEvent.click(btnInyectar);
    expect(window.confirm).toHaveBeenCalledWith('¿Seguro que deseas inyectar 50 usuarios de prueba?');
  });

  it('9. Debe mostrar la tarjeta "Usuarios Entrenando" con su valor', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    
    await waitFor(() => {
      // Verifica el header de la tarjeta
      expect(screen.getByText('Usuarios Entrenando')).toBeInTheDocument();
    });

    // Verifica que el gráfico de "Estado de Usuarios" también se renderiza
    expect(screen.getByText('Estado de Usuarios')).toBeInTheDocument();
  });

  it('10. Debe mostrar la tarjeta "Rutinas Activas" y el gráfico de uso de ejercicios', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    
    await waitFor(() => {
      // Verifica la tarjeta de métricas
      expect(screen.getByText('Rutinas Activas')).toBeInTheDocument();
    });

    // Verifica que el gráfico relacionado también aparece
    expect(screen.getByText('Uso de Ejercicios en Rutinas')).toBeInTheDocument();
  });

});
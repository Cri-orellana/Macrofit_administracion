import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // <-- ¡LA MAGIA QUE ENSEÑA A VITEST A LEER EL DOM!
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PanelPrincipal from './PanelPrincipal'; 
import api from '../services/api';

// 1. Secuestramos la API y componentes complejos
vi.mock('../services/api');
vi.mock('../components/MenuNavegacion', () => ({ default: () => <nav>Menu Mock</nav> }));

// 2. Secuestramos Recharts para que no se asuste al dibujarse en una pantalla tamaño 0x0
vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 800, height: 600 }}>{children}</div>
    ),
  };
});

describe('Pruebas del PanelPrincipal (Dashboard)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Por defecto, hacemos que la API devuelva listas vacías para que no falle
    api.get.mockResolvedValue({ data: [] });
    // Simulamos window.confirm de forma segura
    window.confirm = vi.fn();
  });

  //  PRUEBA 1: Renderizado básico
  it('1. Debe mostrar el título principal del Dashboard', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    expect(screen.getByText('Panel Principal - Dashboard')).toBeInTheDocument();
  });

  //  PRUEBA 2: Estado de Carga (Spinner)
  it('2. Debe mostrar el mensaje de "Calculando estadísticas..." inicialmente', () => {
    render(<PanelPrincipal modoOscuro={false} />);
    expect(screen.getByText('Calculando estadísticas...')).toBeInTheDocument();
  });

  //  PRUEBA 3: Manejo de Errores (Mockito del Frontend)
  it('3. Debe mostrar una alerta roja si la API de Spring Boot falla', async () => {
    api.get.mockRejectedValue(new Error('Error del servidor'));
    render(<PanelPrincipal modoOscuro={false} />);
    
    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar las estadísticas.')).toBeInTheDocument();
    });
  });

  //  PRUEBA 4: Renderizado de Tarjetas después de cargar
  it('4. Debe mostrar la tarjeta de "Rutinas Activas" cuando termina de cargar', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    
    await waitFor(() => {
      expect(screen.getByText('Rutinas Activas')).toBeInTheDocument();
    });
  });

  //  PRUEBA 5: Cálculos matemáticos simples
  it('5. Debe calcular 0 rutinas activas si la base de datos está vacía', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    
    await waitFor(() => {
      const valorCero = screen.getAllByText('0');
      expect(valorCero.length).toBeGreaterThan(0);
    });
  });

  //  PRUEBA 6: Renderizado de botones Dev Tools
  it('6. Debe mostrar la sección de DEV TOOLS', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    
    await waitFor(() => {
      expect(screen.getByText('🛠️ HERRAMIENTAS DE PRUEBA (DEV TOOLS)')).toBeInTheDocument();
    });
  });

  //  PRUEBA 7: Estado inicial de botones
  it('7. El botón "+ Usuarios (50)" no debe estar bloqueado inicialmente', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    
    await waitFor(() => {
      const btnInyectar = screen.getByText('+ Usuarios (50)');
      expect(btnInyectar).not.toBeDisabled();
    });
  });

  //  PRUEBA 8: Interacción del usuario (Clics)
  it('8. Debe pedir confirmación al intentar inyectar usuarios de prueba', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    
    await waitFor(() => screen.getByText('+ Usuarios (50)'));
    const btnInyectar = screen.getByText('+ Usuarios (50)');
    
    fireEvent.click(btnInyectar);
    expect(window.confirm).toHaveBeenCalledWith('¿Seguro que deseas inyectar 50 usuarios de prueba?');
  });

  //  PRUEBA 9: Apertura de Modales
  it('9. Debe abrir el modal de gráficos al hacer clic en la tarjeta "Usuarios Entrenando"', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    
    await waitFor(() => screen.getByText('Usuarios Entrenando'));
    const tarjeta = screen.getByText('Usuarios Entrenando');
    
    fireEvent.click(tarjeta);
    expect(screen.getByText('Proporción de Usuarios Activos')).toBeInTheDocument();
  });

  //  PRUEBA 10: Cierre de Modales
  it('10. Debe cerrar el modal al presionar el botón de cerrar', async () => {
    render(<PanelPrincipal modoOscuro={false} />);
    
    await waitFor(() => screen.getByText('Rutinas Activas'));
    fireEvent.click(screen.getByText('Rutinas Activas'));
    
    const tituloModal = screen.getByText('Estado del Catálogo de Rutinas');
    expect(tituloModal).toBeInTheDocument();
    
    const btnCerrar = screen.getByLabelText('Close');
    fireEvent.click(btnCerrar);
    
    await waitFor(() => {
      expect(tituloModal).not.toBeInTheDocument();
    });
  });

});
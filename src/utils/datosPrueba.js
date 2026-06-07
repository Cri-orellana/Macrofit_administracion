export const ejerciciosPrueba = Array.from({ length: 20 }, (_, i) => ({
  nombreEjercicio: `TEST-Ejercicio ${i + 1}`,
  descripcion: `Descripción técnica del ejercicio ${i + 1}`,
  musculoObjetivo: i % 2 === 0 ? 'Pecho' : 'Espalda',
  zonaMuscular: 'Tren Superior',
  implemento: 'Mancuerna',
  nivelDificultad: 'Principiante',
  activoCatalogo: true
}));

export const rutinasPrueba = [
  { nombreRutina: 'TEST-Rutina Full Body', descripcion: 'Rutina inicial de prueba', activoCatalogo: true },
  { nombreRutina: 'TEST-Rutina Hipertrofia', descripcion: 'Rutina avanzada de prueba', activoCatalogo: true }
];
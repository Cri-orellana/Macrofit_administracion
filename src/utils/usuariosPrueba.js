// Generamos 50 usuarios de prueba programáticamente
const usuariosPrueba = Array.from({ length: 50 }, (_, i) => {
  const indice = i + 1;
  const esHombre = indice % 2 === 0;

  return {
    nom_usuario: `Usuario Prueba ${indice}`,
    // Usamos un dominio específico para identificarlos y borrarlos fácilmente después
    correo: `prueba${indice}@macrofit.test`, 
    contrasena: 'Prueba1234', // Cumple con ^(?=.*[A-Za-z])(?=.*\d).{8,}$
    rol: 'USER',
    edad: 20 + (indice % 30), // Edades entre 20 y 49
    sexo: esHombre ? 'M' : 'F',
    peso: parseFloat((60 + (indice % 40) + Math.random()).toFixed(1)), // Pesos entre 60 y 100kg
    altura: 160 + (indice % 30) // Alturas entre 160 y 189cm
  };
});

export default usuariosPrueba;
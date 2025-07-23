const inquirer = require('inquirer');
const { connectDB, closeDB } = require('./databaseConnection.js');
const {
  verTodosLosConciertos,
  buscarConcierto,
  anadirConcierto,
  actualizarConcierto,
  eliminarConcierto
} = require('./functions');


async function main() {
  const db = await connectDB();

  let run = true;
  while (run) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '¿Qué te gustaría hacer?',
        choices: [
          'Ver todos los conciertos',
          'Buscar un concierto',
          'Añadir un nuevo concierto',
          'Actualizar un concierto',
          'Eliminar un concierto',
          new inquirer.Separator(),
          'Salir'
        ],
      },
    ]);

    switch (answers.action) {
      case 'Ver todos los conciertos': await verTodosLosConciertos(db); break;
      case 'Buscar un concierto': await buscarConcierto(db); break;
      case 'Añadir un nuevo concierto': await anadirConcierto(db); break;
      case 'Actualizar un concierto': await actualizarConcierto(db); break;
      case 'Eliminar un concierto': await eliminarConcierto(db); break;
      case 'Salir': run = false; break;
      default: console.log("Opción inválida."); break;
    }
    if (run) {
      await inquirer.prompt([{ type: 'input', name: 'continue', message: '\nPresiona ENTER para volver al menú...' }]);
    }
  }

  await closeDB();
}

main();
const inquirer = require('inquirer');
const { validarTexto, validarFecha } = require('./validators');
// ===================================================================================
// FUNCIÓN DE LECTURA (READ): Muestra todos los conciertos o filtra por género y evento.
// Utiliza el operador lógico $and para combinar filtros.
// ===================================================================================
async function verTodosLosConciertos(db) {
  try {
    const answer = await inquirer.prompt({
      type: 'list',
      name: 'choice',
      message: '¿Qué deseas hacer en "Ver Conciertos"?',
      choices: [
        'Mostrar todos los conciertos',
        'Buscar por género y evento', 
        new inquirer.Separator(),
        'Volver al menú principal'
      ]
    });

    const collection = db.collection('conciertos');

    if (answer.choice === 'Mostrar todos los conciertos') {
      const conciertos = await collection.find({}).toArray();
      if (conciertos.length > 0) {
        console.log("\n--- Catálogo Completo de Conciertos ---");
        console.table(conciertos.map(c => ({
          Artista: c.artista,
          Evento: c.evento,
          Fecha: new Date(c.fecha).toLocaleDateString(),
          País: c.lugar.pais
        })));
      } else {
        console.log("No hay conciertos en el catálogo.");
      }
    } else if (answer.choice === 'Buscar por género y evento') { 
      const filters = await inquirer.prompt([
        { type: 'input', name: 'genero', message: 'Buscar por género (deja en blanco para ignorar):' },
        { type: 'input', name: 'evento', message: 'Buscar por evento (deja en blanco para ignorar):' }
      ]);

      const conditions = [];
      if (filters.genero.trim() !== '') {
        conditions.push({ genero: { $regex: filters.genero, $options: 'i' } });
      }
      if (filters.evento.trim() !== '') {
        conditions.push({ evento: { $regex: filters.evento, $options: 'i' } });
      }

      let query = {};
      if (conditions.length > 0) {
        query = { $and: conditions };
      }
      
      const conciertos = await collection.find(query).toArray();
      if (conciertos.length > 0) {
        // --- CAMBIO DE TEXTO ---
        console.log("\n--- Resultados de la Búsqueda ---");
        // --- FIN DEL CAMBIO ---
        console.table(conciertos.map(c => ({
          Artista: c.artista,
          Evento: c.evento,
          Género: c.genero,
          Fecha: new Date(c.fecha).toLocaleDateString()
        })));
      } else {
        console.log("No se encontraron conciertos que cumplan con los criterios.");
      }
    }
    
  } catch (error) {
    console.error("\n❌ Error al intentar obtener los conciertos:", error);
  }
}
// ===================================================================================
// FUNCIÓN DE LECTURA CON FILTROS (READ): Busca conciertos por diferentes criterios.
// Utiliza operadores de comparación ($regex) y lógicos ($or, $and).
// Permite buscar en campos anidados (ej: lugar.pais).
// ===================================================================================
async function buscarConcierto(db) {
  try {
    const searchFieldAnswer = await inquirer.prompt([{
      type: 'list',
      name: 'field',
      message: '¿Por qué campo te gustaría buscar?',
      choices: [
        'Palabra Clave (en Artista o Evento)',
        'Búsqueda Avanzada (Artista y País)', // <-- NUEVA OPCIÓN
        new inquirer.Separator(),
        'Artista', 
        'País', 
        'Ciudad', 
        'Evento'
      ],
    }]);

    const collection = db.collection('conciertos');
    let query;

    if (searchFieldAnswer.field === 'Búsqueda Avanzada (Artista y País)') {
      const advancedAnswers = await inquirer.prompt([
        { type: 'input', name: 'artista', message: 'Introduce el nombre del artista:' },
        { type: 'input', name: 'pais', message: 'Introduce el país:' }
      ]);

      query = {
        $and: [ 
          { artista: { $regex: advancedAnswers.artista, $options: 'i' } },
          { 'lugar.pais': { $regex: advancedAnswers.pais, $options: 'i' } }
        ]
      };
      console.log(`\n--- Búsqueda de "${advancedAnswers.artista}" en "${advancedAnswers.pais}" ---`);

    } else {
      const searchValueAnswer = await inquirer.prompt([
          { type: 'input', name: 'value', message: `Introduce el término a buscar:` }
      ]);
      const value = searchValueAnswer.value;

      if (!value.trim()) {
        console.log("No se introdujo un término de búsqueda.");
        return;
      }
      
      let userChoice = searchFieldAnswer.field;

      if (userChoice === 'Palabra Clave (en Artista o Evento)') {
        query = { $or: [ { artista: { $regex: value, $options: 'i' } }, { evento: { $regex: value, $options: 'i' } } ] };
        console.log(`\n--- Resultados para la palabra clave "${value}" ---`);
      } else {
        let dbField;
        if (userChoice === 'País') { dbField = 'lugar.pais'; } 
        else if (userChoice === 'Ciudad') { dbField = 'lugar.ciudad'; } 
        else { dbField = userChoice.toLowerCase(); }
        query = { [dbField]: { $regex: value, $options: 'i' } };
        console.log(`\n--- Resultados para "${value}" en el campo "${userChoice}" ---`);
      }
    }

    const conciertos = await collection.find(query).toArray();
    if (conciertos.length > 0) {
      console.table(conciertos.map(c => ({
        Artista: c.artista,
        Evento: c.evento,
        Fecha: new Date(c.fecha).toLocaleDateString(),
        País: c.lugar.pais,
        Ciudad: c.lugar.ciudad,
      })));
    } else {
      console.log(`No se encontraron resultados.`);
    }

  } catch (error) {
    console.error("\n❌ Error durante la búsqueda:", error);
  }
}

// ===================================================================================
// FUNCIÓN DE CREACIÓN (CREATE): Añade un nuevo documento a la base de datos.
// Incluye validación de datos de entrada para asegurar la coherencia
// y un paso de confirmación antes de guardar.
// ===================================================================================

async function anadirConcierto(db) {
  try {
    const confirmacionInicial = await inquirer.prompt([{
        type: 'confirm',
        name: 'continuar',
        message: 'Estás a punto de añadir un nuevo concierto. ¿Deseas continuar?',
        default: true
    }]);

    if (!confirmacionInicial.continuar) {
        console.log("\nOperación cancelada. Volviendo al menú principal.");
        return;
    }

    console.log("\n--- Añadir un Nuevo Concierto ---");
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'artista',
        message: 'Nombre del artista:',
        validate: (input) => validarTexto(input, 'Artista')
      },
      {
        type: 'input',
        name: 'genero',
        message: 'Género musical:',
        validate: (input) => validarTexto(input, 'Género musical')
      },
      {
        type: 'input',
        name: 'evento',
        message: 'Nombre del evento o gira:',
        validate: (input) => validarTexto(input, 'Evento')
      },
      {
        type: 'input',
        name: 'fecha',
        message: 'Fecha del concierto (YYYY-MM-DD):',
        validate: function (input) {
          const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;
          if (!formatoFecha.test(input)) {
            return 'El formato de fecha debe ser YYYY-MM-DD.';
          }
          const fecha = new Date(input);
          if (isNaN(fecha.getTime())) {
              return 'La fecha introducida no es válida.';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'recinto',
        message: 'Nombre del recinto:',
        validate: (input) => validarTexto(input, 'Recinto')
      },
      {
        type: 'input',
        name: 'ciudad',
        message: 'Ciudad:',
        validate: (input) => validarTexto(input, 'Ciudad')
      },
      {
        type: 'input',
        name: 'pais',
        message: 'País:',
        validate: (input) => validarTexto(input, 'País')
      },
    ]);

    const fechaConcierto = new Date(answers.fecha);
    const nuevoConcierto = {
      artista: answers.artista,
      genero: answers.genero,
      evento: answers.evento,
      fecha: fechaConcierto,
      lugar: { recinto: answers.recinto, ciudad: answers.ciudad, pais: answers.pais },
      miembros_banda: [],
      setlist: [],
      grabacion: { disponible: false, formato: null, calidad: null },
    };

    console.log("\n--- Resumen del nuevo concierto ---");
    console.log(`Artista: ${nuevoConcierto.artista}`);
    console.log(`Evento: ${nuevoConcierto.evento}`);
    console.log(`Fecha: ${nuevoConcierto.fecha.toLocaleDateString()}`);
    console.log("---------------------------------");
    
    const confirmacionFinal = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmar',
        message: '¿Deseas guardar este concierto?',
        default: true
    }]);

    if (!confirmacionFinal.confirmar) {
        console.log("\nOperación cancelada por el usuario.");
        return;
    }

    const collection = db.collection('conciertos');
    const result = await collection.insertOne(nuevoConcierto);

    if (result.acknowledged) {
      console.log(`\n✅ Concierto de "${nuevoConcierto.artista}" añadido con éxito.`);
    } else {
      console.log("\n❌ La base de datos no confirmó la inserción.");
    }

  } catch (error) {
    console.error("\n❌ Error al intentar añadir el concierto:", error);
  }
}

// ===================================================================================
// FUNCIÓN DE ACTUALIZACIÓN (UPDATE): Modifica un documento existente.
// Busca un documento, permite al usuario seleccionar uno de una lista,
// y luego actualiza los campos específicos, incluyendo subdocumentos.
// ===================================================================================
async function actualizarConcierto(db) {
  try {
    console.log("\n--- Actualizar un Concierto ---");
    
    const confirmacionInicial = await inquirer.prompt([{
        type: 'confirm',
        name: 'continuar',
        message: 'Estás a punto de actualizar un concierto. ¿Deseas continuar?',
        default: true
    }]);

    if (!confirmacionInicial.continuar) {
        console.log("\nOperación cancelada.");
        return;
    }

    const searchAnswer = await inquirer.prompt([{
      type: 'input',
      name: 'artista',
      message: 'Primero, busca al artista del concierto a actualizar:',
      validate: (input) => validarTexto(input, 'Búsqueda'),
    }]);

    const collection = db.collection('conciertos');
    const conciertos = await collection.find({ artista: { $regex: searchAnswer.artista, $options: 'i' } }).toArray();

    if (conciertos.length === 0) {
      console.log("No se encontraron conciertos para ese artista.");
      return;
    }

    const choices = conciertos.map(c => ({ name: `${c.artista} - ${c.evento} (${new Date(c.fecha).toLocaleDateString()})`, value: c._id }));
    choices.push(new inquirer.Separator());
    choices.push({ name: 'Cancelar', value: 'CANCELAR' });

    const choiceAnswer = await inquirer.prompt([{
      type: 'list',
      name: 'conciertoId',
      message: 'Selecciona el concierto exacto a actualizar:',
      choices: choices
    }]);

    if (choiceAnswer.conciertoId === 'CANCELAR') {
      console.log("\nOperación cancelada.");
      return;
    }
    
    const conciertoAActualizar = await collection.findOne({ _id: choiceAnswer.conciertoId });

    console.log("\nIntroduce los nuevos datos. Presiona ENTER para mantener el valor actual.");
    const updateAnswers = await inquirer.prompt([
      { type: 'input', name: 'artista', message: 'Artista:', default: conciertoAActualizar.artista, validate: (input) => validarTexto(input, 'Artista')},
      { type: 'input', name: 'evento', message: 'Evento:', default: conciertoAActualizar.evento, validate: (input) => validarTexto(input, 'Evento')},
      { type: 'input', name: 'fecha', message: 'Fecha (YYYY-MM-DD):', default: conciertoAActualizar.fecha.toISOString().split('T')[0], validate: validarFecha},
      { type: 'input', name: 'genero', message: 'Género:', default: conciertoAActualizar.genero, validate: (input) => validarTexto(input, 'Género')},
      { type: 'input', name: 'recinto', message: 'Recinto:', default: conciertoAActualizar.lugar.recinto, validate: (input) => validarTexto(input, 'Recinto')},
      { type: 'input', name: 'ciudad', message: 'Ciudad:', default: conciertoAActualizar.lugar.ciudad, validate: (input) => validarTexto(input, 'Ciudad')},
      { type: 'input', name: 'pais', message: 'País:', default: conciertoAActualizar.lugar.pais, validate: (input) => validarTexto(input, 'País')}

    ]);

    const updates = {};
      if (updateAnswers.artista !== conciertoAActualizar.artista) updates.artista = updateAnswers.artista;
    if (updateAnswers.evento !== conciertoAActualizar.evento) updates.evento = updateAnswers.evento;
    if (updateAnswers.fecha && (new Date(updateAnswers.fecha).getTime() !== conciertoAActualizar.fecha.getTime())) {
      updates.fecha = new Date(updateAnswers.fecha);
    }
    if (updateAnswers.genero !== conciertoAActualizar.genero) updates.genero = updateAnswers.genero;
    if (updateAnswers.recinto !== conciertoAActualizar.lugar.recinto) updates['lugar.recinto'] = updateAnswers.recinto;
    if (updateAnswers.ciudad !== conciertoAActualizar.lugar.ciudad) updates['lugar.ciudad'] = updateAnswers.ciudad;
    if (updateAnswers.pais !== conciertoAActualizar.lugar.pais) updates['lugar.pais'] = updateAnswers.pais;
    
    if (Object.keys(updates).length === 0) {
      console.log("\nℹ️ No se realizaron cambios.");
      return;
    }

    const result = await db.collection('conciertos').updateOne({ _id: choiceAnswer.conciertoId }, { $set: updates });

    if (result.modifiedCount > 0) {
      console.log("\n✅ Concierto actualizado con éxito.");
    } else {
      console.log("\nℹ️ No se realizaron cambios en el concierto o algo salió mal.");
    }
  } catch (error) {
    console.error("\n❌ Error al intentar actualizar el concierto:", error);
  }
}
// ===================================================================================
// FUNCIÓN DE ELIMINACIÓN (DELETE): Borra un documento de la base de datos.
// Incluye un proceso de búsqueda y selección seguro, y una confirmación
// final para evitar eliminaciones accidentales.
// ===================================================================================
async function eliminarConcierto(db) {
  try {
    console.log("\n--- Eliminar un Concierto ---");

    const searchAnswer = await inquirer.prompt([{
      type: 'input',
      name: 'artista',
      message: 'Busca al artista del concierto que quieres eliminar:',
      validate: (input) => validarTexto(input, 'Búsqueda') 
    }]);
    
    const collection = db.collection('conciertos');
    const conciertos = await collection.find({ artista: { $regex: searchAnswer.artista, $options: 'i' } }).toArray();

    if (conciertos.length === 0) {
      console.log("No se encontraron conciertos para ese artista.");
      return;
    }
    const choices = conciertos.map(c => ({ name: `${c.artista} - ${c.evento} (${new Date(c.fecha).toLocaleDateString()})`, value: c._id }));
    choices.push(new inquirer.Separator());
    choices.push({ name: 'Cancelar', value: 'CANCELAR' });

    const choiceAnswer = await inquirer.prompt([{
      type: 'list',
      name: 'conciertoId',
      message: 'Selecciona el concierto exacto que quieres eliminar:',
      choices
    }]);

    if (choiceAnswer.conciertoId === 'CANCELAR') {
      console.log("Eliminación cancelada.");
      return;
    }
    
    const confirmAnswer = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmar',
      message: '¿Estás seguro? Esta acción no se puede deshacer.',
      default: false
    }]);

    if (!confirmAnswer.confirmar) {
      console.log("Eliminación cancelada.");
      return;
    }
    const result = await db.collection('conciertos').deleteOne({ _id: choiceAnswer.conciertoId });

    if (result.deletedCount > 0) {
      console.log("\n✅ Concierto eliminado con éxito.");
    } else {
      console.log("\n❌ No se pudo eliminar el concierto.");
    }
  } catch (error) {
    console.error("\n❌ Error al eliminar el concierto:", error);
    }
  }


module.exports = {
  verTodosLosConciertos,
  buscarConcierto,
  anadirConcierto,
  actualizarConcierto,
  eliminarConcierto
};
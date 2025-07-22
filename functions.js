const inquirer = require('inquirer');
const { ObjectId } = require('mongodb');

// Tu función de validación, sin cambios.
const validarTexto = (input, nombreCampo) => {
  if (input.trim() === '') {
    return `El campo '${nombreCampo}' no puede estar vacío.`;
  }
  if (/^\d+$/.test(input)) {
    return `El campo '${nombreCampo}' no puede ser solo un número.`;
  }
  return true;
};

// Función para validar la fecha, necesaria para las otras funciones.
const validarFecha = (input) => {
  // Permite que esté vacío para no forzar una actualización
  if (input.trim() === '') return true;

  const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;
  if (!formatoFecha.test(input)) {
    return 'El formato de fecha debe ser YYYY-MM-DD.';
  }
  const fecha = new Date(input);
  if (isNaN(fecha.getTime())) {
    return 'La fecha introducida no es válida.';
  }
  return true;
};

async function verTodosLosConciertos(db) {
  try {
    const collection = db.collection('conciertos');
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
  } catch (error) {
    console.error("\n❌ Error al intentar obtener los conciertos:", error);
  }
}

async function buscarConcierto(db) {
  try {
    const searchFieldAnswer = await inquirer.prompt([{
      type: 'list',
      name: 'field',
      message: '¿Por qué campo te gustaría buscar?',
      choices: ['Artista', 'País', 'Ciudad', 'Evento'],
    }]);

    const searchValueAnswer = await inquirer.prompt([{
      type: 'input',
      name: 'value',
      message: `Introduce el ${searchFieldAnswer.field} a buscar:`,
    }]);
    
    const field = searchFieldAnswer.field.toLowerCase();
    const value = searchValueAnswer.value;

    if (!value.trim()) {
      console.log("No se introdujo un término de búsqueda.");
      return;
    }

    const queryField = field.startsWith('pa') || field.startsWith('ci') ? `lugar.${field}` : field;
    const query = { [queryField]: { $regex: value, $options: 'i' } };

    const collection = db.collection('conciertos');
    const conciertos = await collection.find(query).toArray();

    if (conciertos.length > 0) {
      console.log(`\n--- Resultados para "${value}" en el campo "${field}" ---`);
      console.table(conciertos.map(c => ({
        Artista: c.artista,
        Evento: c.evento,
        Fecha: new Date(c.fecha).toLocaleDateString(),
        País: c.lugar.pais,
        Ciudad: c.lugar.ciudad,
      })));
    } else {
      console.log(`No se encontraron resultados para "${value}".`);
    }

  } catch (error) {
    console.error("\n❌ Error durante la búsqueda:", error);
  }
}

// TU FUNCIÓN AÑADIR CONCIERTO, EXACTAMENTE COMO LA PEDISTE
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
      
      // --- INICIO DE LA CORRECCIÓN: PREGUNTAS AÑADIDAS ---
      { type: 'input', name: 'genero', message: 'Género:', default: conciertoAActualizar.genero, validate: (input) => validarTexto(input, 'Género')},
      { type: 'input', name: 'recinto', message: 'Recinto:', default: conciertoAActualizar.lugar.recinto, validate: (input) => validarTexto(input, 'Recinto')},
      { type: 'input', name: 'ciudad', message: 'Ciudad:', default: conciertoAActualizar.lugar.ciudad, validate: (input) => validarTexto(input, 'Ciudad')},
      { type: 'input', name: 'pais', message: 'País:', default: conciertoAActualizar.lugar.pais, validate: (input) => validarTexto(input, 'País')}
      // --- FIN DE LA CORRECCIÓN ---
    ]);

    const updates = {};
    // Compara cada campo y lo añade al objeto 'updates' solo si cambió
    if (updateAnswers.artista !== conciertoAActualizar.artista) updates.artista = updateAnswers.artista;
    if (updateAnswers.evento !== conciertoAActualizar.evento) updates.evento = updateAnswers.evento;
    if (updateAnswers.fecha && (new Date(updateAnswers.fecha).getTime() !== conciertoAActualizar.fecha.getTime())) {
      updates.fecha = new Date(updateAnswers.fecha);
    }
    
    // --- INICIO DE LA CORRECCIÓN: LÓGICA DE ACTUALIZACIÓN AÑADIDA ---
    if (updateAnswers.genero !== conciertoAActualizar.genero) updates.genero = updateAnswers.genero;
    // Para los campos anidados en 'lugar', usamos la notación con punto
    if (updateAnswers.recinto !== conciertoAActualizar.lugar.recinto) updates['lugar.recinto'] = updateAnswers.recinto;
    if (updateAnswers.ciudad !== conciertoAActualizar.lugar.ciudad) updates['lugar.ciudad'] = updateAnswers.ciudad;
    if (updateAnswers.pais !== conciertoAActualizar.lugar.pais) updates['lugar.pais'] = updateAnswers.pais;
    // --- FIN DE LA CORRECCIÓN ---
    
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

async function eliminarConcierto(db) {
  try {
    console.log("\n--- Eliminar un Concierto ---");

    // --- INICIO DE LA MEJORA ---
    const searchAnswer = await inquirer.prompt([{
      type: 'input',
      name: 'artista',
      message: 'Busca al artista del concierto que quieres eliminar:',
      // Se añade validación para evitar búsquedas vacías
      validate: (input) => validarTexto(input, 'Búsqueda') 
    }]);
    // --- FIN DE LA MEJORA ---
    
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
    // La opción de salir con 's' también funcionará aquí gracias a 'validarTexto'
    if (error.message === 'SALIR') {
        console.log("\nOperación cancelada. Volviendo al menú principal.");
    } else {
        console.error("\n❌ Error al eliminar el concierto:", error);
    }
  }
}

module.exports = {
  verTodosLosConciertos,
  buscarConcierto,
  anadirConcierto,
  actualizarConcierto,
  eliminarConcierto
};
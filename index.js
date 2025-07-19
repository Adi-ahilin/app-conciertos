// Importar las herramientas necesarias
const { MongoClient, ObjectId } = require('mongodb');
const inquirer = require('inquirer');

// ---- CONFIGURACIÓN ----
const uri = "mongodb+srv://Adi:151217Ar.@clusteradi.lfk227c.mongodb.net/catalogoMusical?retryWrites=true&w=majority";
const dbName = 'catalogoMusical';
// --------------------

// Función para ver todos los conciertos
async function verTodosLosConciertos(client) {
  const collection = client.db(dbName).collection('conciertos');
  const conciertos = await collection.find({}).toArray();
  if (conciertos.length > 0) {
    console.log("\n--- Catálogo Completo de Conciertos ---");
    console.table(conciertos.map(c => ({ Artista: c.artista, Evento: c.evento, Fecha: new Date(c.fecha).toLocaleDateString(), País: c.lugar.pais })));
  } else { console.log("No hay conciertos en el catálogo."); }
}

// Función para buscar un concierto por artista
async function buscarConcierto(client) {
  const answers = await inquirer.prompt([{ type: 'input', name: 'artista', message: '¿Qué artista quieres buscar?' }]);
  const artistaBuscado = answers.artista;
  const collection = client.db(dbName).collection('conciertos');
  const query = { artista: { $regex: artistaBuscado, $options: 'i' } };
  const conciertos = await collection.find(query).toArray();
  if (conciertos.length > 0) {
    console.log(`\n--- Conciertos encontrados de "${artistaBuscado}" ---`);
    console.table(conciertos.map(c => ({ Artista: c.artista, Evento: c.evento, Fecha: new Date(c.fecha).toLocaleDateString(), País: c.lugar.pais })));
  } else { console.log(`No se encontraron conciertos del artista "${artistaBuscado}".`); }
}

// Función para añadir un concierto
async function anadirConcierto(client) {
  console.log("\n--- Añadir un Nuevo Concierto ---");
  const answers = await inquirer.prompt([
    { type: 'input', name: 'artista', message: 'Nombre del artista:' },
    { type: 'input', name: 'genero', message: 'Género musical:' },
    { type: 'input', name: 'evento', message: 'Nombre del evento o gira:' },
    { type: 'input', name: 'fecha', message: 'Fecha del concierto (YYYY-MM-DD):' },
    { type: 'input', name: 'recinto', message: 'Nombre del recinto:' },
    { type: 'input', name: 'ciudad', message: 'Ciudad:' },
    { type: 'input', name: 'pais', message: 'País:' },
  ]);

  const nuevoConcierto = {
    artista: answers.artista,
    genero: answers.genero,
    evento: answers.evento,
    fecha: new Date(answers.fecha),
    lugar: { recinto: answers.recinto, ciudad: answers.ciudad, pais: answers.pais },
    miembros_banda: [],
    setlist: [],
    grabacion: { disponible: false, formato: null, calidad: null },
  };

  const collection = client.db(dbName).collection('conciertos');
  const result = await collection.insertOne(nuevoConcierto);
  if (result.acknowledged) {
    console.log(`\n✅ Concierto de "${nuevoConcierto.artista}" añadido con éxito.`);
  } else {
    console.log("\n❌ No se pudo añadir el concierto.");
  }
}

// Función para actualizar un concierto
async function actualizarConcierto(client) {
  console.log("\n--- Actualizar un Concierto ---");
  const searchAnswer = await inquirer.prompt([{ type: 'input', name: 'artista', message: 'Primero, busca al artista del concierto que quieres actualizar:' }]);
  
  const collection = client.db(dbName).collection('conciertos');
  const conciertos = await collection.find({ artista: { $regex: searchAnswer.artista, $options: 'i' } }).toArray();

  if (conciertos.length === 0) {
    console.log("No se encontraron conciertos para ese artista.");
    return;
  }

  const choices = conciertos.map(c => ({ name: `${c.artista} - ${c.evento} (${new Date(c.fecha).getFullYear()})`, value: c._id }));
  const choiceAnswer = await inquirer.prompt([{ type: 'list', name: 'conciertoId', message: 'Selecciona el concierto exacto que quieres actualizar:', choices }]);
  
  const updateAnswers = await inquirer.prompt([
    { type: 'input', name: 'nuevoEvento', message: 'Nuevo nombre del evento (deja en blanco para no cambiar):' },
    { type: 'input', name: 'nuevaFecha', message: 'Nueva fecha (YYYY-MM-DD) (deja en blanco para no cambiar):' }
  ]);

  const updates = {};
  if (updateAnswers.nuevoEvento) updates.evento = updateAnswers.nuevoEvento;
  if (updateAnswers.nuevaFecha) updates.fecha = new Date(updateAnswers.nuevaFecha);

  if (Object.keys(updates).length === 0) {
    console.log("No se proporcionaron datos para actualizar.");
    return;
  }

  const result = await collection.updateOne({ _id: choiceAnswer.conciertoId }, { $set: updates });

  if (result.modifiedCount > 0) {
    console.log("\n✅ Concierto actualizado con éxito.");
  } else {
    console.log("\n❌ No se pudo actualizar el concierto o no se hicieron cambios.");
  }
}

// NUEVA FUNCIÓN para eliminar un concierto
async function eliminarConcierto(client) {
  console.log("\n--- Eliminar un Concierto ---");
  // 1. Buscar el concierto a eliminar
  const searchAnswer = await inquirer.prompt([{ type: 'input', name: 'artista', message: 'Busca al artista del concierto que quieres eliminar:' }]);
  
  const collection = client.db(dbName).collection('conciertos');
  const conciertos = await collection.find({ artista: { $regex: searchAnswer.artista, $options: 'i' } }).toArray();

  if (conciertos.length === 0) {
    console.log("No se encontraron conciertos para ese artista.");
    return;
  }

  // 2. Permitir al usuario elegir cuál
  const choices = conciertos.map(c => ({ name: `${c.artista} - ${c.evento} (${new Date(c.fecha).getFullYear()})`, value: c._id }));
  const choiceAnswer = await inquirer.prompt([{ type: 'list', name: 'conciertoId', message: 'Selecciona el concierto exacto que quieres eliminar:', choices }]);
  
  // 3. Confirmación final
  const confirmAnswer = await inquirer.prompt([{ type: 'confirm', name: 'confirmar', message: '¿Estás seguro de que quieres eliminar este concierto? Esta acción no se puede deshacer.', default: false }]);

  if (!confirmAnswer.confirmar) {
    console.log("Eliminación cancelada.");
    return;
  }

  // 4. Ejecutar la eliminación en la BD
  const result = await collection.deleteOne({ _id: choiceAnswer.conciertoId });

  if (result.deletedCount > 0) {
    console.log("\n✅ Concierto eliminado con éxito.");
  } else {
    console.log("\n❌ No se pudo eliminar el concierto.");
  }
}

// Función principal
async function main() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("¡Bienvenido a tu Catálogo Musical de Conciertos! ✅\n");

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
        case 'Ver todos los conciertos': await verTodosLosConciertos(client); break;
        case 'Buscar un concierto': await buscarConcierto(client); break;
        case 'Añadir un nuevo concierto': await anadirConcierto(client); break;
        case 'Actualizar un concierto': await actualizarConcierto(client); break;
        case 'Eliminar un concierto': 
          // LLAMAMOS A LA NUEVA FUNCIÓN DE ELIMINAR
          await eliminarConcierto(client);
          break;
        case 'Salir': run = false; break;
        default: console.log("Opción no implementada aún."); break;
      }
      if (run) {
        await inquirer.prompt([{ type: 'input', name: 'continue', message: '\nPresiona ENTER para volver al menú...' }]);
      }
    }
  } catch (error) {
    console.error("Error en la aplicación:", error);
  } finally {
    await client.close();
    console.log("\nGracias por usar el catálogo. ¡Hasta pronto! 👋");
  }
}

// Llamar a la función principal
main();
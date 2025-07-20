const inquirer = require('inquirer');
const { ObjectId } = require('mongodb');

async function verTodosLosConciertos(db) {
  const collection = db.collection('conciertos');
  const conciertos = await collection.find({}).toArray();
  if (conciertos.length > 0) {
    console.log("\n--- Catálogo Completo de Conciertos ---");
    console.table(conciertos.map(c => ({ Artista: c.artista, Evento: c.evento, Fecha: new Date(c.fecha).toLocaleDateString(), País: c.lugar.pais })));
  } else { console.log("No hay conciertos en el catálogo."); }
}

async function buscarConcierto(db) {
  const answers = await inquirer.prompt([{ type: 'input', name: 'artista', message: '¿Qué artista quieres buscar? (Presiona Enter para ver todos los artistas)' }]);
  const artistaBuscado = answers.artista;
  const collection = db.collection('conciertos');
  const query = { artista: { $regex: artistaBuscado, $options: 'i' } };
  const conciertos = await collection.find(query).toArray();
  if (conciertos.length > 0) {
    console.log(`\n--- Conciertos encontrados de "${artistaBuscado}" ---`);
    console.table(conciertos.map(c => ({ Artista: c.artista, Evento: c.evento, Fecha: new Date(c.fecha).toLocaleDateString(), País: c.lugar.pais })));
  } else { console.log(`No se encontraron conciertos del artista "${artistaBuscado}".`); }
}

async function anadirConcierto(db) {
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
  const collection = db.collection('conciertos');
  const result = await collection.insertOne(nuevoConcierto);
  if (result.acknowledged) {
    console.log(`\n✅ Concierto de "${nuevoConcierto.artista}" añadido con éxito.`);
  } else {
    console.log("\n❌ No se pudo añadir el concierto.");
  }
}

async function actualizarConcierto(db) {
  console.log("\n--- Actualizar un Concierto ---");
  const searchAnswer = await inquirer.prompt([{ type: 'input', name: 'artista', message: 'Primero, busca al artista del concierto que quieres actualizar:' }]);
  
  const collection = db.collection('conciertos');
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
  const result = await db.collection('conciertos').updateOne({ _id: choiceAnswer.conciertoId }, { $set: updates });

  if (result.modifiedCount > 0) {
    console.log("\n✅ Concierto actualizado con éxito.");
  } else {
    console.log("\n❌ No se pudo actualizar el concierto o no se hicieron cambios.");
  }
}

async function eliminarConcierto(db) {
  console.log("\n--- Eliminar un Concierto ---");
  const searchAnswer = await inquirer.prompt([{ type: 'input', name: 'artista', message: 'Busca al artista del concierto que quieres eliminar:' }]);
  
  const collection = db.collection('conciertos');
  const conciertos = await collection.find({ artista: { $regex: searchAnswer.artista, $options: 'i' } }).toArray();

  if (conciertos.length === 0) {
    console.log("No se encontraron conciertos para ese artista.");
    return;
  }
  const choices = conciertos.map(c => ({ name: `${c.artista} - ${c.evento} (${new Date(c.fecha).getFullYear()})`, value: c._id }));
  const choiceAnswer = await inquirer.prompt([{ type: 'list', name: 'conciertoId', message: 'Selecciona el concierto exacto que quieres eliminar:', choices }]);
  
  const confirmAnswer = await inquirer.prompt([{ type: 'confirm', name: 'confirmar', message: '¿Estás seguro? Esta acción no se puede deshacer.', default: false }]);

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
}

module.exports = {
  verTodosLosConciertos,
  buscarConcierto,
  anadirConcierto,
  actualizarConcierto,
  eliminarConcierto
};
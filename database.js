const { MongoClient } = require('mongodb');

// ---- CONFIGURACIÓN ----
const uri = "mongodb+srv://Adi:151217Ar.@clusteradi.lfk227c.mongodb.net/catalogoMusical?retryWrites=true&w=majority";
const dbName = 'catalogoMusical';
// --------------------

const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("¡Bienvenido a tu Catálogo Musical de Conciertos! ✅\n");
    return client.db(dbName);
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
    process.exit(1); // Salir del programa si no se puede conectar
  }
}

async function closeDB() {
  try {
    await client.close();
    console.log("\nGracias por usar el catálogo. ¡Hasta pronto! 👋");
  } catch (error) {
    console.error("Error al cerrar la conexión:", error);
  }
}

module.exports = { connectDB, closeDB };
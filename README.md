Catálogo Musical de Conciertos (Aplicación de Consola)

Este es un proyecto académico desarrollado en Node.js que implementa una aplicación de consola para gestionar una base de datos de conciertos en MongoDB. 
La aplicación permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) de forma interactiva.

## Características

* **Conexión Segura**: Utiliza variables de entorno (`.env`) para gestionar la cadena de conexión a MongoDB Atlas de forma segura.
* **Operaciones CRUD Completas**:
    * **Crear**: Añadir nuevos conciertos al catálogo con validación de datos.
    * **Leer**: Ver una lista completa de todos los conciertos o buscar conciertos específicos con filtros avanzados.
    * **Actualizar**: Modificar la información de un concierto existente.
    * **Eliminar**: Borrar un concierto de la base de datos con una confirmación de seguridad.
* **Búsquedas Avanzadas**: Implementa el uso de operadores de consulta (`$regex`) y lógicos (`$or`, `$and`) de MongoDB para realizar búsquedas flexibles por múltiples campos.
* **Interfaz Interactiva**: Construida con `inquirer` para una experiencia de usuario amigable en la terminal.
* **Código Modular**: El código está organizado en módulos con responsabilidades únicas (`databaseConnection.js`, `validators.js`, `crudOperations.js`), siguiendo buenas prácticas de desarrollo.

## Tecnologías Utilizadas

* **Node.js**: Entorno de ejecución de JavaScript.
* **MongoDB**: Base de datos NoSQL para almacenar los datos.
* **Inquirer**: Para la interfaz de línea de comandos interactiva.
* **Dotenv**: Para el manejo de variables de entorno.
* **MongoDB Node.js Driver**: Para la conexión y operaciones con la base de datos.

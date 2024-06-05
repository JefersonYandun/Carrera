const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(cors()); // Habilitar CORS 
app.use(express.json());

const dataCarreraFilePath = path.join(__dirname, 'datacarrera.json');
const infoCarreraFilePath = path.join(__dirname, 'infocarrera.json');
const historialCarreraFilePath = path.join(__dirname, 'historialcarrera.json');

// Función leer datos archivo JSON
const leerDatos = (filePath) => {
    try {
        const rawData = fs.readFileSync(filePath);
        return JSON.parse(rawData);
    } catch (error) {
        console.error(`Error al leer el archivo ${filePath}:`, error);
        return [];
    }
};

// Función escribir datos JSON
const escribirDatos = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error al escribir datos en el archivo ${filePath}:`, error);
    }
};

// Función generar velocidad aleatoria entre 1 y 10
const generarVelocidad = () => Math.floor(Math.random() * 10) + 1;

const simularCarrera = (corredores, distanciaTotal) => {
    const historial = [];
    let maxHoras = 0;

    // Calcula el tiempo necesario para cada corredor y el tiempo máximo de carrera
    corredores.forEach(corredor => {
        const tiempoNecesario = distanciaTotal / corredor.velocidad;
        const horasNecesarias = Math.ceil(tiempoNecesario);
        maxHoras = Math.max(maxHoras, horasNecesarias);
    });

    for (let hora = 1; hora <= maxHoras; hora++) {
        corredores.forEach(corredor => {
            corredor.posicion += corredor.velocidad;
            if (corredor.posicion > distanciaTotal) {
                corredor.posicion = distanciaTotal;
            }
        });

        historial.push({
            horas: hora,
            posiciones: corredores.map(corredor => ({
                id: corredor.id,
                nombre: corredor.nombre,
                posicion: corredor.posicion,
                kmRecorridos: corredor.posicion
            }))
        });
    }

    corredores.sort((a, b) => {
        if (b.posicion === a.posicion) {
            return b.velocidad - a.velocidad;
        }
        return b.posicion - a.posicion;
    });

    return { horas: maxHoras, posiciones: corredores, historial };
};

// Rutas del servidor

// Obtener la lista de corredores
app.get('/corredores', (req, res) => {
    const corredores = leerDatos(dataCarreraFilePath);
    res.json(corredores);
});

// Agregar un nuevo corredor
app.post('/corredores', (req, res) => {
    const { nombre } = req.query;
    if (!nombre) {
        return res.status(400).json({ error: 'Se requiere el nombre del corredor' });
    }
    const corredores = leerDatos(dataCarreraFilePath);
    const nuevoCorredor = {
        id: corredores.length ? corredores[corredores.length - 1].id + 1 : 1,
        nombre
    };
    corredores.push(nuevoCorredor);
    escribirDatos(dataCarreraFilePath, corredores);
    res.status(201).json(nuevoCorredor);
});

// Actualizar el nombre de un corredor
app.put('/corredores/:id', (req, res) => {
    const { id } = req.params;
    const { nombre } = req.query;
    let corredores = leerDatos(dataCarreraFilePath);
    const index = corredores.findIndex(corredor => corredor.id == id);
    if (index === -1) {
        return res.status(404).json({ error: 'Corredor no encontrado' });
    }
    if (nombre) corredores[index].nombre = nombre;
    escribirDatos(dataCarreraFilePath, corredores);
    res.json(corredores[index]);
});

// Eliminar un corredor
app.delete('/corredores/:id', (req, res) => {
    const { id } = req.params;
    let corredores = leerDatos(dataCarreraFilePath);
    corredores = corredores.filter(corredor => corredor.id != id);
    escribirDatos(dataCarreraFilePath, corredores);
    res.status(204).send();
});

// Simular la carrera
app.post('/simular', (req, res) => {
    const { numeroCorredores, distanciaCarrera } = req.query;
    if (!numeroCorredores || !distanciaCarrera) {
        return res.status(400).json({ error: 'Se requiere el número de corredores y la distancia de carrera' });
    }

    let corredores = leerDatos(dataCarreraFilePath);
    corredores = corredores.slice(0, parseInt(numeroCorredores));
    corredores.forEach(corredor => {
        corredor.posicion = 0;
        corredor.velocidad = generarVelocidad();
    });

    const { horas, posiciones, historial } = simularCarrera(corredores, parseFloat(distanciaCarrera));
    const ganador = posiciones[0];
    escribirDatos(infoCarreraFilePath, { distanciaTotal: parseFloat(distanciaCarrera), horas, ganador });
    escribirDatos(historialCarreraFilePath, historial);

    res.json({ horas, posiciones, ganador });
});

// Obtener el historial de la simulación
app.get('/historial', (req, res) => {
    const historial = leerDatos(historialCarreraFilePath);
    res.json(historial);
});

// Iniciar el servidor
app.listen(3000, () => {
    console.log("El servidor está ejecutándose en el puerto 3000");
});

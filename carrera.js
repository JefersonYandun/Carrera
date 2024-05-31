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

const leerDatos = (filePath) => {
    try {
        const rawData = fs.readFileSync(filePath);
        return JSON.parse(rawData);
    } catch (error) {
        console.error(`Error al leer el archivo ${filePath}:`, error);
        return [];
    }
};

const escribirDatos = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error al escribir datos en el archivo ${filePath}:`, error);
    }
};

const generarVelocidad = () => Math.floor(Math.random() * 10) + 1;

const simularCarrera = (corredores, distanciaTotal) => {
    let horas = 0;
    const posiciones = corredores.map(corredor => ({ ...corredor, posicion: 0 }));
    const historial = [];

    while (!posiciones.some(corredor => corredor.posicion >= distanciaTotal)) {
        horas++;
        for (const corredor of posiciones) {
            corredor.posicion += corredor.velocidad;
            if (corredor.posicion >= distanciaTotal) {
                corredor.posicion = distanciaTotal;
            }
        }
        historial.push({
            horas,
            posiciones: JSON.parse(JSON.stringify(posiciones))
        });
        console.log(`\nPosiciones después de ${horas} horas:`);
        posiciones.forEach(corredor => console.log(`${corredor.nombre}: ${corredor.posicion.toFixed(2)} km`));
    }

    posiciones.sort((a, b) => b.posicion - a.posicion);
    return { horas, posiciones, historial };
};

// GET /corredores - Obtener la lista de corredores

//http://localhost:3000/corredores
app.get('/corredores', (req, res) => {
    const corredores = leerDatos(dataCarreraFilePath);
    res.json(corredores);
});

// POST /corredores - Agregar un nuevo corredor
//http://localhost:3000/corredores?nombre=CORREDOR%20CIETE
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

// PUT /corredores/:id - Actualizar el nombre de un corredor
//http://localhost:3000/corredores/4?nombre=VEGETA

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

// DELETE /corredores/:id - Eliminar un corredor
//http://localhost:3000/corredores/3

app.delete('/corredores/:id', (req, res) => {
    const { id } = req.params;
    let corredores = leerDatos(dataCarreraFilePath);
    corredores = corredores.filter(corredor => corredor.id != id);
    escribirDatos(dataCarreraFilePath, corredores);
    res.status(204).send();
});

// POST /simular - Simular la carrera
//http://localhost:3000/simular?numeroCorredores=5&distanciaCarrera=15

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

// GET /historial - Obtener el historial de la simulación
//http://localhost:3000/historial

app.get('/historial', (req, res) => {
    const historial = leerDatos(historialCarreraFilePath);
    res.json(historial);
});



// Iniciar el servidor
app.listen(3000, () => { 
    console.log("El servidor está ejecutándose en el puerto 3000");
});
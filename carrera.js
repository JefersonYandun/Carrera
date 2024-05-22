const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

const dataFilePath = path.join(__dirname, 'datacarrera.json');

const leerDatos = () => {
    try {
        const rawData = fs.readFileSync(dataFilePath);
        return JSON.parse(rawData);
    } catch (error) {
        console.error("Error al leer el archivo:", error);
        return [];
    }
};

const escribirDatos = (data) => {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error al escribir datos en el archivo:", error);
    }
};

app.get('/carrera', (req, res) => {
    const corredores = leerDatos();
    res.json(corredores);
});

app.post('/carrera', (req, res) => {
    const corredores = leerDatos();
    const { nombre, distancia } = req.query;

    if (!nombre || !distancia) {
        return res.status(400).json({ error: 'Se requiere nombre y distancia' });
    }

    const velocidad = Math.max(1, Math.random() * 10).toFixed(2);
    const newCorredor = {
        id: corredores.length ? corredores[corredores.length - 1].id + 1 : 1,
        nombre,
        distancia,
        velocidad,
        posicion: 0
    };
    
    corredores.push(newCorredor);
    escribirDatos(corredores);
    res.status(201).json(newCorredor);
});

app.put('/carrera', (req, res) => {
    let corredores = leerDatos();
    const idToUpdate = parseInt(req.query.id, 10);
    const corredorIndex = corredores.findIndex(corredor => corredor.id === idToUpdate);

    if (corredorIndex === -1) {
        return res.status(404).json({ error: 'Corredor no encontrado' });
    }

    if (req.query.nombre !== undefined) {
        corredores[corredorIndex].nombre = req.query.nombre;
    }
    if (req.query.distancia !== undefined) {
        corredores[corredorIndex].distancia = req.query.distancia;
    }
    if (req.query.velocidad !== undefined) {
        corredores[corredorIndex].velocidad = req.query.velocidad;
    }

    escribirDatos(corredores);
    res.json(corredores[corredorIndex]);
});

app.delete('/carrera', (req, res) => {
    let corredores = leerDatos();
    const idToDelete = parseInt(req.query.id, 10);
    corredores = corredores.filter(corredor => corredor.id !== idToDelete);
    escribirDatos(corredores);
    res.status(204).send();
});

// Iniciar el servidor
app.listen(3000, () => { 
    console.log("El servidor está ejecutándose en el puerto 3000");
});
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

const dataCarreraFilePath = path.join(__dirname, 'datacarrera.json');
const infoCarreraFilePath = path.join(__dirname, 'infocarrera.json');

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

    while (!posiciones.some(corredor => corredor.posicion >= distanciaTotal)) {
        horas++;
        for (const corredor of posiciones) {
            corredor.posicion += corredor.velocidad;
            if (corredor.posicion >= distanciaTotal) {
                corredor.posicion = distanciaTotal;
            }
        }
        console.log(`\nPosiciones después de ${horas} horas:`);
        posiciones.forEach(corredor => console.log(`${corredor.nombre}: ${corredor.posicion.toFixed(2)} km`));
    }

    posiciones.sort((a, b) => b.posicion - a.posicion);
    return { horas, posiciones };
};

app.all('/carrera', (req, res) => {
    let corredores = leerDatos(dataCarreraFilePath);

    switch (req.method) {
        case 'GET':
            res.json(corredores);
            break;

        case 'POST':
            const { nombre, distancia } = req.query;
            if (!nombre || !distancia) {
                return res.status(400).json({ error: 'Se requiere nombre y distancia' });
            }
            const nuevoCorredor = {
                id: corredores.length ? corredores[corredores.length - 1].id + 1 : 1,
                nombre,
                distancia: parseFloat(distancia),
                velocidad: generarVelocidad()
            };
            corredores.push(nuevoCorredor);
            escribirDatos(dataCarreraFilePath, corredores);
            res.status(201).json(nuevoCorredor);
            break;

        case 'PUT':
            // Código para actualizar corredor
            break;

        case 'DELETE':
            // Código para eliminar corredor
            break;

        default:
            res.status(405).send({ error: 'Método no permitido' });
    }
});

app.post('/simular', (req, res) => {
    const { distanciaCarrera } = req.query;
    if (!distanciaCarrera) {
        return res.status(400).json({ error: 'Se requiere distancia de carrera' });
    }

    let corredores = leerDatos(dataCarreraFilePath);
    const { horas, posiciones } = simularCarrera(corredores, parseFloat(distanciaCarrera));
    const ganador = posiciones[0]; // El primer corredor en la lista es el ganador
    escribirDatos(infoCarreraFilePath, { distanciaTotal: parseFloat(distanciaCarrera), horas, ganador });

    res.json({ horas, posiciones, ganador });
});

app.listen(port, () => { 
    console.log(`El servidor está ejecutándose en el puerto ${port}`);
});


// Iniciar el servidor
app.listen(3000, () => { 
    console.log("El servidor está ejecutándose en el puerto 3000");
});
const express = require("express");
const cors = require("cors");
const ping = require("ping");
const impressoras = require("./impressoras.json");

const app = express();
app.use(cors());

app.get("/status", async (req, res) => {
    const resultados = [];

    for (let imp of impressoras) {
        const resposta = await ping.promise.probe(imp.ip, { timeout: 1 });

        resultados.push({
            nome: imp.nome,
            ip: imp.ip,
            urgente: imp.urgente || false,
            online: resposta.alive,
            tempo: resposta.time
        });
    }

    res.json(resultados);
});

app.listen(3000, () => {
    console.log("Backend rodando em http://localhost:3000/status");
});

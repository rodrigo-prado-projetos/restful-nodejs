const express = require('express')

const knex = require('knex')({
    client: 'pg',
    debug: true,
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    }
});

let apiRouter = express.Router()
const endpoint = '/'

apiRouter.get(endpoint + 'produtos', (req, res) => {
    knex.select('*').from('produto')
        .then(produtos => res.status(200).json(produtos))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao recuperar produtos - ' + err.message
            })
        })
})

apiRouter.get(endpoint + 'produtos/:id', (req, res) => {
    knex.select('*').from('produto').where( { id: req.path.id })
        .then(produtos => res.status(200).json(produtos))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao recuperar produtos - ' + err.message
            })
        })
})

module.exports = apiRouter;
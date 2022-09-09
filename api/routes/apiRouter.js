const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require("dotenv").config();


let checkToken = (req, res, next) => {
    let authToken = req.headers["authorization"]
    if (!authToken) {
        res.status(401).json({ message: 'Token de acesso requerida' })
    }
    else {
        let token = authToken.split(' ')[1]
        req.token = token
    }
    jwt.verify(req.token, process.env.SECRET_KEY, (err, decodeToken) => {
        if (err) {
            res.status(401).json({ message: 'Acesso negado' })
            return
        }
        req.usuarioId = decodeToken.id
        next()
    })
}

let isAdmin = (req, res, next) => {
    knex
        .select('*').from('usuario').where({ id: req.usuarioId })
        .then((usuarios) => {
            if (usuarios.length) {
                let usuario = usuarios[0]
                let roles = usuario.roles.split(';')
                let adminRole = roles.find(i => i === 'ADMIN')
                if (adminRole === 'ADMIN') {
                    next()
                    return
                }
                else {
                    res.status(403).json({ message: 'Role de ADMIN requerida' })
                    return
                }
            }
        })
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao verificar roles de usuário - ' + err.message
            })
        })
}

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


apiRouter.post(endpoint + 'produtos', (req, res) => {
    knex('produto')
        .update({
            descricao: req.body.descricao,
            valor: req.body.valor,
            marca: req.body.marca
        }, ['id'])
        .then((result) => {
            let produtos = result[0]
            res.status(200).json({ "id": produtos.id })
            return
        })
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao registrar produtos - ' + err.message
            })
        })
})

apiRouter.put(endpoint + 'produtos', (req, res) => {
    knex('produto')
        .insert({
            id: req.body.id,
            descricao: req.body.descricao,
            valor: req.body.valor,
            marca: req.body.marca
        }, ['id'])
        .then((result) => {
            let produtos = result[0]
            res.status(200).json({ "id": produtos.id })
            return
        })
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao alterar produtos - ' + err.message
            })
        })
})

apiRouter.delete(endpoint + 'produtos/:id', checkToken, (req, res) => {
    knex.delete('*').from('produto').where({ id: req.params.id })
        .then(produtos => res.status(200).json(produtos))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao deletar produto - ' + err.message
            })
        })
})


apiRouter.get(endpoint + 'produtos', checkToken, (req, res) => {
    knex.select('*').from('produto')
        .then(produtos => res.status(200).json(produtos))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao recuperar produtos - ' + err.message
            })
        })
})

apiRouter.get(endpoint + 'produtos/:id', checkToken, (req, res) => {
    knex.select('*').from('produto').where({ id: req.params.id })
        .then(produtos => res.status(200).json(produtos))
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao recuperar produtos - ' + err.message
            })
        })
})


apiRouter.post(endpoint + 'seguranca/register', (req, res) => {
    knex('usuario')
        .insert({
            nome: req.body.nome,
            login: req.body.login,
            senha: bcrypt.hashSync(req.body.senha, 8),
            email: req.body.email
        }, ['id'])
        .then((result) => {
            let usuario = result[0]
            res.status(200).json({ "id": usuario.id })
            return
        })
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao registrar usuario - ' + err.message
            })
        })
})

apiRouter.post(endpoint + 'seguranca/login', (req, res) => {
    knex
        .select('*').from('usuario').where({ login: req.body.login })
        .then(usuarios => {
            if (usuarios.length) {
                let usuario = usuarios[0]
                let checkSenha = bcrypt.compareSync(req.body.senha, usuario.senha)
                if (checkSenha) {
                    var tokenJWT = jwt.sign({ id: usuario.id },
                        process.env.SECRET_KEY, {
                        expiresIn: 3600
                    })
                    res.status(200).json({
                        id: usuario.id,
                        login: usuario.login,
                        nome: usuario.nome,
                        roles: usuario.roles,
                        token: tokenJWT
                    })
                    return
                }
            }

            res.status(200).json({ message: 'Login ou senha incorretos' })
        })
        .catch(err => {
            res.status(500).json({
                message: 'Erro ao verificar login - ' + err.message
            })
        })
})





module.exports = apiRouter;
require('dotenv').config()
const express = require('express');
const cors = require('cors')
const Note = require('./models/note')
const WebSocket = require('ws')
const http = require('http')



const noteEventEmitter = Note.watch()

const app = express()
app.use(cors())
app.use(express.json())

const errorHandler = (error, response, request, next) => {
    console.log(error)
    next()
}

app.use(errorHandler)


app.get('/', (request, response) => {
    response.send('<h1>Hello World!</h1>')
})

app.get('/api/notes', (request, response, next) => {
    Note.find({})
        .then(notes => {
            response.json(notes)
        })
        .catch(error => next(error))
})


app.get('/api/notes/:id', (request, response, next) => {
    Note.findById(request.params.id)
        .then(note => {
            if (note) {
                response.json(note)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.post('/api/notes', (request, response, next) => {
    const body = request.body

    if (!body.content) {
        return response.status(400).json({
            error: 'content missing'
        })
    }

    const note = new Note({
        content: body.content,
        important: body.important || false,
        date: new Date()
    })

    note.save()
        .then(savedNote => {
            response.json(savedNote)
        })
        .catch(error => next(error))
})


app.delete('/api/notes/:id', (request, response, next) => {
    Note.findByIdAndRemove(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})




const PORT = process.env.PORT || 3001


const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

wss.on('connection', (ws) => {
    noteEventEmitter.on('change', change => {
        console.log(JSON.stringify(change))
        let returnedObject = change.fullDocument
        ws.send(JSON.stringify(returnedObject))
        ws.send('fetch')
    })

    ws.on('message', (message) => {
        console.log("received", message)
        ws.send('Hello, you sent ', message)
    })
    ws.send('Hi , I am WebSocket server')
})

// app.listen(PORT)
server.listen(PORT)
console.log(`Server running on port ${PORT}`)

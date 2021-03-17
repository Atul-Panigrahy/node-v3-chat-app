const express = require('express')
const path = require('path')
const http = require('http') //manually setup http server coz the socket.io needss it as input
const socketIo = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {addUser, removeUser, getUser, getusersInRoom} = require('./utils/users')


const app = express()
const server = http.createServer(app)
const Io = socketIo(server) //socketIO server expects a raw http server

const port= process.env.PORT || 3000

const publicDIrectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDIrectoryPath))

/* //EXAMPLE to send counter variable between clients
let count = 0;

//when a given client connects this event will occur , one for each connection... 'connection' is the name of the event
//socket argument object contains info about new connection
//connection is builtin event

Io.on('connection', (socket) => {
    console.log('New web socket connection');

    //send to client side the count
    socket.emit('countUpdated', count)

    //receive the indication that count has incremented by +1
    socket.on('increment', ()=>{
        count++;

        //this sends the updated information only to the specific client from which it recieved the command to increment the counter and thats a problem in real-time
        // socket.emit('countUpdated', count) 

        //to emit to every client
        Io.emit('countUpdated',count)
    })
})

*/

Io.on('connection', (socket) => {
    console.log('New web-socket connection');

    // socket.emit('message', generateMessage('welcome'))
    // socket.broadcast.emit('message', generateMessage('A new user has joined!')) // send message to every client except the newly joined client

    socket.on('join', ({username, room}, callback) => {

       const {error, user} =  addUser({id: socket.id , username, room})

        if(error){
            return callback(error)
        }


        //socket.join only allowed in server.... allows us to join the room
        socket.join(room)

        //io.to.emit   => send message to all in that room
        //socket.broadcast.to.emit  => send to all others except specific client in the room

        socket.emit('message', generateMessage('Admin','welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the room`))

        Io.to(user.room).emit('roomData', {
            room: user.room,
            users: getusersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback)  => {

        const user = getUser(socket.id)

        //check for profanity or bad words in the message
         const filter = new Filter()
         if( filter.isProfane(message) ){
             return callback('Profanity is not allowed')
         }

        Io.to(user.room).emit('message',generateMessage(user.username, message))

        // callback('delivered') // send signal acknowlegement to the client that their work has beeen completed and the fuction provied on the client side will run 
        callback()
    })

    // send location to every client
    socket.on('sendLocation', (coords,callback)=> {

        const user = getUser(socket.id)

        // Io.emit('message', `Location: ${coords.latitude},${coords.longitude}`)
        Io.to(user.room).emit('locationMessage', generateLocationMessage( user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)) //send location in link format

        callback()
    })


    //when a connection is closed.. using disconnect builtin event
    socket.on('disconnect', () => {

        const user = removeUser(socket.id) 
        
        if (user) {

            Io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`)) // here we use io.emit coz.. the user is left, eventhough we send to everyone , the left client cant see the message
            
            Io.to(user.room).emit('roomData', {
                room: user.room,
                users: getusersInRoom(user.room)
            })
    
        }   

    })

})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
}) 
   
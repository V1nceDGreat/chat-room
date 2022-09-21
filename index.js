const path = require('path');
const http = require('http');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

var express = require('express');
var socket = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = socket(server);

app.use(express.static('public'));

io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        //Welcome current user
        socket.emit('message', formatMessage('Bot', 'Welcome to Chat Room'));
    
        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage('Bot', `${user.username} has joined the chat`));

        //send user and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

        //Listen for Chat Message
        socket.on('chatMessage', (msg) => {
            const user = getCurrentUser(socket.id);

            io.to(user.room).emit('message', formatMessage(user.username, msg));
        });

        //Runs when client disconnects
        socket.on('disconnect', () => {
            const user = userLeave(socket.id);

            if(user){
                io.to(user.room).emit('message', formatMessage('Bot',`${user.username} has left the chat`));
            }
            //send user and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        });

    });
});

server.listen(4000, function(){
    console.log('listening for requests on port 4000');
});
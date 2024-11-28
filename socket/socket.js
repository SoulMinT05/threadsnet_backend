const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
// const Message = require('../models/messageModel.js');
// const Conversation = require('../models/conversationModel.js');

const app = express();
const server = http.createServer(app);

// Set up the socket.io server with CORS configuration
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

// Store user socket mappings for quick access
const userSocketMap = {}; // userId: socketId

// // Function to retrieve recipient's socket ID based on their userId
// const getRecipientSocketId = (recipientId) => {
//   return userSocketMap[recipientId];
// };

// Event listener for new socket connections
io.on('connection', (socket) => {
    console.log('User connected: ', socket.id);

    const userId = socket.handshake.query.userId;

    // Store the userId and socketId when the user connects
    if (userId !== 'undefined') {
        userSocketMap[userId] = socket.id;
    }

    // Emit the updated list of online users
    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    //   // Mark messages as seen
    //   socket.on('markMessagesAsSeen', async ({ conversationId, userId }) => {
    //     try {
    //       await Message.updateMany({ conversationId: conversationId, seen: false }, { $set: { seen: true } });
    //       await Conversation.updateOne({ _id: conversationId }, { $set: { 'lastMessage.seen': true } });
    //       io.to(userSocketMap[userId]).emit('messagesSeen', { conversationId });
    //     } catch (error) {
    //       console.error(error);
    //     }
    //   });

    // Event listener for socket disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
        delete userSocketMap[userId];
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });
});

// Export the server, app, and io for use elsewhere
module.exports = { io, server, app };

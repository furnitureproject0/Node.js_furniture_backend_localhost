import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import cookie from 'cookie'

// Store connected users: { userId: socketId }
const connectedUsers = new Map();

// Store socket to user mapping: { socketId: userId }
const socketToUser = new Map();

const setupSocketIO = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });

    global.io = io;

    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        try {

            const cookies = cookie.parse(socket.handshake.headers.cookie || '')
            const token = cookies.accessToken

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id);

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id;

        // Store the connection
        connectedUsers.set(userId, socket.id);
        socketToUser.set(socket.id, userId);

        console.log(`User ${userId} connected. Socket ID: ${socket.id}`);

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected`);
            connectedUsers.delete(userId);
            socketToUser.delete(socket.id);
        });
    });

    return io;
};

export const getSocketIO = () => {
    if (!global.io) {
        throw new Error('Socket.IO not initialized');
    }
    return global.io;
};

export const isUserConnected = (userId) => {
    return connectedUsers.has(userId);
};

export const getUserSocket = (userId) => {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
        return getSocketIO().sockets.sockets.get(socketId);
    }
    return null;
};

export default setupSocketIO;
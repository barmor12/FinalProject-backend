import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

const setupSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // שנה בהתאם לצורך
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('message', (data) => {
      console.log('Message received:', data);
      socket.broadcast.emit('message', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export default setupSocketServer;

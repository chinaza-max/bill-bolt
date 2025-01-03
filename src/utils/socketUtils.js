import Service from '../service/user.service.js';

let ioInstance = null;

export const configureSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', async ({ roomId }) => {
      socket.join(roomId);
      console.log(`User joined room: room-${roomId}`);
    });

    socket.on('message', async ({ roomId, senderType, content }) => {
      const message = await Service.saveMessage(roomId, senderType, content);
      io.to(`${roomId}`).emit('message', message);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

// Export a function to get the Socket.IO instance
export const getSocketInstance = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO instance is not initialized.');
  }
  return ioInstance;
};

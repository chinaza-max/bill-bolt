import Service from '../service/user.service.js';

export const configureSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', async ({ roomId }) => {
      socket.join(roomId);
      console.log(`User joined room: room-${roomId}`);
    });

    socket.on('message', async ({ roomId, senderType, content }) => {
      const message = await Service.saveMessage(roomId, senderType, content);
      io.to(`room-${roomId}`).emit('message', message);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

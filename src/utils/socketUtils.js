import chatService from '../service/user.service.js';

export const configureSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', async ({ userId, merchantId }) => {
      const room = await chatService.getOrCreateRoom(userId, merchantId);
      socket.join(`room-${room.id}`);
      console.log(`User joined room: room-${room.id}`);
    });

    socket.on('message', async ({ roomId, senderType, content }) => {
      const message = await chatService.saveMessage(roomId, senderType, content);
      io.to(`room-${roomId}`).emit('message', message);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

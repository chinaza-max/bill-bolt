import Service from '../service/user.service.js';

let ioInstance = null;
const activeUsers = new Map(); // Track active users in rooms

export const configureSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', async ({ roomId, userId }) => {
      socket.join(roomId);
      socket.userId = userId;
      socket.roomId = roomId;

      // Track active user in room
      if (!activeUsers.has(roomId)) {
        activeUsers.set(roomId, new Set());
      }
      activeUsers.get(roomId).add(userId);

      console.log(`User ${userId} joined room: ${roomId}`);

      // Mark all unread messages from other users as delivered
      await Service.markMessagesAsDelivered(roomId, userId);

      // Notify other users in room that messages have been delivered
      socket.to(roomId).emit('messagesDelivered', { userId });
    });

    socket.on(
      'message',
      async ({ userId1, userId2, roomId, messageType, content }) => {
        console.log(
          `Message received in room ${roomId} from ${userId1}: ${content}`
        );

        try {
          // Save message to database (status will be 'sent' by default)
          const message = await Service.saveMessage(
            userId1,
            userId2,
            roomId,
            messageType,
            content
          );

          // Check if recipient is online in this room
          const recipientOnline = activeUsers.get(roomId)?.has(userId2);

          let updatedMessage = message;

          console.log(recipientOnline);
          if (recipientOnline) {
            console.log(message);
            console.log('qqqqqqqqqqqqqqqqqqqqqqqqq');
            console.log('qqqqqqqqqqqqqqqqqqqqqqqqq');
            console.log('qqqqqqqqqqqqqqqqqqqqqqqqq');
            // If recipient is online, mark as delivered immediately
            updatedMessage = await Service.markMessageAsDelivered(message.id);

            console.log('Message marked as delivered:', updatedMessage);
          }
          console.log('sssssssssssssssssssssssss');
          console.log('sssssssssssssssssssssssss');
          console.log('sssssssssssssssssssssssss');
          // Emit to all users in the room
          io.to(roomId).emit('message', updatedMessage);

          // If message was delivered, notify sender
          if (recipientOnline) {
            socket.emit('messageDelivered', { messageId: message.id });
          }
        } catch (error) {
          console.error('Error handling message:', error);
          socket.emit('messageError', { error: 'Failed to send message' });
        }
      }
    );

    socket.on('messagesRead', async ({ roomId, userId }) => {
      try {
        // Mark all messages from other users as read
        await Service.markMessagesAsRead(roomId, userId);

        // Notify other users in room that their messages have been read
        socket.to(roomId).emit('messagesRead', { userId });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('userTyping', {
        userId: socket.userId,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      // Remove user from active users
      if (socket.roomId && socket.userId) {
        const roomUsers = activeUsers.get(socket.roomId);
        if (roomUsers) {
          roomUsers.delete(socket.userId);
          if (roomUsers.size === 0) {
            activeUsers.delete(socket.roomId);
          }
        }
      }
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

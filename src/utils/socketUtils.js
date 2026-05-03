import Service from '../service/user.service.js';
import { User } from '../db/models/index.js';

let ioInstance = null;
const activeUsers = new Map(); // existing — for chat delivery tracking

export const configureSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ─────────────────────────────────────────────────────────────────────────
    // EXISTING: Chat room — unchanged
    // ─────────────────────────────────────────────────────────────────────────

    socket.on('joinRoom', async ({ roomId, userId }) => {
      socket.join(roomId);
      socket.userId = userId;
      socket.roomId = roomId;

      if (!activeUsers.has(roomId)) {
        activeUsers.set(roomId, new Set());
      }
      activeUsers.get(roomId).add(userId);

      console.log(`User ${userId} joined chat room: ${roomId}`);

      await Service.markMessagesAsDelivered(roomId, userId);
      socket.to(roomId).emit('messagesDelivered', { userId });
    });

    socket.on(
      'message',
      async ({ userId1, userId2, roomId, messageType, content }) => {
        console.log(`Message in room ${roomId} from ${userId1}: ${content}`);
        try {
          const message = await Service.saveMessage(
            userId1,
            userId2,
            roomId,
            messageType,
            content
          );
          const recipientOnline = activeUsers.get(roomId)?.has(userId2);
          let updatedMessage = message;

          if (recipientOnline) {
            updatedMessage = await Service.markMessageAsDelivered(message.id);
            console.log('Message marked as delivered:', updatedMessage);
          }

          io.to(roomId).emit('message', updatedMessage);

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
        await Service.markMessagesAsRead(roomId, userId);
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

    // ─────────────────────────────────────────────────────────────────────────
    // EXISTING: Order room — unchanged (QR scanning, order status)
    // ─────────────────────────────────────────────────────────────────────────

    socket.on('joinOrderRoom', ({ orderId, userType }) => {
      const room = `order_${orderId}`;
      socket.join(room);
      socket.data.orderId = orderId;
      socket.data.userType = userType;
      console.log(`[${userType}] joined order room: ${room}`);
    });

    socket.on('qrScanned', (data) => {
      io.to(`order_${data.orderId}`).emit('qrScanSuccess', {
        message: 'QR Code has been scanned successfully',
        orderId: data.orderId,
        timestamp: data.timestamp,
      });
    });

    socket.on('qrVerified', (data) => {
      io.to(`order_${data.orderId}`).emit('orderStatusUpdate', {
        orderId: data.orderId,
        status: 'completed',
        timestamp: data.timestamp,
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: User personal room — joined on login, used for calls
    // This is what allows calls to reach users on ANY page
    // ─────────────────────────────────────────────────────────────────────────

    socket.on('joinUserRoom', ({ userId }) => {
      const room = `user_${userId}`;
      socket.join(room);
      socket.data.userId = userId;
      console.log(`👤 User ${userId} joined personal room: ${room}`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATED: Call handlers — now use user rooms instead of order rooms
    // ─────────────────────────────────────────────────────────────────────────

    /*
    socket.on(
      'initiateCall',
      ({ orderId, callerId, callerName, callerAvatar, receiverId }) => {
        const receiverRoom = `user_${receiverId}`;
        const isOnline =
          (io.sockets.adapter.rooms.get(receiverRoom)?.size || 0) > 0;

        console.log(
          `📞 Call: ${callerId} → ${receiverId} | room: ${receiverRoom} | online: ${isOnline}`
        );

        if (!isOnline) {
          // Tell the caller the receiver is offline
          socket.emit('receiverOffline', { orderId, receiverId });
          console.log(`❌ Receiver ${receiverId} is offline`);
          return;
        }

        // Store call context so callEnded knows who to notify
        socket.data.activeCall = { orderId, callerId, receiverId };

        // Route call to receiver's personal room — works on any page
        io.to(receiverRoom).emit('incomingCall', {
          orderId,
          callerId,
          callerName,
          callerAvatar,
        });
      }
    );

    */

    socket.on(
      'initiateCall',
      async ({ orderId, callerId, callerName, callerAvatar, receiverId }) => {
        const receiverRoom = `user_${receiverId}`;
        const isOnline =
          (io.sockets.adapter.rooms.get(receiverRoom)?.size || 0) > 0;

        console.log(
          `📞 Call: ${callerId} → ${receiverId} | online: ${isOnline}`
        );

        // Store call context for callEnded
        socket.data.activeCall = { orderId, callerId, receiverId };

        if (isOnline) {
          // ── User is online — deliver via socket ──────────────────────────────────
          io.to(receiverRoom).emit('incomingCall', {
            orderId,
            callerId,
            callerName,
            callerAvatar,
          });
          console.log(`✅ Call delivered via socket to user_${receiverId}`);
        } else {
          // ── User is offline — deliver via FCM push notification ──────────────────
          console.log(`📵 User ${receiverId} offline — sending FCM push`);

          try {
            // Fetch receiver's FCM token from DB
            // Adjust this query to your ORM/DB setup
            const receiver = await User.findOne({ where: { id: receiverId } });
            // or: const [rows] = await db.query("SELECT fcm_token FROM users WHERE id = ?", [receiverId]);
            // const receiver = rows[0];

            const fcmToken = receiver?.fcmToken || receiver?.fcm_token;

            if (!fcmToken) {
              console.log(`❌ No FCM token for user ${receiverId}`);
              socket.emit('receiverOffline', { orderId, receiverId });
              return;
            }

            await Service.sendToDevice(
              fcmToken,
              {
                title: `📞 Incoming call from ${callerName}`,
                body: `Order #${orderId} — Tap to answer`,
              },
              {
                // data payload — all must be strings (your sendToDevice already handles this)
                type: 'INCOMING_CALL',
                orderId: String(orderId),
                callerId: String(callerId),
                callerName: String(callerName),
                callerAvatar: String(callerAvatar || ''),
                receiverId: String(receiverId),
                userId: String(receiverId),
                sendto: String(receiverId),
              }
            );

            console.log(`✅ FCM push sent to user ${receiverId}`);
          } catch (err) {
            console.error('Error sending FCM push:', err);
            // Tell caller anyway
            socket.emit('receiverOffline', { orderId, receiverId });
          }
        }
      }
    );

    socket.on('callEnded', ({ orderId, userId }) => {
      console.log(`📴 Call ended by ${userId} in order ${orderId}`);

      const call = socket.data.activeCall;

      // Notify via order room (covers users on the order page)
      io.to(`order_${orderId}`).emit('callEnded', { orderId, userId });

      // Also notify via user room (covers users on any other page)
      if (call) {
        const otherUserId =
          String(call.callerId) === String(userId)
            ? call.receiverId
            : call.callerId;

        io.to(`user_${otherUserId}`).emit('callEnded', { orderId, userId });
        socket.data.activeCall = null;
      }
    });

    socket.on('callDeclined', ({ orderId, callerId, declinedBy }) => {
      console.log(`🚫 Call declined in order ${orderId} by ${declinedBy}`);
      // Notify caller via their personal room
      io.to(`user_${callerId}`).emit('callDeclined', {
        orderId,
        callerId,
        declinedBy,
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // EXISTING: Disconnect — unchanged
    // ─────────────────────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

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

export const getSocketInstance = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO instance is not initialized.');
  }
  return ioInstance;
};

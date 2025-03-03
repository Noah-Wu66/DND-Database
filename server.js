const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const battlesRoutes = require('./routes/battles');
const errorHandler = require('./middlewares/errorHandler');
const connectDB = require('./config/database');

// 初始化应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// 连接数据库
connectDB();

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());
app.use(morgan('dev'));

// 健康检查路由
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'DnD Battle Assistant API',
    version: '1.0.0' 
  });
});

// API路由
app.use('/api/v1/battles', battlesRoutes);

// WebSocket处理
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-session', (sessionId) => {
    console.log(`Client ${socket.id} joined session: ${sessionId}`);
    socket.join(sessionId);
  });
  
  socket.on('update-monster', (data) => {
    if (data && data.sessionId && data.monster) {
      console.log(`Monster update in ${data.sessionId}: ${data.monster.id}`);
      socket.to(data.sessionId).emit('monster-updated', data.monster);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 导出应用供测试使用
module.exports = { app, io };

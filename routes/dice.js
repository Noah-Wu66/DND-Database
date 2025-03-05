const express = require('express');
const router = express.Router();
const DiceSession = require('../models/diceSession');

/**
 * @route   GET /api/v1/dice/sessions/:sessionId
 * @desc    获取骰子会话数据
 * @access  Public
 */
router.get('/sessions/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    let session = await DiceSession.findOne({ sessionId });
    
    // 如果会话不存在，创建新会话
    if (!session) {
      session = new DiceSession({
        sessionId,
        diceState: {
          dice: {
            d4: 0,
            d6: 0,
            d8: 0,
            d10: 0,
            d12: 0,
            d20: 0
          },
          advantage: false,
          disadvantage: false
        }
      });
      await session.save();
    }
    
    // 返回会话数据
    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        diceState: session.diceState,
        lastUpdated: session.lastUpdated
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/dice/sessions/:sessionId
 * @desc    保存骰子会话数据
 * @access  Public
 */
router.post('/sessions/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { diceState } = req.body;
    
    if (!diceState) {
      return res.status(400).json({
        success: false,
        error: '缺少骰子数据'
      });
    }
    
    // 更新或创建会话
    const session = await DiceSession.findOneAndUpdate(
      { sessionId },
      {
        diceState,
        lastUpdated: Date.now()
      },
      {
        new: true,
        upsert: true
      }
    );
    
    // 通过Socket.io通知其他客户端(在server.js中处理)
    req.app.get('io')?.to(sessionId).emit('dice-state-updated', session.diceState);
    
    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        lastUpdated: session.lastUpdated
      }
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;

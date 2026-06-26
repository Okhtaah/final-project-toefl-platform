const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// ============================================
// GET /api/messages — Get conversation with another user
// Query: ?with=<user_id>
// ============================================
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const withUserId = req.query.with;

    if (!withUserId) {
      // If no specific user, list all conversations (latest message per conversation)
      const result = await pool.query(
        `SELECT DISTINCT ON (partner_id) *
         FROM (
           SELECT
             CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS partner_id,
             m.id, m.content, m.created_at, m.is_read, m.sender_id, m.receiver_id
           FROM Messages m
           WHERE sender_id = $1 OR receiver_id = $1
           ORDER BY
             CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END,
             m.created_at DESC
         ) sub
         ORDER BY partner_id, created_at DESC`,
        [userId]
      );

      // Enrich with user names
      const conversations = [];
      for (const row of result.rows) {
        const userResult = await pool.query(
          'SELECT id, full_name, email FROM Users WHERE id = $1',
          [row.partner_id]
        );
        conversations.push({
          partner: userResult.rows[0] || { id: row.partner_id },
          last_message: {
            id: row.id,
            content: row.content,
            created_at: row.created_at,
            is_read: row.is_read,
            sender_id: row.sender_id
          }
        });
      }

      return res.json({ conversations });
    }

    // Get messages between current user and specified user
    const result = await pool.query(
      `SELECT id, sender_id, receiver_id, content, created_at, is_read
       FROM Messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [userId, withUserId]
    );

    res.json({ messages: result.rows });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// ============================================
// POST /api/messages — Send a message
// ============================================
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiver_id, content } = req.body;
    const senderId = req.user.id;

    if (!receiver_id || !content) {
      return res.status(400).json({ error: 'receiver_id and content are required.' });
    }

    if (receiver_id === senderId) {
      return res.status(400).json({ error: 'You cannot send a message to yourself.' });
    }

    // Verify receiver exists
    const receiverResult = await pool.query('SELECT id FROM Users WHERE id = $1', [receiver_id]);
    if (receiverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Receiver not found.' });
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO Messages (id, sender_id, receiver_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sender_id, receiver_id, content, created_at, is_read`,
      [id, senderId, receiver_id, content]
    );

    res.status(201).json({
      message: 'Message sent.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// ============================================
// PUT /api/messages/:id/read — Mark message as read
// ============================================
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Only the receiver can mark a message as read
    const result = await pool.query(
      `UPDATE Messages SET is_read = true
       WHERE id = $1 AND receiver_id = $2
       RETURNING id, is_read`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found or you are not the receiver.' });
    }

    res.json({ message: 'Message marked as read.', data: result.rows[0] });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark message as read.' });
  }
});

module.exports = router;

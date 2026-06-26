const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Helper to generate random code
function generateCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================
// POST /api/access-codes/redeem — Student redeems a code
// ============================================
router.post('/redeem', authenticate, async (req, res) => {
  const client = await pool.connect();

  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ error: 'Access code is required.' });
    }

    await client.query('BEGIN');

    // Find the access code and lock the row
    const codeResult = await client.query(
      'SELECT * FROM AccessCodes WHERE code = $1 FOR UPDATE',
      [code]
    );

    if (codeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invalid access code.' });
    }

    const accessCode = codeResult.rows[0];

    // Check expiry
    if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This access code has expired.' });
    }

    // Check max uses
    if (accessCode.current_uses >= accessCode.max_uses) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This access code has reached its maximum uses.' });
    }

    // Check if user already redeemed this code
    const existingAccess = await client.query(
      'SELECT id FROM UserAccess WHERE user_id = $1 AND access_code_id = $2',
      [userId, accessCode.id]
    );

    if (existingAccess.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You have already redeemed this code.' });
    }

    // Increment current_uses
    await client.query(
      'UPDATE AccessCodes SET current_uses = current_uses + 1 WHERE id = $1',
      [accessCode.id]
    );

    // Create UserAccess record
    const accessId = uuidv4();
    await client.query(
      `INSERT INTO UserAccess (id, user_id, access_code_id, target_type, target_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [accessId, userId, accessCode.id, accessCode.target_type, accessCode.target_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Access code redeemed successfully.',
      access: {
        id: accessId,
        target_type: accessCode.target_type,
        target_id: accessCode.target_id
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Redeem code error:', err);
    res.status(500).json({ error: 'Failed to redeem access code.' });
  } finally {
    client.release();
  }
});

// ============================================
// GET /api/access-codes — Admin list all codes
// ============================================
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, target_type, target_id, max_uses, current_uses, expires_at, created_at
       FROM AccessCodes ORDER BY created_at DESC`
    );
    res.json({ codes: result.rows });
  } catch (err) {
    console.error('List access codes error:', err);
    res.status(500).json({ error: 'Failed to retrieve access codes.' });
  }
});

// ============================================
// POST /api/access-codes — Admin create a new code
// ============================================
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { target_type, target_id, max_uses, expires_at } = req.body;

    if (!target_type || !target_id) {
      return res.status(400).json({ error: 'target_type and target_id are required.' });
    }

    const validTypes = ['COURSE', 'SECTION', 'TASK', 'MATERIAL'];
    if (!validTypes.includes(target_type)) {
      return res.status(400).json({ error: `target_type must be one of: ${validTypes.join(', ')}` });
    }

    // Auto-generate a unique code
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateCode();
      const existing = await pool.query('SELECT id FROM AccessCodes WHERE code = $1', [code]);
      if (existing.rows.length === 0) isUnique = true;
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO AccessCodes (id, code, target_type, target_id, max_uses, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, code, target_type, target_id, max_uses || 1, expires_at || null]
    );

    res.status(201).json({
      message: 'Access code created.',
      access_code: { id, code, target_type, target_id, max_uses: max_uses || 1, expires_at: expires_at || null }
    });
  } catch (err) {
    console.error('Create access code error:', err);
    res.status(500).json({ error: 'Failed to create access code.' });
  }
});

// ============================================
// DELETE /api/access-codes/:id — Admin delete a code
// ============================================
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM AccessCodes WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Access code not found.' });
    }

    res.json({ message: 'Access code deleted.' });
  } catch (err) {
    console.error('Delete access code error:', err);
    res.status(500).json({ error: 'Failed to delete access code.' });
  }
});

module.exports = router;


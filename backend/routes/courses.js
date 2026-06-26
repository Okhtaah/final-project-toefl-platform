const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// ============================================
// GET /api/courses — List published courses (public)
// ============================================
router.get('/', async (req, res) => {
  try {
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Soft auth: ignore invalid tokens for listing courses
      }
    }

    let query;
    let params = [];
    if (userId) {
      query = `
        SELECT c.id, c.title, c.description, c.is_published, c.is_free,
               CASE
                 WHEN c.is_free = true THEN true
                 WHEN ua.id IS NOT NULL THEN true
                 ELSE false
               END AS is_enrolled
        FROM Courses c
        LEFT JOIN UserAccess ua ON ua.target_type = 'COURSE'
          AND ua.target_id = c.id AND ua.user_id = $1
        WHERE c.is_published = true
        ORDER BY c.title
      `;
      params = [userId];
    } else {
      query = `
        SELECT id, title, description, is_published, is_free,
               is_free AS is_enrolled
        FROM Courses
        WHERE is_published = true
        ORDER BY title
      `;
    }

    const result = await pool.query(query, params);
    res.json({ courses: result.rows });
  } catch (err) {
    console.error('List courses error:', err);
    res.status(500).json({ error: 'Failed to retrieve courses.' });
  }
});

// ============================================
// GET /api/courses/:id — Get course with sections & tasks (authenticated)
// ============================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get course
    const courseResult = await pool.query(
      'SELECT id, title, description, is_published, is_free FROM Courses WHERE id = $1',
      [id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const course = courseResult.rows[0];

    // Access check: only allow if admin, or course is free, or user has access
    if (userRole !== 'ADMIN' && !course.is_free) {
      const accessResult = await pool.query(
        "SELECT id FROM UserAccess WHERE user_id = $1 AND target_type = 'COURSE' AND target_id = $2",
        [userId, id]
      );
      if (accessResult.rows.length === 0) {
        return res.status(403).json({ error: 'This course is premium. Please unlock it using an access code.' });
      }
    }

    // Get sections
    const sectionsResult = await pool.query(
      'SELECT id, title, section_order, is_locked, category FROM Sections WHERE course_id = $1 ORDER BY section_order',
      [id]
    );

    // Get tasks for each section
    const sections = [];
    for (const section of sectionsResult.rows) {
      const tasksResult = await pool.query(
        `SELECT id, title, task_type, instructions, time_limit_seconds, task_order
         FROM Tasks WHERE section_id = $1 ORDER BY task_order`,
        [section.id]
      );

      // Get questions for each task
      const tasks = [];
      for (const task of tasksResult.rows) {
        const questionsResult = await pool.query(
          `SELECT id, prompt, text_content, media_url, question_order
           FROM Questions WHERE task_id = $1 ORDER BY question_order`,
          [task.id]
        );

        // Get answer options for each question
        const questions = [];
        for (const question of questionsResult.rows) {
          const optionsResult = await pool.query(
            `SELECT id, content, is_correct, option_order
             FROM AnswerOptions WHERE question_id = $1 ORDER BY option_order`,
            [question.id]
          );
          questions.push({
            ...question,
            options: optionsResult.rows
          });
        }

        tasks.push({
          ...task,
          questions
        });
      }

      sections.push({
        ...section,
        tasks
      });
    }

    res.json({
      course: {
        ...course,
        sections
      }
    });
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ error: 'Failed to retrieve course.' });
  }
});

// ============================================
// GET /api/courses/:courseId/materials — List course materials
// ============================================
router.get('/:courseId/materials', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Verify course exists
    const courseResult = await pool.query('SELECT id FROM Courses WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Get all materials — free ones for everyone, paid ones only if user has access
    const result = await pool.query(
      `SELECT m.id, m.title, m.file_url, m.material_type, m.is_free,
              CASE
                WHEN m.is_free = true THEN true
                WHEN ua.id IS NOT NULL THEN true
                ELSE false
              END AS has_access
       FROM Materials m
       LEFT JOIN UserAccess ua ON ua.target_type = 'MATERIAL'
         AND ua.target_id = m.id AND ua.user_id = $1
       WHERE m.course_id = $2
       ORDER BY m.title`,
      [userId, courseId]
    );

    res.json({ materials: result.rows });
  } catch (err) {
    console.error('List materials error:', err);
    res.status(500).json({ error: 'Failed to retrieve materials.' });
  }
});

module.exports = router;

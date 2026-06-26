const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ======================================================================
//  COURSES CRUD
// ======================================================================

// GET /api/admin/courses — List ALL courses (including unpublished)
router.get('/courses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Courses ORDER BY title');
    res.json({ courses: result.rows });
  } catch (err) {
    console.error('Admin list courses error:', err);
    res.status(500).json({ error: 'Failed to retrieve courses.' });
  }
});

// POST /api/admin/courses — Create course
router.post('/courses', async (req, res) => {
  try {
    const { title, description, is_published } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO Courses (id, title, description, is_published)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, title, description || null, is_published || false]
    );

    res.status(201).json({ message: 'Course created.', course: result.rows[0] });
  } catch (err) {
    console.error('Admin create course error:', err);
    res.status(500).json({ error: 'Failed to create course.' });
  }
});

// PUT /api/admin/courses/:id — Update course
router.put('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_published } = req.body;

    const result = await pool.query(
      `UPDATE Courses SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         is_published = COALESCE($3, is_published)
       WHERE id = $4
       RETURNING *`,
      [title, description, is_published, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    res.json({ message: 'Course updated.', course: result.rows[0] });
  } catch (err) {
    console.error('Admin update course error:', err);
    res.status(500).json({ error: 'Failed to update course.' });
  }
});

// DELETE /api/admin/courses/:id — Delete course
router.delete('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Courses WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    res.json({ message: 'Course deleted.' });
  } catch (err) {
    console.error('Admin delete course error:', err);
    res.status(500).json({ error: 'Failed to delete course.' });
  }
});

// ======================================================================
//  SECTIONS CRUD
// ======================================================================

// GET /api/admin/courses/:courseId/sections
router.get('/courses/:courseId/sections', async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await pool.query(
      'SELECT * FROM Sections WHERE course_id = $1 ORDER BY section_order',
      [courseId]
    );
    res.json({ sections: result.rows });
  } catch (err) {
    console.error('Admin list sections error:', err);
    res.status(500).json({ error: 'Failed to retrieve sections.' });
  }
});

// POST /api/admin/sections
router.post('/sections', async (req, res) => {
  try {
    const { course_id, title, section_order, is_locked } = req.body;

    if (!course_id || !title || section_order === undefined) {
      return res.status(400).json({ error: 'course_id, title, and section_order are required.' });
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO Sections (id, course_id, title, section_order, is_locked)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, course_id, title, section_order, is_locked !== undefined ? is_locked : true]
    );

    res.status(201).json({ message: 'Section created.', section: result.rows[0] });
  } catch (err) {
    console.error('Admin create section error:', err);
    res.status(500).json({ error: 'Failed to create section.' });
  }
});

// PUT /api/admin/sections/:id
router.put('/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, section_order, is_locked } = req.body;

    const result = await pool.query(
      `UPDATE Sections SET
         title = COALESCE($1, title),
         section_order = COALESCE($2, section_order),
         is_locked = COALESCE($3, is_locked)
       WHERE id = $4
       RETURNING *`,
      [title, section_order, is_locked, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found.' });
    }

    res.json({ message: 'Section updated.', section: result.rows[0] });
  } catch (err) {
    console.error('Admin update section error:', err);
    res.status(500).json({ error: 'Failed to update section.' });
  }
});

// DELETE /api/admin/sections/:id
router.delete('/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Sections WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found.' });
    }

    res.json({ message: 'Section deleted.' });
  } catch (err) {
    console.error('Admin delete section error:', err);
    res.status(500).json({ error: 'Failed to delete section.' });
  }
});

// ======================================================================
//  TASKS CRUD
// ======================================================================

// GET /api/admin/sections/:sectionId/tasks
router.get('/sections/:sectionId/tasks', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const result = await pool.query(
      'SELECT * FROM Tasks WHERE section_id = $1 ORDER BY task_order',
      [sectionId]
    );
    res.json({ tasks: result.rows });
  } catch (err) {
    console.error('Admin list tasks error:', err);
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
});

// POST /api/admin/tasks
router.post('/tasks', async (req, res) => {
  try {
    const { section_id, title, task_type, instructions, time_limit_seconds, task_order } = req.body;

    if (!section_id || !title || !task_type || task_order === undefined) {
      return res.status(400).json({ error: 'section_id, title, task_type, and task_order are required.' });
    }

    const validTypes = [
      'COMPLETE_WORDS', 'MCQ', 'ACADEMIC_PASSAGE', 'SHORT_LISTENING',
      'CONVERSATION', 'BUILD_SENTENCE', 'WRITE_EMAIL', 'ACADEMIC_DISCUSSION',
      'REPEAT', 'INTERVIEW'
    ];

    if (!validTypes.includes(task_type)) {
      return res.status(400).json({ error: `task_type must be one of: ${validTypes.join(', ')}` });
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO Tasks (id, section_id, title, task_type, instructions, time_limit_seconds, task_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, section_id, title, task_type, instructions || null, time_limit_seconds || null, task_order]
    );

    res.status(201).json({ message: 'Task created.', task: result.rows[0] });
  } catch (err) {
    console.error('Admin create task error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// PUT /api/admin/tasks/:id
router.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, task_type, instructions, time_limit_seconds, task_order } = req.body;

    const result = await pool.query(
      `UPDATE Tasks SET
         title = COALESCE($1, title),
         task_type = COALESCE($2, task_type),
         instructions = COALESCE($3, instructions),
         time_limit_seconds = COALESCE($4, time_limit_seconds),
         task_order = COALESCE($5, task_order)
       WHERE id = $6
       RETURNING *`,
      [title, task_type, instructions, time_limit_seconds, task_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({ message: 'Task updated.', task: result.rows[0] });
  } catch (err) {
    console.error('Admin update task error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// DELETE /api/admin/tasks/:id
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Tasks WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({ message: 'Task deleted.' });
  } catch (err) {
    console.error('Admin delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

// ======================================================================
//  QUESTIONS CRUD
// ======================================================================

// GET /api/admin/tasks/:taskId/questions
router.get('/tasks/:taskId/questions', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await pool.query(
      `SELECT q.*, json_agg(
         json_build_object(
           'id', ao.id, 'content', ao.content,
           'is_correct', ao.is_correct, 'option_order', ao.option_order
         ) ORDER BY ao.option_order
       ) FILTER (WHERE ao.id IS NOT NULL) AS options
       FROM Questions q
       LEFT JOIN AnswerOptions ao ON ao.question_id = q.id
       WHERE q.task_id = $1
       GROUP BY q.id
       ORDER BY q.question_order`,
      [taskId]
    );
    res.json({ questions: result.rows });
  } catch (err) {
    console.error('Admin list questions error:', err);
    res.status(500).json({ error: 'Failed to retrieve questions.' });
  }
});

// POST /api/admin/questions
router.post('/questions', async (req, res) => {
  try {
    const { task_id, prompt, text_content, media_url, question_order } = req.body;

    if (!task_id || question_order === undefined) {
      return res.status(400).json({ error: 'task_id and question_order are required.' });
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO Questions (id, task_id, prompt, text_content, media_url, question_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, task_id, prompt || null, text_content || null, media_url || null, question_order]
    );

    res.status(201).json({ message: 'Question created.', question: result.rows[0] });
  } catch (err) {
    console.error('Admin create question error:', err);
    res.status(500).json({ error: 'Failed to create question.' });
  }
});

// PUT /api/admin/questions/:id
router.put('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt, text_content, media_url, question_order } = req.body;

    const result = await pool.query(
      `UPDATE Questions SET
         prompt = COALESCE($1, prompt),
         text_content = COALESCE($2, text_content),
         media_url = COALESCE($3, media_url),
         question_order = COALESCE($4, question_order)
       WHERE id = $5
       RETURNING *`,
      [prompt, text_content, media_url, question_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    res.json({ message: 'Question updated.', question: result.rows[0] });
  } catch (err) {
    console.error('Admin update question error:', err);
    res.status(500).json({ error: 'Failed to update question.' });
  }
});

// DELETE /api/admin/questions/:id
router.delete('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Questions WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    res.json({ message: 'Question deleted.' });
  } catch (err) {
    console.error('Admin delete question error:', err);
    res.status(500).json({ error: 'Failed to delete question.' });
  }
});

// ======================================================================
//  ANSWER OPTIONS CRUD
// ======================================================================

// GET /api/admin/questions/:questionId/options
router.get('/questions/:questionId/options', async (req, res) => {
  try {
    const { questionId } = req.params;
    const result = await pool.query(
      'SELECT * FROM AnswerOptions WHERE question_id = $1 ORDER BY option_order',
      [questionId]
    );
    res.json({ options: result.rows });
  } catch (err) {
    console.error('Admin list options error:', err);
    res.status(500).json({ error: 'Failed to retrieve answer options.' });
  }
});

// POST /api/admin/answer-options
router.post('/answer-options', async (req, res) => {
  try {
    const { question_id, content, is_correct, option_order } = req.body;

    if (!question_id || !content || option_order === undefined) {
      return res.status(400).json({ error: 'question_id, content, and option_order are required.' });
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO AnswerOptions (id, question_id, content, is_correct, option_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, question_id, content, is_correct || false, option_order]
    );

    res.status(201).json({ message: 'Answer option created.', option: result.rows[0] });
  } catch (err) {
    console.error('Admin create option error:', err);
    res.status(500).json({ error: 'Failed to create answer option.' });
  }
});

// PUT /api/admin/answer-options/:id
router.put('/answer-options/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, is_correct, option_order } = req.body;

    const result = await pool.query(
      `UPDATE AnswerOptions SET
         content = COALESCE($1, content),
         is_correct = COALESCE($2, is_correct),
         option_order = COALESCE($3, option_order)
       WHERE id = $4
       RETURNING *`,
      [content, is_correct, option_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Answer option not found.' });
    }

    res.json({ message: 'Answer option updated.', option: result.rows[0] });
  } catch (err) {
    console.error('Admin update option error:', err);
    res.status(500).json({ error: 'Failed to update answer option.' });
  }
});

// DELETE /api/admin/answer-options/:id
router.delete('/answer-options/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM AnswerOptions WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Answer option not found.' });
    }

    res.json({ message: 'Answer option deleted.' });
  } catch (err) {
    console.error('Admin delete option error:', err);
    res.status(500).json({ error: 'Failed to delete answer option.' });
  }
});

// ======================================================================
//  MATERIALS CRUD
// ======================================================================

// GET /api/admin/materials
router.get('/materials', async (req, res) => {
  try {
    const { course_id } = req.query;
    let query = `SELECT m.*, c.title AS course_title FROM Materials m JOIN Courses c ON m.course_id = c.id`;
    const params = [];

    if (course_id) {
      query += ' WHERE m.course_id = $1';
      params.push(course_id);
    }

    query += ' ORDER BY c.title, m.title';
    const result = await pool.query(query, params);
    res.json({ materials: result.rows });
  } catch (err) {
    console.error('Admin list materials error:', err);
    res.status(500).json({ error: 'Failed to retrieve materials.' });
  }
});

// POST /api/admin/materials
router.post('/materials', async (req, res) => {
  try {
    const { course_id, title, file_url, material_type, is_free } = req.body;

    if (!course_id || !title || !file_url || !material_type) {
      return res.status(400).json({ error: 'course_id, title, file_url, and material_type are required.' });
    }

    if (!['PDF', 'TEXT'].includes(material_type)) {
      return res.status(400).json({ error: 'material_type must be PDF or TEXT.' });
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO Materials (id, course_id, title, file_url, material_type, is_free)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, course_id, title, file_url, material_type, is_free || false]
    );

    res.status(201).json({ message: 'Material created.', material: result.rows[0] });
  } catch (err) {
    console.error('Admin create material error:', err);
    res.status(500).json({ error: 'Failed to create material.' });
  }
});

// PUT /api/admin/materials/:id
router.put('/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, file_url, material_type, is_free } = req.body;

    const result = await pool.query(
      `UPDATE Materials SET
         title = COALESCE($1, title),
         file_url = COALESCE($2, file_url),
         material_type = COALESCE($3, material_type),
         is_free = COALESCE($4, is_free)
       WHERE id = $5
       RETURNING *`,
      [title, file_url, material_type, is_free, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found.' });
    }

    res.json({ message: 'Material updated.', material: result.rows[0] });
  } catch (err) {
    console.error('Admin update material error:', err);
    res.status(500).json({ error: 'Failed to update material.' });
  }
});

// DELETE /api/admin/materials/:id
router.delete('/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Materials WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found.' });
    }

    res.json({ message: 'Material deleted.' });
  } catch (err) {
    console.error('Admin delete material error:', err);
    res.status(500).json({ error: 'Failed to delete material.' });
  }
});

// ======================================================================
//  SUBMISSIONS — Admin grading
// ======================================================================

// GET /api/admin/submissions — List submissions (filter by review_status)
router.get('/submissions', async (req, res) => {
  try {
    const { status, attempt_id } = req.query;

    let query = `
      SELECT s.*, q.prompt, q.text_content, t.task_type, t.title AS task_title,
             ta.user_id, u.full_name AS student_name, u.email AS student_email,
             c.title AS course_title
      FROM Submissions s
      JOIN Questions q ON s.question_id = q.id
      JOIN Tasks t ON q.task_id = t.id
      JOIN TestAttempts ta ON s.attempt_id = ta.id
      JOIN Users u ON ta.user_id = u.id
      JOIN Courses c ON ta.course_id = c.id
    `;

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`s.review_status = $${params.length}`);
    }

    if (attempt_id) {
      params.push(attempt_id);
      conditions.push(`s.attempt_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.submitted_at DESC';

    const result = await pool.query(query, params);
    res.json({ submissions: result.rows });
  } catch (err) {
    console.error('Admin list submissions error:', err);
    res.status(500).json({ error: 'Failed to retrieve submissions.' });
  }
});

// POST /api/admin/submissions/:id/grade — Grade a submission
router.post('/submissions/:id/grade', async (req, res) => {
  try {
    const { id } = req.params;
    const { manual_score, admin_feedback } = req.body;

    if (manual_score === undefined || manual_score === null) {
      return res.status(400).json({ error: 'manual_score is required.' });
    }

    if (typeof manual_score !== 'number' || manual_score < 0) {
      return res.status(400).json({ error: 'manual_score must be a non-negative number.' });
    }

    const result = await pool.query(
      `UPDATE Submissions SET
         manual_score = $1,
         admin_feedback = $2,
         review_status = 'MANUALLY_GRADED'
       WHERE id = $3
       RETURNING *`,
      [manual_score, admin_feedback || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    // Check if all submissions for this attempt are graded — if so, update attempt
    const submission = result.rows[0];
    const pendingResult = await pool.query(
      `SELECT COUNT(*) AS pending FROM Submissions
       WHERE attempt_id = $1 AND review_status = 'PENDING_REVIEW'`,
      [submission.attempt_id]
    );

    if (parseInt(pendingResult.rows[0].pending) === 0) {
      // Calculate total score: average of (manual_score ?? auto_score) across all submissions
      const scoresResult = await pool.query(
        `SELECT COALESCE(manual_score, auto_score, 0) AS score
         FROM Submissions WHERE attempt_id = $1`,
        [submission.attempt_id]
      );

      const scores = scoresResult.rows.map(r => parseFloat(r.score));
      const totalScore = scores.length > 0
        ? (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
        : 0;

      await pool.query(
        `UPDATE TestAttempts SET status = 'GRADED', total_score = $1 WHERE id = $2`,
        [totalScore, submission.attempt_id]
      );
    }

    res.json({ message: 'Submission graded.', submission: result.rows[0] });
  } catch (err) {
    console.error('Admin grade submission error:', err);
    res.status(500).json({ error: 'Failed to grade submission.' });
  }
});

// ======================================================================
//  STUDENTS — List all students
// ======================================================================

// GET /api/admin/students
router.get('/students', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.created_at,
              COUNT(DISTINCT ta.id) AS total_attempts,
              AVG(ta.total_score) AS average_score
       FROM Users u
       LEFT JOIN TestAttempts ta ON ta.user_id = u.id AND ta.status = 'GRADED'
       WHERE u.role = 'STUDENT'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json({ students: result.rows });
  } catch (err) {
    console.error('Admin list students error:', err);
    res.status(500).json({ error: 'Failed to retrieve students.' });
  }
});

// GET /api/admin/students/:id — Single student details with attempts
router.get('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      'SELECT id, email, full_name, role, created_at FROM Users WHERE id = $1 AND role = $2',
      [id, 'STUDENT']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const attemptsResult = await pool.query(
      `SELECT ta.*, c.title AS course_title
       FROM TestAttempts ta
       JOIN Courses c ON ta.course_id = c.id
       WHERE ta.user_id = $1
       ORDER BY ta.start_time DESC`,
      [id]
    );

    const accessResult = await pool.query(
      `SELECT ua.*, ac.code
       FROM UserAccess ua
       JOIN AccessCodes ac ON ua.access_code_id = ac.id
       WHERE ua.user_id = $1
       ORDER BY ua.unlocked_at DESC`,
      [id]
    );

    res.json({
      student: {
        ...userResult.rows[0],
        attempts: attemptsResult.rows,
        access: accessResult.rows
      }
    });
  } catch (err) {
    console.error('Admin get student error:', err);
    res.status(500).json({ error: 'Failed to retrieve student details.' });
  }
});

// ======================================================================
//  ATTEMPTS — Admin view all attempts
// ======================================================================

// GET /api/admin/attempts
router.get('/attempts', async (req, res) => {
  try {
    const { status, course_id } = req.query;

    let query = `
      SELECT ta.*, u.full_name AS student_name, u.email AS student_email,
             c.title AS course_title
      FROM TestAttempts ta
      JOIN Users u ON ta.user_id = u.id
      JOIN Courses c ON ta.course_id = c.id
    `;

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`ta.status = $${params.length}`);
    }

    if (course_id) {
      params.push(course_id);
      conditions.push(`ta.course_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ta.start_time DESC';

    const result = await pool.query(query, params);
    res.json({ attempts: result.rows });
  } catch (err) {
    console.error('Admin list attempts error:', err);
    res.status(500).json({ error: 'Failed to retrieve attempts.' });
  }
});

module.exports = router;

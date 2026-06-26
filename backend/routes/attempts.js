const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// ============================================
// POST /api/attempts/start — Start a new test attempt
// ============================================
router.post('/start', authenticate, async (req, res) => {
  try {
    const { course_id } = req.body;
    const userId = req.user.id;

    if (!course_id) {
      return res.status(400).json({ error: 'course_id is required.' });
    }

    // Verify course exists
    const courseResult = await pool.query('SELECT id, title FROM Courses WHERE id = $1', [course_id]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Check for existing in-progress attempt
    const existing = await pool.query(
      `SELECT id FROM TestAttempts
       WHERE user_id = $1 AND course_id = $2 AND status = 'IN_PROGRESS'`,
      [userId, course_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: 'You already have an in-progress attempt for this course.',
        attempt_id: existing.rows[0].id
      });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO TestAttempts (id, user_id, course_id, status)
       VALUES ($1, $2, $3, 'IN_PROGRESS')`,
      [id, userId, course_id]
    );

    res.status(201).json({
      message: 'Test attempt started.',
      attempt: {
        id,
        course_id,
        course_title: courseResult.rows[0].title,
        status: 'IN_PROGRESS'
      }
    });
  } catch (err) {
    console.error('Start attempt error:', err);
    res.status(500).json({ error: 'Failed to start test attempt.' });
  }
});

// ============================================
// POST /api/attempts/:id/submit — Submit answers for an attempt
// Body: { answers: [{ question_id, text_response?, audio_response_url? }] }
// ============================================
router.post('/:id/submit', authenticate, async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'answers array is required and must not be empty.' });
    }

    // Verify attempt belongs to user and is in progress
    const attemptResult = await client.query(
      `SELECT * FROM TestAttempts WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found.' });
    }

    const attempt = attemptResult.rows[0];
    if (attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'This attempt has already been submitted.' });
    }

    await client.query('BEGIN');

    let totalAutoScore = 0;
    let autoScoredCount = 0;
    let totalQuestions = answers.length;
    const submissions = [];

    for (const answer of answers) {
      const { question_id, text_response, audio_response_url } = answer;

      if (!question_id) continue;

      // Get the question and its task type
      const questionResult = await client.query(
        `SELECT q.id, q.task_id, t.task_type
         FROM Questions q
         JOIN Tasks t ON q.task_id = t.id
         WHERE q.id = $1`,
        [question_id]
      );

      if (questionResult.rows.length === 0) continue;

      const question = questionResult.rows[0];
      const taskType = question.task_type;

      let autoScore = null;
      let reviewStatus = 'PENDING_REVIEW';

      // Auto-score for MCQ, COMPLETE_WORDS, BUILD_SENTENCE
      if (['MCQ', 'COMPLETE_WORDS', 'BUILD_SENTENCE'].includes(taskType) && text_response) {
        // For MCQ: text_response is the selected option ID
        // For COMPLETE_WORDS / BUILD_SENTENCE: text_response is compared to correct option content
        const correctOptions = await client.query(
          `SELECT id, content FROM AnswerOptions
           WHERE question_id = $1 AND is_correct = true`,
          [question_id]
        );

        if (correctOptions.rows.length > 0) {
          let isCorrect = false;

          if (taskType === 'MCQ') {
            // Check if the selected option ID is correct
            isCorrect = correctOptions.rows.some(opt => opt.id === text_response);

            // Also allow matching by content for flexibility
            if (!isCorrect) {
              isCorrect = correctOptions.rows.some(
                opt => opt.content.trim().toLowerCase() === text_response.trim().toLowerCase()
              );
            }
          } else {
            // COMPLETE_WORDS & BUILD_SENTENCE: match content
            isCorrect = correctOptions.rows.some(
              opt => opt.content.trim().toLowerCase() === text_response.trim().toLowerCase()
            );
          }

          autoScore = isCorrect ? 1.0 : 0.0;
          reviewStatus = 'AUTO_GRADED';
          totalAutoScore += autoScore;
          autoScoredCount++;
        }
      }

      const submissionId = uuidv4();
      await client.query(
        `INSERT INTO Submissions (id, attempt_id, question_id, text_response, audio_response_url, auto_score, review_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [submissionId, id, question_id, text_response || null, audio_response_url || null, autoScore, reviewStatus]
      );

      submissions.push({
        id: submissionId,
        question_id,
        auto_score: autoScore,
        review_status: reviewStatus
      });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Answers submitted successfully.',
      attempt: {
        id,
        submissions_count: submissions.length,
        auto_scored_count: autoScoredCount
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Submit attempt error:', err);
    res.status(500).json({ error: 'Failed to submit attempt.' });
  } finally {
    client.release();
  }
});

// ============================================
// POST /api/attempts/:id/finish — Finish test attempt
// ============================================
router.post('/:id/finish', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify attempt belongs to user
    const attemptResult = await client.query(
      `SELECT * FROM TestAttempts WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found.' });
    }

    const attempt = attemptResult.rows[0];
    if (attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'This attempt has already been finished.' });
    }

    await client.query('BEGIN');

    // Get all submissions for this attempt to calculate overall score
    const subsResult = await client.query(
      `SELECT auto_score, review_status FROM Submissions WHERE attempt_id = $1`,
      [id]
    );

    const submissions = subsResult.rows;
    let totalAutoScore = 0;
    let autoScoredCount = 0;

    for (const sub of submissions) {
      if (sub.auto_score !== null) {
        totalAutoScore += parseFloat(sub.auto_score);
        autoScoredCount++;
      }
    }

    const overallScore = autoScoredCount > 0
      ? (totalAutoScore / autoScoredCount) * 100
      : null;

    const hasManualQuestions = submissions.some(s => s.review_status === 'PENDING_REVIEW');
    const finalStatus = hasManualQuestions ? 'SUBMITTED' : 'GRADED';

    await client.query(
      `UPDATE TestAttempts
       SET status = $1, end_time = CURRENT_TIMESTAMP, total_score = $2
       WHERE id = $3`,
      [finalStatus, overallScore, id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Attempt finished successfully.',
      attempt: {
        id,
        status: finalStatus,
        total_score: overallScore
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Finish attempt error:', err);
    res.status(500).json({ error: 'Failed to finish test attempt.' });
  } finally {
    client.release();
  }
});


// ============================================
// GET /api/attempts/my — List current user's attempts
// ============================================
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT ta.id, ta.course_id, c.title AS course_title, ta.start_time,
              ta.end_time, ta.status, ta.total_score
       FROM TestAttempts ta
       JOIN Courses c ON ta.course_id = c.id
       WHERE ta.user_id = $1
       ORDER BY ta.start_time DESC`,
      [userId]
    );

    res.json({ attempts: result.rows });
  } catch (err) {
    console.error('List attempts error:', err);
    res.status(500).json({ error: 'Failed to retrieve attempts.' });
  }
});

// ============================================
// GET /api/attempts/:id — Get single attempt with submissions
// ============================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    // Build query — admin can view any attempt, students only their own
    let query = `
      SELECT ta.*, c.title AS course_title
      FROM TestAttempts ta
      JOIN Courses c ON ta.course_id = c.id
      WHERE ta.id = $1
    `;
    const params = [id];

    if (!isAdmin) {
      query += ' AND ta.user_id = $2';
      params.push(userId);
    }

    const attemptResult = await pool.query(query, params);

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found.' });
    }

    const attempt = attemptResult.rows[0];

    // Get submissions with question details
    const submissionsResult = await pool.query(
      `SELECT s.id, s.question_id, q.prompt, q.text_content, s.text_response,
              s.audio_response_url, s.auto_score, s.manual_score, s.review_status,
              s.admin_feedback, s.submitted_at,
              t.task_type, t.title AS task_title
       FROM Submissions s
       JOIN Questions q ON s.question_id = q.id
       JOIN Tasks t ON q.task_id = t.id
       WHERE s.attempt_id = $1
       ORDER BY s.submitted_at`,
      [id]
    );

    res.json({
      attempt: {
        ...attempt,
        submissions: submissionsResult.rows
      }
    });
  } catch (err) {
    console.error('Get attempt error:', err);
    res.status(500).json({ error: 'Failed to retrieve attempt details.' });
  }
});

module.exports = router;

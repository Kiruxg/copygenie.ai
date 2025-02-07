const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const pool = require("../db/pool");

// Get all projects
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
                p.*,
                COUNT(g.id) as description_count,
                MAX(g.created_at) as last_generated
            FROM projects p
            LEFT JOIN generations g ON p.id = g.project_id
            WHERE p.user_id = $1
            GROUP BY p.id
            ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get single project with its descriptions
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const project = await pool.query(
      "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const descriptions = await pool.query(
      "SELECT * FROM generations WHERE project_id = $1 ORDER BY created_at DESC",
      [req.params.id]
    );

    res.json({
      ...project.rows[0],
      descriptions: descriptions.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post("/", authenticateToken, async (req, res, next) => {
  try {
    const { name, category, description } = req.body;
    const result = await pool.query(
      `INSERT INTO projects 
            (name, category, description, user_id) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`,
      [name, category, description, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update project
router.put("/:id", authenticateToken, async (req, res, next) => {
  try {
    const { name, category, description } = req.body;
    const result = await pool.query(
      `UPDATE projects 
            SET name = $1, category = $2, description = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND user_id = $5 
            RETURNING *`,
      [name, category, description, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete("/:id", authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const { Router } = require('express');

const CACHE_KEY = 'tasks:all';
const CACHE_TTL = 60; // secondes

module.exports = (pool, redisClient) => {
  const router = Router();

  // GET /tasks — liste toutes les tâches (avec cache Redis)
  router.get('/', async (req, res) => {
    try {
      const cached = await redisClient.get(CACHE_KEY);
      if (cached) {
        return res.json({ source: 'cache', data: JSON.parse(cached) });
      }

      const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
      await redisClient.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(result.rows));

      res.json({ source: 'db', data: result.rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /tasks — crée une nouvelle tâche
  router.post('/', async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Le champ title est requis' });

    try {
      const result = await pool.query(
        'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
        [title]
      );
      await redisClient.del(CACHE_KEY);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /tasks/:id — met à jour une tâche
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, done } = req.body;

    try {
      const result = await pool.query(
        'UPDATE tasks SET title = COALESCE($1, title), done = COALESCE($2, done) WHERE id = $3 RETURNING *',
        [title, done, id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'Tâche introuvable' });

      await redisClient.del(CACHE_KEY);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /tasks/:id — supprime une tâche
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Tâche introuvable' });

      await redisClient.del(CACHE_KEY);
      res.json({ message: 'Tâche supprimée', task: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};

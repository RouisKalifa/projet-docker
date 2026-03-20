import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/tasks';

async function apiFetch(path = '', options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  return res.json();
}

export default function App() {
  const [tasks, setTasks]       = useState([]);
  const [source, setSource]     = useState(null);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch();
      setTasks(data.data);
      setSource(data.source);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (e) => {
    e.preventDefault();
    const title = input.trim();
    if (!title) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      setInput('');
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTask = async (task) => {
    setError(null);
    try {
      await apiFetch(`/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ done: !task.done }),
      });
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTask = async (id) => {
    setError(null);
    try {
      await apiFetch(`/${id}`, { method: 'DELETE' });
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const pending   = tasks.filter((t) => !t.done).length;
  const completed = tasks.filter((t) =>  t.done).length;

  return (
    <div className="app">
      <header className="header">
        <h1>Todo App</h1>
        <p className="subtitle">Gestion de tâches conteneurisée avec Docker</p>
      </header>

      <main className="container">
        {/* Formulaire d'ajout */}
        <form className="add-form" onSubmit={addTask}>
          <input
            className="add-input"
            type="text"
            placeholder="Nouvelle tâche…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={submitting}
            maxLength={200}
          />
          <button className="btn btn-primary" type="submit" disabled={submitting || !input.trim()}>
            {submitting ? '…' : 'Ajouter'}
          </button>
        </form>

        {/* Erreur */}
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
            <button className="alert-close" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Stats + source cache */}
        {!loading && tasks.length > 0 && (
          <div className="stats">
            <span>{pending} en cours</span>
            <span>{completed} terminée{completed > 1 ? 's' : ''}</span>
            {source && (
              <span className={`badge badge-${source}`}>
                {source === 'cache' ? '⚡ Redis cache' : '🗄️ PostgreSQL'}
              </span>
            )}
          </div>
        )}

        {/* Liste des tâches */}
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Chargement…</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty">
            <span>Aucune tâche pour l'instant.</span>
            <small>Ajoutez-en une ci-dessus !</small>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className={`task-item ${task.done ? 'done' : ''}`}>
                <button
                  className="task-check"
                  onClick={() => toggleTask(task)}
                  aria-label={task.done ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                >
                  {task.done ? '✅' : '⬜'}
                </button>
                <span className="task-title">{task.title}</span>
                <button
                  className="btn btn-danger"
                  onClick={() => deleteTask(task.id)}
                  aria-label="Supprimer la tâche"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="footer">
        <small>Node.js · PostgreSQL · Redis · Nginx · Docker</small>
      </footer>
    </div>
  );
}

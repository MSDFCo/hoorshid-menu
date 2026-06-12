// Activity log: every admin action is recorded with who did it.
import db from '../db.js';

const insert = db.prepare(
  'INSERT INTO activity_log (user_id, username, action, detail) VALUES (?, ?, ?, ?)'
);
// keep the log bounded — the newest 5000 entries are plenty for monitoring
const prune = db.prepare(
  'DELETE FROM activity_log WHERE id <= (SELECT COALESCE(MAX(id), 0) FROM activity_log) - 5000'
);

export function logAction(req, action, detail = '') {
  const user = req.user || {};
  insert.run(user.id ?? null, user.username ?? '', action, String(detail).slice(0, 600));
  prune.run();
}

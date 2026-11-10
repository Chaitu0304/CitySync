import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Router } from 'express';
import { env } from '../config/env.js';
import { query } from '../db/database.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { verifyPassword, hashPassword, signToken } from '../utils/auth.js';
import { AppError, asyncHandler, ok } from '../utils/http.js';
import { id, now } from '../utils/id.js';
import { createInvite } from '../services/invites.js';

const router = Router();
const requireAdmin = [requireAuth, allowRoles('admin')];

// 1. Admin Login (Requires ID/Email + Password + Master Admin Security Key)
router.post('/auth/login', asyncHandler(async (req, res) => {
  const { identifier, password, masterKey } = req.body || {};
  if (!identifier || !password || !masterKey) {
    throw new AppError(400, 'Admin ID, password, and Master Security Key are all required.');
  }

  // Verify Master Security Key
  if (masterKey.trim() !== env.adminMasterKey) {
    throw new AppError(403, 'Invalid Master Security Key. Access denied.');
  }

  const lookup = String(identifier).trim().toLowerCase();
  const { rows } = await query(
    `SELECT * FROM users 
     WHERE role = 'admin' AND (LOWER(email) = $1 OR LOWER(employee_id) = $1 OR LOWER(username) = $1)`,
    [lookup]
  );

  const admin = rows[0];
  if (!admin || !admin.active) {
    throw new AppError(401, 'Invalid admin credentials or account is suspended.');
  }

  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) {
    throw new AppError(401, 'Invalid admin credentials.');
  }

  const token = signToken(admin);
  const { password_hash, ...safeAdmin } = admin;

  ok(res, {
    user: safeAdmin,
    token,
  });
}));

// 2. Executive Command Center Stats
router.get('/stats', requireAdmin, asyncHandler(async (_req, res) => {
  // Aggregate complaint counts by status
  const complaintStats = await query(`
    SELECT 
      COUNT(*)::int AS total_complaints,
      COUNT(CASE WHEN status = 'submitted' THEN 1 END)::int AS submitted,
      COUNT(CASE WHEN status = 'review' THEN 1 END)::int AS in_review,
      COUNT(CASE WHEN status = 'assigned' THEN 1 END)::int AS assigned,
      COUNT(CASE WHEN status = 'progress' THEN 1 END)::int AS in_progress,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END)::int AS resolved,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END)::int AS rejected,
      COUNT(CASE WHEN is_emergency = TRUE THEN 1 END)::int AS emergencies,
      COUNT(CASE WHEN status NOT IN ('resolved', 'rejected') AND expected_by < NOW() THEN 1 END)::int AS overdue
    FROM complaints
  `);

  // Breakdown by Category
  const categoryStats = await query(`
    SELECT category, COUNT(*)::int AS count
    FROM complaints
    GROUP BY category
    ORDER BY count DESC
  `);

  // Breakdown by Area
  const areaStats = await query(`
    SELECT 
      c.area,
      COUNT(c.id)::int AS total,
      COUNT(CASE WHEN c.status = 'resolved' THEN 1 END)::int AS resolved,
      COUNT(CASE WHEN c.status IN ('assigned', 'progress') THEN 1 END)::int AS active,
      COALESCE(w.worker_count, 0)::int AS workers_count,
      COALESCE(a.authority_count, 0)::int AS authorities_count
    FROM complaints c
    LEFT JOIN (
      SELECT area, COUNT(*)::int AS worker_count 
      FROM users WHERE role = 'worker' AND active = TRUE GROUP BY area
    ) w ON w.area = c.area
    LEFT JOIN (
      SELECT area, COUNT(*)::int AS authority_count 
      FROM users WHERE role = 'authority' AND active = TRUE GROUP BY area
    ) a ON a.area = c.area
    GROUP BY c.area, w.worker_count, a.authority_count
    ORDER BY total DESC
  `);

  // Users totals
  const userStats = await query(`
    SELECT 
      COUNT(CASE WHEN role = 'citizen' THEN 1 END)::int AS total_citizens,
      COUNT(CASE WHEN role = 'authority' THEN 1 END)::int AS total_authorities,
      COUNT(CASE WHEN role = 'worker' THEN 1 END)::int AS total_workers,
      COUNT(CASE WHEN role = 'worker' AND approved = FALSE THEN 1 END)::int AS pending_workers
    FROM users
  `);

  ok(res, {
    complaints: complaintStats.rows[0],
    categories: categoryStats.rows,
    areas: areaStats.rows,
    users: userStats.rows[0],
  });
}));

// 3. Authorities Management
router.get('/authorities', requireAdmin, asyncHandler(async (_req, res) => {
  const { rows } = await query(`
    SELECT id, name, email, employee_id, phone, area, department, active, created_at, updated_at
    FROM users
    WHERE role = 'authority'
    ORDER BY created_at DESC
  `);
  ok(res, { authorities: rows });
}));

router.post('/authorities', requireAdmin, asyncHandler(async (req, res) => {
  const { name, email, area, phone, employeeId, password } = req.body || {};
  if (!name || !email || !area) {
    throw new AppError(400, 'Name, email, and jurisdiction area are required.');
  }

  // Generate or use employee ID
  let finalEmpId = employeeId?.trim();
  if (!finalEmpId) {
    const randomNum = Math.floor(100 + Math.random() * 900);
    finalEmpId = `AUTH-${randomNum}`;
  }

  const rawPassword = password?.trim() || `Auth@${crypto.randomBytes(3).toString('hex')}!`;
  const passwordHash = await hashPassword(rawPassword);
  const userId = id('usr_auth_');
  const timestamp = now();

  await query(
    `INSERT INTO users (id, role, name, email, employee_id, password_hash, phone, area, active, email_verified, created_at, updated_at)
     VALUES ($1, 'authority', $2, $3, $4, $5, $6, $7, TRUE, TRUE, $8, $8)`,
    [userId, name, email.toLowerCase().trim(), finalEmpId, passwordHash, phone || null, area, timestamp]
  );

  ok(res, {
    message: 'Municipal Authority created successfully.',
    authority: {
      id: userId,
      name,
      email,
      employeeId: finalEmpId,
      area,
      temporaryPassword: rawPassword,
    },
  }, 201);
}));

router.patch('/authorities/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id: targetId } = req.params;
  const { active, area, name, phone } = req.body || {};

  const updates = [];
  const values = [targetId];

  if (active !== undefined) {
    values.push(Boolean(active));
    updates.push(`active = $${values.length}`);
  }
  if (area) {
    values.push(area);
    updates.push(`area = $${values.length}`);
  }
  if (name) {
    values.push(name);
    updates.push(`name = $${values.length}`);
  }
  if (phone !== undefined) {
    values.push(phone);
    updates.push(`phone = $${values.length}`);
  }

  if (updates.length === 0) throw new AppError(400, 'No update fields provided.');
  updates.push(`updated_at = NOW()`);

  const { rows } = await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $1 AND role = 'authority' RETURNING id, name, email, employee_id, area, active`,
    values
  );

  if (rows.length === 0) throw new AppError(404, 'Authority account not found.');
  ok(res, { authority: rows[0] });
}));

// 4. Invite Code Management
router.get('/invites', requireAdmin, asyncHandler(async (_req, res) => {
  const { rows } = await query(`
    SELECT i.id, i.area, i.note, i.expires_at, i.used_at, i.created_at,
           u.name AS used_by_name, u.email AS used_by_email, u.employee_id AS used_by_emp_id
    FROM authority_invites i
    LEFT JOIN users u ON u.id = i.used_by
    ORDER BY i.created_at DESC
  `);
  ok(res, { invites: rows });
}));

router.post('/invites', requireAdmin, asyncHandler(async (req, res) => {
  const { area, days = 7, note } = req.body || {};
  if (!area) throw new AppError(400, 'Area is required for creating an invite code.');

  const invite = await createInvite({ area, days: Number(days) || 7, note });
  ok(res, {
    message: 'Invite code generated successfully.',
    invite,
  }, 201);
}));

router.delete('/invites/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id: inviteId } = req.params;
  const { rowCount } = await query('DELETE FROM authority_invites WHERE id = $1 AND used_at IS NULL', [inviteId]);
  if (!rowCount) throw new AppError(404, 'Active invite code not found or already consumed.');
  ok(res, { message: 'Invite code revoked successfully.' });
}));

// 5. Citizen Master Directory
router.get('/citizens', requireAdmin, asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const areaFilter = String(req.query.area || '').trim();

  let sql = `
    SELECT u.id, u.name, u.email, u.mobile, u.phone, u.area, u.active, u.email_verified, u.created_at,
           COUNT(c.id)::int AS complaints_count
    FROM users u
    LEFT JOIN complaints c ON c.citizen_id = u.id
    WHERE u.role = 'citizen'
  `;
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(COALESCE(u.email,'')) LIKE $${params.length} OR LOWER(COALESCE(u.mobile,'')) LIKE $${params.length})`;
  }
  if (areaFilter) {
    params.push(areaFilter);
    sql += ` AND u.area = $${params.length}`;
  }

  sql += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT 200`;

  const { rows } = await query(sql, params);
  ok(res, { citizens: rows });
}));

router.patch('/citizens/:id/status', requireAdmin, asyncHandler(async (req, res) => {
  const { id: targetId } = req.params;
  const { active } = req.body || {};
  if (active === undefined) throw new AppError(400, 'Active state is required.');

  const { rows } = await query(
    `UPDATE users SET active = $1, updated_at = NOW() WHERE id = $2 AND role = 'citizen' RETURNING id, name, email, active`,
    [Boolean(active), targetId]
  );
  if (rows.length === 0) throw new AppError(404, 'Citizen account not found.');
  ok(res, { citizen: rows[0] });
}));

router.get('/citizens/:id/complaints', requireAdmin, asyncHandler(async (req, res) => {
  const { id: citizenId } = req.params;
  const { rows } = await query(
    `SELECT id, category, description, location, status, priority, area, created_at, completed_at
     FROM complaints
     WHERE citizen_id = $1
     ORDER BY created_at DESC`,
    [citizenId]
  );
  ok(res, { complaints: rows });
}));

// 6. Worker Master Directory
router.get('/workers', requireAdmin, asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const areaFilter = String(req.query.area || '').trim();
  const deptFilter = String(req.query.department || '').trim();

  let sql = `
    SELECT u.id, u.name, u.email, u.username, u.worker_id, u.department, u.area, u.phone, u.active, u.approved, u.created_at,
           COUNT(CASE WHEN c.status IN ('assigned','progress') THEN 1 END)::int AS active_tasks,
           COUNT(CASE WHEN c.status = 'resolved' THEN 1 END)::int AS completed_tasks
    FROM users u
    LEFT JOIN complaints c ON c.worker_id = u.id
    WHERE u.role = 'worker'
  `;
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(COALESCE(u.worker_id,'')) LIKE $${params.length} OR LOWER(COALESCE(u.username,'')) LIKE $${params.length})`;
  }
  if (areaFilter) {
    params.push(areaFilter);
    sql += ` AND u.area = $${params.length}`;
  }
  if (deptFilter) {
    params.push(deptFilter);
    sql += ` AND u.department = $${params.length}`;
  }

  sql += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT 200`;

  const { rows } = await query(sql, params);
  ok(res, { workers: rows });
}));

router.patch('/workers/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id: workerId } = req.params;
  const { approved, active, area, department } = req.body || {};

  const updates = [];
  const values = [workerId];

  if (approved !== undefined) {
    values.push(Boolean(approved));
    updates.push(`approved = $${values.length}`);
  }
  if (active !== undefined) {
    values.push(Boolean(active));
    updates.push(`active = $${values.length}`);
  }
  if (area) {
    values.push(area);
    updates.push(`area = $${values.length}`);
  }
  if (department) {
    values.push(department);
    updates.push(`department = $${values.length}`);
  }

  if (updates.length === 0) throw new AppError(400, 'No update fields provided.');
  updates.push(`updated_at = NOW()`);

  const { rows } = await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $1 AND role = 'worker' RETURNING id, name, worker_id, area, department, approved, active`,
    values
  );

  if (rows.length === 0) throw new AppError(404, 'Worker not found.');
  ok(res, { worker: rows[0] });
}));

// 7. System Health & Infrastructure
router.get('/system', requireAdmin, asyncHandler(async (_req, res) => {
  const uploadDir = path.resolve(env.uploadDir);
  let uploadSizeBytes = 0;
  let uploadFilesCount = 0;

  try {
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      uploadFilesCount = files.length;
      for (const file of files) {
        try {
          const stats = fs.statSync(path.join(uploadDir, file));
          uploadSizeBytes += stats.size;
        } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }

  const dbPool = await query(`SELECT count(*)::int as active_connections FROM pg_stat_activity WHERE datname = current_database()`);

  ok(res, {
    environment: env.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    database: {
      status: 'connected',
      activeConnections: dbPool.rows[0]?.active_connections || 1,
    },
    storage: {
      uploadDir: env.uploadDir,
      fileCount: uploadFilesCount,
      usedMb: +(uploadSizeBytes / (1024 * 1024)).toFixed(2),
      maxMb: env.maxUploadDirMb,
    },
    geofenceActive: env.geofenceComplaints,
    strictPhotoCheck: env.strictPhotoCheck,
  });
}));

export default router;


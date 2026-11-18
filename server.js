const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { initDatabase, syncJsonSnapshot } = require('./seed');

const db = initDatabase();
syncJsonSnapshot(db);

const PORT = process.env.PORT || 3456;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    if (pathname === '/api/bootstrap' && method === 'GET') {
      return sendJson(res, 200, syncJsonSnapshot(db));
    }

    if (pathname === '/api/export' && method === 'GET') {
      const data = syncJsonSnapshot(db);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="lev-ari-cloud-backup.json"'
      });
      return res.end(JSON.stringify(data, null, 2));
    }

    if (pathname === '/api/metadata' && method === 'PUT') {
      const b = await parseBody(req);
      const upsert = db.prepare(`
        INSERT INTO workbook_metadata (meta_key, meta_value, worksheet_source, updated_at)
        VALUES (?, ?, 'Workbook', CURRENT_TIMESTAMP)
        ON CONFLICT(meta_key) DO UPDATE SET meta_value = excluded.meta_value, updated_at = CURRENT_TIMESTAMP
      `);
      for (const key of [
        'weekly_capacity_he',
        'weekly_capacity_en',
        'working_principle_he',
        'working_principle_en',
        'schools_verification_note_he',
        'schools_verification_note_en'
      ]) {
        if (typeof b[key] === 'string') {
          upsert.run(key, b[key]);
        }
      }
      return sendJson(res, 200, syncJsonSnapshot(db));
    }

    // TASKS (Create & Update — Protected from deletion)
    if (pathname === '/api/tasks' && method === 'POST') {
      const b = await parseBody(req);
      const maxNum = db.prepare('SELECT COALESCE(MAX(task_number), 0) as maxNum FROM tasks_v2').get().maxNum;
      const titleHe = (b.task_he || b.task_en || '').trim();
      const titleEn = (b.task_en || b.task_he || '').trim();

      db.prepare(`
        INSERT INTO tasks_v2 (
          task_number, priority, task_he, task_en, description_he, description_en,
          status, next_action_he, next_action_en, owner_he, owner_en,
          output_results_he, output_results_en, links_files, notes_approval_he, notes_approval_en, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        b.task_number || (maxNum + 1),
        b.priority || 'P4',
        titleHe,
        titleEn,
        b.description_he || b.description_en || '',
        b.description_en || b.description_he || '',
        b.status || 'Not started',
        b.next_action_he || b.next_action_en || '',
        b.next_action_en || b.next_action_he || '',
        b.owner_he || 'אופק',
        b.owner_en || 'Ofek',
        b.output_results_he || b.output_results_en || '',
        b.output_results_en || b.output_results_he || '',
        b.links_files || '',
        b.notes_approval_he || b.notes_approval_en || '',
        b.notes_approval_en || b.notes_approval_he || ''
      );
      return sendJson(res, 201, syncJsonSnapshot(db));
    }

    if (pathname.startsWith('/api/tasks/') && method === 'PUT') {
      const id = Number(pathname.split('/')[3]);
      const b = await parseBody(req);
      const existing = db.prepare('SELECT * FROM tasks_v2 WHERE id = ?').get(id);
      if (!existing) return sendJson(res, 404, { error: 'Task not found' });

      db.prepare(`
        UPDATE tasks_v2 SET
          priority = ?,
          task_he = ?,
          task_en = ?,
          description_he = ?,
          description_en = ?,
          status = ?,
          next_action_he = ?,
          next_action_en = ?,
          owner_he = ?,
          owner_en = ?,
          output_results_he = ?,
          output_results_en = ?,
          links_files = ?,
          notes_approval_he = ?,
          notes_approval_en = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        b.priority ?? existing.priority,
        b.task_he ?? existing.task_he,
        b.task_en ?? existing.task_en,
        b.description_he ?? existing.description_he,
        b.description_en ?? existing.description_en,
        b.status ?? existing.status,
        b.next_action_he ?? existing.next_action_he,
        b.next_action_en ?? existing.next_action_en,
        b.owner_he ?? existing.owner_he,
        b.owner_en ?? existing.owner_en,
        b.output_results_he ?? existing.output_results_he,
        b.output_results_en ?? existing.output_results_en,
        b.links_files ?? existing.links_files,
        b.notes_approval_he ?? existing.notes_approval_he,
        b.notes_approval_en ?? existing.notes_approval_en,
        id
      );

      return sendJson(res, 200, syncJsonSnapshot(db));
    }

    // SCHOOLS (Create & Update — Protected from deletion)
    if (pathname === '/api/schools' && method === 'POST') {
      const b = await parseBody(req);
      const maxNum = db.prepare("SELECT COALESCE(MAX(record_number), 0) as maxNum FROM schools_v2 WHERE record_type = 'prospect'").get().maxNum;
      const instHe = (b.institution_he || b.institution_en || '').trim();
      const instEn = (b.institution_en || b.institution_he || '').trim();

      db.prepare(`
        INSERT INTO schools_v2 (
          record_number, record_type, institution_he, institution_en, location_he, location_en,
          relevant_program_he, relevant_program_en, decision_maker_he, decision_maker_en,
          verified_email, verified_phone, website, fit_opportunity_he, fit_opportunity_en,
          outreach_message_he, outreach_message_en, status, response_result_he, response_result_en,
          next_action_he, next_action_en, notes_he, notes_en, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        b.record_number || (maxNum + 1),
        b.record_type || 'prospect',
        instHe,
        instEn,
        b.location_he || b.location_en || '',
        b.location_en || b.location_he || '',
        b.relevant_program_he || b.relevant_program_en || '',
        b.relevant_program_en || b.relevant_program_he || '',
        b.decision_maker_he || b.decision_maker_en || '',
        b.decision_maker_en || b.decision_maker_he || '',
        b.verified_email || '',
        b.verified_phone || '',
        b.website || '',
        b.fit_opportunity_he || b.fit_opportunity_en || '',
        b.fit_opportunity_en || b.fit_opportunity_he || '',
        b.outreach_message_he || '',
        b.outreach_message_en || '',
        b.status || 'Ready for approval',
        b.response_result_he || b.response_result_en || '',
        b.response_result_en || b.response_result_he || '',
        b.next_action_he || b.next_action_en || '',
        b.next_action_en || b.next_action_he || '',
        b.notes_he || b.notes_en || '',
        b.notes_en || b.notes_he || ''
      );
      return sendJson(res, 201, syncJsonSnapshot(db));
    }

    if (pathname.startsWith('/api/schools/') && method === 'PUT') {
      const id = Number(pathname.split('/')[3]);
      const b = await parseBody(req);
      const existing = db.prepare('SELECT * FROM schools_v2 WHERE id = ?').get(id);
      if (!existing) return sendJson(res, 404, { error: 'School record not found' });

      db.prepare(`
        UPDATE schools_v2 SET
          record_type = ?,
          institution_he = ?,
          institution_en = ?,
          location_he = ?,
          location_en = ?,
          relevant_program_he = ?,
          relevant_program_en = ?,
          decision_maker_he = ?,
          decision_maker_en = ?,
          verified_email = ?,
          verified_phone = ?,
          website = ?,
          fit_opportunity_he = ?,
          fit_opportunity_en = ?,
          outreach_message_he = ?,
          outreach_message_en = ?,
          status = ?,
          response_result_he = ?,
          response_result_en = ?,
          next_action_he = ?,
          next_action_en = ?,
          notes_he = ?,
          notes_en = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        b.record_type ?? existing.record_type,
        b.institution_he ?? existing.institution_he,
        b.institution_en ?? existing.institution_en,
        b.location_he ?? existing.location_he,
        b.location_en ?? existing.location_en,
        b.relevant_program_he ?? existing.relevant_program_he,
        b.relevant_program_en ?? existing.relevant_program_en,
        b.decision_maker_he ?? existing.decision_maker_he,
        b.decision_maker_en ?? existing.decision_maker_en,
        b.verified_email ?? existing.verified_email,
        b.verified_phone ?? existing.verified_phone,
        b.website ?? existing.website,
        b.fit_opportunity_he ?? existing.fit_opportunity_he,
        b.fit_opportunity_en ?? existing.fit_opportunity_en,
        b.outreach_message_he ?? existing.outreach_message_he,
        b.outreach_message_en ?? existing.outreach_message_en,
        b.status ?? existing.status,
        b.response_result_he ?? existing.response_result_he,
        b.response_result_en ?? existing.response_result_en,
        b.next_action_he ?? existing.next_action_he,
        b.next_action_en ?? existing.next_action_en,
        b.notes_he ?? existing.notes_he,
        b.notes_en ?? existing.notes_en,
        id
      );

      return sendJson(res, 200, syncJsonSnapshot(db));
    }

    // ATHLETIC GROUPS (Create & Update — Protected from deletion)
    if (pathname === '/api/athletic-groups' && method === 'POST') {
      const b = await parseBody(req);
      const maxSlot = db.prepare('SELECT COALESCE(MAX(slot_number), 0) as maxSlot FROM athletic_groups_v2').get().maxSlot;

      db.prepare(`
        INSERT INTO athletic_groups_v2 (
          slot_number, category, club_organization_he, club_organization_en,
          location_he, location_en, decision_maker_he, decision_maker_en,
          contact_details, website_social, approx_membership_he, approx_membership_en,
          potential_opportunity_he, potential_opportunity_en, outreach_message_he, outreach_message_en,
          status, response_result_he, response_result_en, next_action_he, next_action_en, notes_he, notes_en, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        b.slot_number || (maxSlot + 1),
        b.category || 'Running',
        b.club_organization_he || b.club_organization_en || '',
        b.club_organization_en || b.club_organization_he || '',
        b.location_he || b.location_en || '',
        b.location_en || b.location_he || '',
        b.decision_maker_he || b.decision_maker_en || '',
        b.decision_maker_en || b.decision_maker_he || '',
        b.contact_details || '',
        b.website_social || '',
        b.approx_membership_he || b.approx_membership_en || '',
        b.approx_membership_en || b.approx_membership_he || '',
        b.potential_opportunity_he || b.potential_opportunity_en || '',
        b.potential_opportunity_en || b.potential_opportunity_he || '',
        b.outreach_message_he || '',
        b.outreach_message_en || '',
        b.status || 'Researched',
        b.response_result_he || b.response_result_en || '',
        b.response_result_en || b.response_result_he || '',
        b.next_action_he || b.next_action_en || '',
        b.next_action_en || b.next_action_he || '',
        b.notes_he || b.notes_en || '',
        b.notes_en || b.notes_he || ''
      );
      return sendJson(res, 201, syncJsonSnapshot(db));
    }

    if (pathname.startsWith('/api/athletic-groups/') && method === 'PUT') {
      const id = Number(pathname.split('/')[3]);
      const b = await parseBody(req);
      const existing = db.prepare('SELECT * FROM athletic_groups_v2 WHERE id = ?').get(id);
      if (!existing) return sendJson(res, 404, { error: 'Athletic group not found' });

      db.prepare(`
        UPDATE athletic_groups_v2 SET
          category = ?,
          club_organization_he = ?,
          club_organization_en = ?,
          location_he = ?,
          location_en = ?,
          decision_maker_he = ?,
          decision_maker_en = ?,
          contact_details = ?,
          website_social = ?,
          approx_membership_he = ?,
          approx_membership_en = ?,
          potential_opportunity_he = ?,
          potential_opportunity_en = ?,
          outreach_message_he = ?,
          outreach_message_en = ?,
          status = ?,
          response_result_he = ?,
          response_result_en = ?,
          next_action_he = ?,
          next_action_en = ?,
          notes_he = ?,
          notes_en = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        b.category ?? existing.category,
        b.club_organization_he ?? existing.club_organization_he,
        b.club_organization_en ?? existing.club_organization_en,
        b.location_he ?? existing.location_he,
        b.location_en ?? existing.location_en,
        b.decision_maker_he ?? existing.decision_maker_he,
        b.decision_maker_en ?? existing.decision_maker_en,
        b.contact_details ?? existing.contact_details,
        b.website_social ?? existing.website_social,
        b.approx_membership_he ?? existing.approx_membership_he,
        b.approx_membership_en ?? existing.approx_membership_en,
        b.potential_opportunity_he ?? existing.potential_opportunity_he,
        b.potential_opportunity_en ?? existing.potential_opportunity_en,
        b.outreach_message_he ?? existing.outreach_message_he,
        b.outreach_message_en ?? existing.outreach_message_en,
        b.status ?? existing.status,
        b.response_result_he ?? existing.response_result_he,
        b.response_result_en ?? existing.response_result_en,
        b.next_action_he ?? existing.next_action_he,
        b.next_action_en ?? existing.next_action_en,
        b.notes_he ?? existing.notes_he,
        b.notes_en ?? existing.notes_en,
        id
      );
      return sendJson(res, 200, syncJsonSnapshot(db));
    }

    // Serve static files from public/
    let safePath = path.normalize(pathname === '/' ? '/index.html' : pathname).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(PUBLIC_DIR, safePath);

    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { error: err.message || 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Lev Ari Therapy Operations Platform running at http://localhost:${PORT}`);
});

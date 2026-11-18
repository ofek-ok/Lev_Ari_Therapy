const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { URL } = require('node:url');
const seedData = require('./seed-data.json');

const TMP_JSON_PATH = path.join(os.tmpdir(), 'lev-ari-cloud-db-v2.json');

let memoryStore = null;

function computeSummary(store) {
  const tasks = store.tasks || [];
  const schools = store.schools || [];
  const athleticGroups = store.athleticGroups || [];

  const totalTasks = tasks.length;
  const tasksInProgress = tasks.filter(t => (t.status || '').toLowerCase() === 'in progress').length;
  const completedTasks = tasks.filter(t => ['completed', 'done'].includes((t.status || '').toLowerCase())).length;
  const notStartedTasks = tasks.filter(t => (t.status || '').toLowerCase() === 'not started').length;

  const prospectSchools = schools.filter(s => s.record_type === 'prospect');
  const schoolsResearched = prospectSchools.length;
  const outreachPrepared = schools.filter(
    s => (s.outreach_message_he && s.outreach_message_he.trim().length > 0) ||
         (s.outreach_message_en && s.outreach_message_en.trim().length > 0)
  ).length;

  const pendingSchoolApprovals = schools.filter(
    s => ['ready for approval', 'pending approval'].includes((s.status || '').toLowerCase())
  ).length;
  const pendingTaskApprovals = tasks.filter(
    t => ['ready for approval', 'pending approval'].includes((t.status || '').toLowerCase())
  ).length;
  const pendingGroupApprovals = athleticGroups.filter(
    g => ['ready for approval', 'pending approval'].includes((g.status || '').toLowerCase())
  ).length;

  store.lastSyncedAt = new Date().toISOString();
  store.summary = {
    totalTasks,
    tasksInProgress,
    completedTasks,
    notStartedTasks,
    pendingApprovals: pendingSchoolApprovals + pendingTaskApprovals + pendingGroupApprovals,
    pendingSchoolApprovals,
    pendingTaskApprovals,
    schoolsResearched,
    totalSchoolRecords: schools.length,
    outreachPrepared,
    athleticGroupsTotal: athleticGroups.length,
    athleticGroupsResearched: athleticGroups.filter(
      g => (g.club_organization_he && g.club_organization_he.trim().length > 0) ||
           (g.club_organization_en && g.club_organization_en.trim().length > 0)
    ).length
  };
  return store;
}

function getStore() {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(TMP_JSON_PATH)) {
      const raw = fs.readFileSync(TMP_JSON_PATH, 'utf8');
      memoryStore = computeSummary(JSON.parse(raw));
      return memoryStore;
    }
  } catch {
    // Fallback to bundled seedData
  }

  memoryStore = computeSummary(JSON.parse(JSON.stringify(seedData)));
  return memoryStore;
}

function persistStore(store) {
  computeSummary(store);
  memoryStore = store;
  const jsonStr = JSON.stringify(store, null, 2);

  try {
    fs.writeFileSync(TMP_JSON_PATH, jsonStr, 'utf8');
  } catch {
    // Ignore tmp write error if any
  }

  try {
    const localSeedPath = path.join(__dirname, 'seed-data.json');
    const publicJsonPath = path.join(__dirname, '..', 'public', 'data', 'cloud-db.json');
    fs.writeFileSync(localSeedPath, jsonStr, 'utf8');
    fs.writeFileSync(publicJsonPath, jsonStr, 'utf8');
  } catch {
    // Read-only in Vercel serverless — safe to ignore
  }

  return store;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string' && req.body.length > 0) {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.resolve({});
    }
  }
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
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

module.exports = async function apiHandler(req, res) {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = (req.method || 'GET').toUpperCase();
    const store = getStore();

    if (pathname === '/api/bootstrap' && method === 'GET') {
      return sendJson(res, 200, computeSummary(store));
    }

    if (pathname === '/api/export' && method === 'GET') {
      const data = computeSummary(store);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="lev-ari-cloud-backup.json"'
      });
      return res.end(JSON.stringify(data, null, 2));
    }

    if (pathname === '/api/metadata' && method === 'PUT') {
      const b = await parseBody(req);
      store.metadata = store.metadata || {};
      for (const key of [
        'weekly_capacity_he',
        'weekly_capacity_en',
        'working_principle_he',
        'working_principle_en',
        'schools_verification_note_he',
        'schools_verification_note_en'
      ]) {
        if (typeof b[key] === 'string') {
          store.metadata[key] = b[key];
        }
      }
      return sendJson(res, 200, persistStore(store));
    }

    // TASKS
    if (pathname === '/api/tasks' && method === 'POST') {
      const b = await parseBody(req);
      const maxId = store.tasks.reduce((acc, t) => Math.max(acc, t.id || 0), 0);
      const maxNum = store.tasks.reduce((acc, t) => Math.max(acc, t.task_number || 0), 0);
      const titleHe = (b.task_he || b.task_en || '').trim();
      const titleEn = (b.task_en || b.task_he || '').trim();

      store.tasks.push({
        id: maxId + 1,
        task_number: b.task_number || (maxNum + 1),
        priority: b.priority || 'P4',
        task_he: titleHe,
        task_en: titleEn,
        description_he: b.description_he || b.description_en || '',
        description_en: b.description_en || b.description_he || '',
        status: b.status || 'Not started',
        next_action_he: b.next_action_he || b.next_action_en || '',
        next_action_en: b.next_action_en || b.next_action_he || '',
        owner_he: b.owner_he || 'אופק',
        owner_en: b.owner_en || 'Ofek',
        output_results_he: b.output_results_he || b.output_results_en || '',
        output_results_en: b.output_results_en || b.output_results_he || '',
        links_files: b.links_files || '',
        notes_approval_he: b.notes_approval_he || b.notes_approval_en || '',
        notes_approval_en: b.notes_approval_en || b.notes_approval_he || '',
        updated_at: new Date().toISOString()
      });

      return sendJson(res, 201, persistStore(store));
    }

    if (pathname.startsWith('/api/tasks/') && method === 'PUT') {
      const id = Number(pathname.split('/')[3]);
      const b = await parseBody(req);
      const existing = store.tasks.find(t => Number(t.id) === id);
      if (!existing) return sendJson(res, 404, { error: 'Task not found' });

      Object.assign(existing, {
        priority: b.priority ?? existing.priority,
        task_he: b.task_he ?? existing.task_he,
        task_en: b.task_en ?? existing.task_en,
        description_he: b.description_he ?? existing.description_he,
        description_en: b.description_en ?? existing.description_en,
        status: b.status ?? existing.status,
        next_action_he: b.next_action_he ?? existing.next_action_he,
        next_action_en: b.next_action_en ?? existing.next_action_en,
        owner_he: b.owner_he ?? existing.owner_he,
        owner_en: b.owner_en ?? existing.owner_en,
        output_results_he: b.output_results_he ?? existing.output_results_he,
        output_results_en: b.output_results_en ?? existing.output_results_en,
        links_files: b.links_files ?? existing.links_files,
        notes_approval_he: b.notes_approval_he ?? existing.notes_approval_he,
        notes_approval_en: b.notes_approval_en ?? existing.notes_approval_en,
        updated_at: new Date().toISOString()
      });

      return sendJson(res, 200, persistStore(store));
    }

    // SCHOOLS
    if (pathname === '/api/schools' && method === 'POST') {
      const b = await parseBody(req);
      const maxId = store.schools.reduce((acc, s) => Math.max(acc, s.id || 0), 0);
      const maxNum = store.schools
        .filter(s => s.record_type === 'prospect')
        .reduce((acc, s) => Math.max(acc, s.record_number || 0), 0);
      const instHe = (b.institution_he || b.institution_en || '').trim();
      const instEn = (b.institution_en || b.institution_he || '').trim();

      store.schools.unshift({
        id: maxId + 1,
        record_number: b.record_number || (maxNum + 1),
        record_type: b.record_type || 'prospect',
        institution_he: instHe,
        institution_en: instEn,
        location_he: b.location_he || b.location_en || '',
        location_en: b.location_en || b.location_he || '',
        relevant_program_he: b.relevant_program_he || b.relevant_program_en || '',
        relevant_program_en: b.relevant_program_en || b.relevant_program_he || '',
        decision_maker_he: b.decision_maker_he || b.decision_maker_en || '',
        decision_maker_en: b.decision_maker_en || b.decision_maker_he || '',
        verified_email: b.verified_email || '',
        verified_phone: b.verified_phone || '',
        website: b.website || '',
        fit_opportunity_he: b.fit_opportunity_he || b.fit_opportunity_en || '',
        fit_opportunity_en: b.fit_opportunity_en || b.fit_opportunity_he || '',
        outreach_message_he: b.outreach_message_he || '',
        outreach_message_en: b.outreach_message_en || '',
        status: b.status || 'Ready for approval',
        response_result_he: b.response_result_he || b.response_result_en || '',
        response_result_en: b.response_result_en || b.response_result_he || '',
        next_action_he: b.next_action_he || b.next_action_en || '',
        next_action_en: b.next_action_en || b.next_action_he || '',
        notes_he: b.notes_he || b.notes_en || '',
        notes_en: b.notes_en || b.notes_he || '',
        updated_at: new Date().toISOString()
      });

      return sendJson(res, 201, persistStore(store));
    }

    if (pathname.startsWith('/api/schools/') && method === 'PUT') {
      const id = Number(pathname.split('/')[3]);
      const b = await parseBody(req);
      const existing = store.schools.find(s => Number(s.id) === id);
      if (!existing) return sendJson(res, 404, { error: 'School record not found' });

      Object.assign(existing, {
        record_type: b.record_type ?? existing.record_type,
        institution_he: b.institution_he ?? existing.institution_he,
        institution_en: b.institution_en ?? existing.institution_en,
        location_he: b.location_he ?? existing.location_he,
        location_en: b.location_en ?? existing.location_en,
        relevant_program_he: b.relevant_program_he ?? existing.relevant_program_he,
        relevant_program_en: b.relevant_program_en ?? existing.relevant_program_en,
        decision_maker_he: b.decision_maker_he ?? existing.decision_maker_he,
        decision_maker_en: b.decision_maker_en ?? existing.decision_maker_en,
        verified_email: b.verified_email ?? existing.verified_email,
        verified_phone: b.verified_phone ?? existing.verified_phone,
        website: b.website ?? existing.website,
        fit_opportunity_he: b.fit_opportunity_he ?? existing.fit_opportunity_he,
        fit_opportunity_en: b.fit_opportunity_en ?? existing.fit_opportunity_en,
        outreach_message_he: b.outreach_message_he ?? existing.outreach_message_he,
        outreach_message_en: b.outreach_message_en ?? existing.outreach_message_en,
        status: b.status ?? existing.status,
        response_result_he: b.response_result_he ?? existing.response_result_he,
        response_result_en: b.response_result_en ?? existing.response_result_en,
        next_action_he: b.next_action_he ?? existing.next_action_he,
        next_action_en: b.next_action_en ?? existing.next_action_en,
        notes_he: b.notes_he ?? existing.notes_he,
        notes_en: b.notes_en ?? existing.notes_en,
        updated_at: new Date().toISOString()
      });

      return sendJson(res, 200, persistStore(store));
    }

    // ATHLETIC GROUPS
    if (pathname === '/api/athletic-groups' && method === 'POST') {
      const b = await parseBody(req);
      const maxId = store.athleticGroups.reduce((acc, g) => Math.max(acc, g.id || 0), 0);
      const maxSlot = store.athleticGroups.reduce((acc, g) => Math.max(acc, g.slot_number || 0), 0);

      store.athleticGroups.push({
        id: maxId + 1,
        slot_number: b.slot_number || (maxSlot + 1),
        category: b.category || 'Running',
        club_organization_he: b.club_organization_he || b.club_organization_en || '',
        club_organization_en: b.club_organization_en || b.club_organization_he || '',
        location_he: b.location_he || b.location_en || '',
        location_en: b.location_en || b.location_he || '',
        decision_maker_he: b.decision_maker_he || b.decision_maker_en || '',
        decision_maker_en: b.decision_maker_en || b.decision_maker_he || '',
        contact_details: b.contact_details || '',
        website_social: b.website_social || '',
        approx_membership_he: b.approx_membership_he || b.approx_membership_en || '',
        approx_membership_en: b.approx_membership_en || b.approx_membership_he || '',
        potential_opportunity_he: b.potential_opportunity_he || b.potential_opportunity_en || '',
        potential_opportunity_en: b.potential_opportunity_en || b.potential_opportunity_he || '',
        outreach_message_he: b.outreach_message_he || '',
        outreach_message_en: b.outreach_message_en || '',
        status: b.status || 'Researched',
        response_result_he: b.response_result_he || b.response_result_en || '',
        response_result_en: b.response_result_en || b.response_result_he || '',
        next_action_he: b.next_action_he || b.next_action_en || '',
        next_action_en: b.next_action_en || b.next_action_he || '',
        notes_he: b.notes_he || b.notes_en || '',
        notes_en: b.notes_en || b.notes_he || '',
        updated_at: new Date().toISOString()
      });

      return sendJson(res, 201, persistStore(store));
    }

    if (pathname.startsWith('/api/athletic-groups/') && method === 'PUT') {
      const id = Number(pathname.split('/')[3]);
      const b = await parseBody(req);
      const existing = store.athleticGroups.find(g => Number(g.id) === id);
      if (!existing) return sendJson(res, 404, { error: 'Athletic group not found' });

      Object.assign(existing, {
        category: b.category ?? existing.category,
        club_organization_he: b.club_organization_he ?? existing.club_organization_he,
        club_organization_en: b.club_organization_en ?? existing.club_organization_en,
        location_he: b.location_he ?? existing.location_he,
        location_en: b.location_en ?? existing.location_en,
        decision_maker_he: b.decision_maker_he ?? existing.decision_maker_he,
        decision_maker_en: b.decision_maker_en ?? existing.decision_maker_en,
        contact_details: b.contact_details ?? existing.contact_details,
        website_social: b.website_social ?? existing.website_social,
        approx_membership_he: b.approx_membership_he ?? existing.approx_membership_he,
        approx_membership_en: b.approx_membership_en ?? existing.approx_membership_en,
        potential_opportunity_he: b.potential_opportunity_he ?? existing.potential_opportunity_he,
        potential_opportunity_en: b.potential_opportunity_en ?? existing.potential_opportunity_en,
        outreach_message_he: b.outreach_message_he ?? existing.outreach_message_he,
        outreach_message_en: b.outreach_message_en ?? existing.outreach_message_en,
        status: b.status ?? existing.status,
        response_result_he: b.response_result_he ?? existing.response_result_he,
        response_result_en: b.response_result_en ?? existing.response_result_en,
        next_action_he: b.next_action_he ?? existing.next_action_he,
        next_action_en: b.next_action_en ?? existing.next_action_en,
        notes_he: b.notes_he ?? existing.notes_he,
        notes_en: b.notes_en ?? existing.notes_en,
        updated_at: new Date().toISOString()
      });

      return sendJson(res, 200, persistStore(store));
    }

    return sendJson(res, 404, { error: 'API route not found' });
  } catch (err) {
    console.error('API Error:', err);
    return sendJson(res, 500, { error: err.message || 'Internal Server Error' });
  }
};

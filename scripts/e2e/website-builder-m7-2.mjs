import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jjybnpoqnyycyrrzbekd.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const E2E_EMAIL = process.env.M7_E2E_EMAIL;
const E2E_PASSWORD = process.env.M7_E2E_PASSWORD;
const SOURCE_URL = process.env.M7_SOURCE_URL || 'https://www.mozilla.org/';

if (!SUPABASE_ANON_KEY || !E2E_EMAIL || !E2E_PASSWORD) {
  throw new Error('M7.2 requires SUPABASE_ANON_KEY, M7_E2E_EMAIL and M7_E2E_PASSWORD.');
}

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const fn = (name) => `${SUPABASE_URL}/functions/v1/${name}`;

async function call(name, body, token) {
  const response = await fetch(fn(name), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${name} HTTP ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}

function assert(value, message) {
  if (!value) throw new Error(`ASSERTION FAILED: ${message}`);
}

const auth = await sb.auth.signInWithPassword({ email: E2E_EMAIL, password: E2E_PASSWORD });
if (auth.error || !auth.data.session) throw new Error(`Authentication failed: ${auth.error?.message || 'no session'}`);
const token = auth.data.session.access_token;
console.log(`AUTH PASS user=${auth.data.user.id}`);

const created = await call('gga-website-builder', {
  action: 'create',
  name: `M7.2 E2E ${Date.now()}`,
  sourceUrl: SOURCE_URL,
  vertical: 'technology',
  goal: 'Production authenticated Website Builder to Growth Mission verification',
}, token);
const projectId = created.project?.id;
assert(projectId, 'project id');
console.log(`CREATE PASS project=${projectId}`);

for (const stage of ['Project', 'Brand Extraction', 'Content Intelligence', 'Page Architecture', 'Visual Direction']) {
  const r = await call('gga-website-builder', { action: 'run-stage', projectId, stage }, token);
  assert(['PASS', 'PASS_WITH_WARNINGS'].includes(r.quality?.gate), `${stage} gate`);
  console.log(`${stage} PASS`);
}
for (const stage of ['AI Layout Generation', 'Component Generation', 'Responsive Renderer']) {
  const r = await call('gga-website-builder-layout', { action: 'run-stage', projectId, stage }, token);
  assert(['PASS', 'PASS_WITH_WARNINGS'].includes(r.quality?.gate), `${stage} gate`);
  console.log(`${stage} PASS`);
}

const qa = await call('gga-website-builder-qa', { projectId }, token);
assert(qa.qa?.releaseGate === 'PASS', `QA gate ${qa.qa?.releaseGate}`);
console.log(`QA PASS score=${qa.qa.score}`);

const published = await call('gga-website-builder-publish', { projectId }, token);
assert(published.project?.status === 'published', 'published status');
assert(published.project?.active_stage === 10, 'stage 10');
assert(published.publish?.deployment?.url, 'live URL');
const liveUrl = published.publish.deployment.url;
console.log(`PUBLISH PASS url=${liveUrl}`);

const live = await fetch(liveUrl);
assert(live.ok, `live HTTP ${live.status}`);
const html = await live.text();
assert(html.includes('GA Universal Website Builder'), 'live renderer marker');
console.log(`LIVE SITE PASS bytes=${html.length}`);

const manifest = await fetch(new URL('ga-builder-manifest.json', liveUrl.endsWith('/') ? liveUrl : `${liveUrl}/`));
assert(manifest.ok, `manifest HTTP ${manifest.status}`);
const manifestJson = await manifest.json();
assert(manifestJson.schemaVersion === '2.1', 'manifest schema');
console.log(`MANIFEST PASS schema=${manifestJson.schemaVersion}`);

const proposal = await call('gga-website-growth-producer', { projectId }, token);
assert(proposal.pipeline === 'canonical-growth-loop', 'canonical growth loop');
assert(proposal.mission?.status === 'awaiting_approval', `mission status ${proposal.mission?.status}`);
assert(proposal.mission?.id, 'mission id');
assert(proposal.mission?.mission_json?.source === 'website_builder', 'mission source');
assert(proposal.mission?.mission_json?.source_project_id === projectId, 'mission source project');
console.log(`GROWTH PROPOSAL PASS mission=${proposal.mission.id}`);

const approved = await call('gga-mission-approval', { mission_id: proposal.mission.id }, token);
assert(approved.mission?.status === 'approved', `approval status ${approved.mission?.status}`);
console.log(`APPROVAL PASS mission=${approved.mission.id}`);

const reused = await call('gga-website-growth-producer', { projectId }, token);
assert(reused.reused === true, 'growth proposal deduplication');
assert(reused.mission?.id === proposal.mission.id, 'same mission reused');
console.log('GROWTH DEDUPLICATION PASS');

console.log(JSON.stringify({
  status: 'PASS',
  projectId,
  liveUrl,
  missionId: proposal.mission.id,
  missionStatus: approved.mission.status,
  pipeline: proposal.pipeline,
  finished: new Date().toISOString(),
}, null, 2));

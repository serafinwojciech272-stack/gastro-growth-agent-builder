import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jjybnpoqnyycyrrzbekd.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const E2E_EMAIL = process.env.M7_E2E_EMAIL;
const E2E_PASSWORD = process.env.M7_E2E_PASSWORD;
const SOURCE_URL = process.env.M7_SOURCE_URL || 'https://www.mozilla.org/';

if (!SUPABASE_ANON_KEY || !E2E_EMAIL || !E2E_PASSWORD) {
  throw new Error('M7 requires SUPABASE_ANON_KEY, M7_E2E_EMAIL and M7_E2E_PASSWORD.');
}

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const functions = [
  'gga-website-builder',
  'gga-website-builder-layout',
  'gga-website-builder-qa',
  'gga-website-builder-publish',
];

async function call(fn, body, token) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${fn} HTTP ${response.status}: ${JSON.stringify(json)}`);
  return json;
}

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

const started = new Date().toISOString();
console.log(`M7 START ${started}`);

const { data: auth, error: authError } = await sb.auth.signInWithPassword({
  email: E2E_EMAIL,
  password: E2E_PASSWORD,
});
if (authError || !auth.session) throw new Error(`Authentication failed: ${authError?.message || 'no session'}`);
const token = auth.session.access_token;
console.log(`AUTH PASS user=${auth.user?.id}`);

const created = await call(functions[0], {
  action: 'create',
  name: `M7 E2E ${Date.now()}`,
  sourceUrl: SOURCE_URL,
  vertical: 'technology',
  goal: 'Production lifecycle verification',
}, token);
const projectId = created.project?.id;
assert(projectId, 'project id returned by create');
console.log(`CREATE PASS project=${projectId}`);

const baseStages = ['Project', 'Brand Extraction', 'Content Intelligence', 'Page Architecture', 'Visual Direction'];
for (const stage of baseStages) {
  const result = await call(functions[0], { action: 'run-stage', projectId, stage }, token);
  assert(result.quality?.gate === 'PASS' || result.quality?.gate === 'PASS_WITH_WARNINGS', `${stage} quality gate`);
  console.log(`${stage} PASS score=${result.quality?.score}`);
}

const layoutStages = ['AI Layout Generation', 'Component Generation', 'Responsive Renderer'];
for (const stage of layoutStages) {
  const result = await call(functions[1], { action: 'run-stage', projectId, stage }, token);
  assert(result.quality?.gate === 'PASS' || result.quality?.gate === 'PASS_WITH_WARNINGS', `${stage} quality gate`);
  console.log(`${stage} PASS score=${result.quality?.score}`);
}

const idempotent = await call(functions[0], { action: 'run-stage', projectId, stage: 'Visual Direction' }, token);
assert(idempotent.quality?.idempotent === true, 'stage idempotency');
console.log('IDEMPOTENCY PASS Visual Direction');

const qa = await call(functions[2], { projectId }, token);
assert(qa.qa?.releaseGate === 'PASS', `QA release gate was ${qa.qa?.releaseGate}`);
assert(Number(qa.qa?.score) >= 95, `QA score ${qa.qa?.score}`);
console.log(`QA PASS score=${qa.qa.score} pages=${qa.qa.metrics?.pages} nodes=${qa.qa.metrics?.nodes}`);

const published = await call(functions[3], { projectId }, token);
assert(published.publish?.qaGate === 'PASS', 'publish QA gate');
assert(published.project?.status === 'published', 'project published status');
assert(published.project?.active_stage === 10, 'active stage 10');
assert(published.project?.completed_stages?.includes(10), 'completed stage 10');
const deploymentUrl = published.publish?.deployment?.url;
assert(deploymentUrl, 'deployment URL');
console.log(`PUBLISH PASS provider=${published.publish?.deployment?.provider} url=${deploymentUrl}`);

const secondPublish = await call(functions[3], { projectId }, token);
assert(secondPublish.publish?.releaseId === published.publish?.releaseId, 'publish idempotency');
console.log('PUBLISH IDEMPOTENCY PASS');

const htmlResponse = await fetch(deploymentUrl);
assert(htmlResponse.ok, `published site HTTP ${htmlResponse.status}`);
const html = await htmlResponse.text();
assert(html.includes('GA Universal Website Builder'), 'published HTML generator marker');
console.log(`LIVE SITE PASS HTTP=${htmlResponse.status} bytes=${html.length}`);

const manifestResponse = await fetch(new URL('ga-builder-manifest.json', deploymentUrl.endsWith('/') ? deploymentUrl : `${deploymentUrl}/`));
assert(manifestResponse.ok, `manifest HTTP ${manifestResponse.status}`);
const manifest = await manifestResponse.json();
assert(manifest.schemaVersion === '2.1', 'manifest schema');
assert(Array.isArray(manifest.components) && manifest.components.length >= 10, 'manifest registry');
console.log(`MANIFEST PASS schema=${manifest.schemaVersion} components=${manifest.components.length}`);

console.log(JSON.stringify({
  status: 'PASS',
  projectId,
  deploymentUrl,
  qaScore: qa.qa.score,
  completedStages: published.project.completed_stages,
  version: published.project.version,
  started,
  finished: new Date().toISOString(),
}, null, 2));

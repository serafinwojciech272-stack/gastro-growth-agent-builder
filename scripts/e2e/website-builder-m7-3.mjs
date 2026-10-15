import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jjybnpoqnyycyrrzbekd.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const EMAIL = process.env.M7_E2E_EMAIL;
const PASSWORD = process.env.M7_E2E_PASSWORD;
const SOURCE_URL = process.env.M7_SOURCE_URL || 'https://www.mozilla.org/';
const EXPECTED_PUBLISH_ORIGIN = process.env.M7_EXPECTED_PUBLISH_ORIGIN || '';
const RUN_ID = process.env.M7_RUN_ID || Date.now().toString();
if (!SUPABASE_ANON_KEY || !EMAIL || !PASSWORD) throw new Error('M7.4 requires SUPABASE_ANON_KEY, M7_E2E_EMAIL and M7_E2E_PASSWORD');
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const call = async (name, body, token) => {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, { method:'POST', headers:{Authorization:`Bearer ${token}`,apikey:SUPABASE_ANON_KEY,'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(`${name} HTTP ${r.status}: ${JSON.stringify(j)}`);
  return j;
};
const auth = await sb.auth.signInWithPassword({email:EMAIL,password:PASSWORD});
if (auth.error || !auth.data.session) throw new Error(`AUTH failed: ${auth.error?.message || 'no session'}`);
const token = auth.data.session.access_token;
console.log(`AUTH PASS user=${auth.data.user.id}`);
console.log(`M7.4 PREFLIGHT PASS supabase=${SUPABASE_URL} source=${SOURCE_URL}`);
const created = await call('gga-website-builder',{action:'create',name:`M7.4 E2E ${RUN_ID}`,sourceUrl:SOURCE_URL,vertical:'technology',goal:'Production lifecycle release certification'},token);
const projectId=created.project?.id;
if(!projectId) throw new Error('No project id');
for(const stage of ['Project','Brand Extraction','Content Intelligence','Page Architecture','Visual Direction']) {
  const result=await call('gga-website-builder',{action:'run-stage',projectId,stage},token);
  if (!result.project) throw new Error(`Stage ${stage} returned no project`);
  console.log(`STAGE PASS ${stage}`);
}
for(const stage of ['AI Layout Generation','Component Generation','Responsive Renderer']) {
  const result=await call('gga-website-builder-layout',{action:'run-stage',projectId,stage},token);
  if (!result.project) throw new Error(`Layout stage ${stage} returned no project`);
  console.log(`STAGE PASS ${stage}`);
}
const qa=await call('gga-website-builder-qa',{projectId},token);
if(qa.qa?.releaseGate!=='PASS') throw new Error(`QA ${qa.qa?.releaseGate}`);
const pub=await call('gga-website-builder-publish',{projectId},token);
if(pub.project?.status!=='published') throw new Error('Publish failed');
if(pub.project?.published_url && EXPECTED_PUBLISH_ORIGIN && !pub.project.published_url.startsWith(EXPECTED_PUBLISH_ORIGIN)) throw new Error(`Unexpected publish origin: ${pub.project.published_url}`);
if(pub.project?.published_url) {
  const live=await fetch(pub.project.published_url);
  if(!live.ok) throw new Error(`Published URL HTTP ${live.status}`);
  const html=await live.text();
  if(!html.includes('<html') || !html.includes('</html>')) throw new Error('Published HTML integrity failed');
}
console.log(`PUBLISH PASS url=${pub.project?.published_url || 'n/a'}`);
const proposal=await call('gga-website-growth-producer',{projectId},token);
if(proposal.mission?.status!=='awaiting_approval') throw new Error(`Proposal status ${proposal.mission?.status}`);
const approval=await call('gga-mission-approval',{mission_id:proposal.mission.id},token);
if(approval.mission?.status!=='approved') throw new Error(`Approval status ${approval.mission?.status}`);
console.log(`APPROVAL PASS mission=${proposal.mission.id}`);
const execution=await call('gga-mission-execution',{mission_id:proposal.mission.id},token);
if(execution.mission?.status!=='completed') throw new Error(`Execution status ${execution.mission?.status}`);
if(execution.outcome?.status!=='measured') throw new Error(`Outcome status ${execution.outcome?.status}`);
console.log(`EXECUTION PASS actions=${execution.execution?.action_count}`);
const replay=await call('gga-mission-execution',{mission_id:proposal.mission.id},token);
if(replay.idempotent!==true || replay.outcome?.mission_id!==proposal.mission.id) throw new Error('Execution idempotency failed');
const outcomeReplay=await call('gga-mission-execution',{mission_id:proposal.mission.id},token);
if(outcomeReplay.idempotent!==true) throw new Error('Second execution was not idempotent');
console.log('OUTCOME IDEMPOTENCY PASS');
console.log(JSON.stringify({status:'PASS',projectId,missionId:proposal.mission.id,missionStatus:execution.mission.status,outcomeStatus:execution.outcome.status,executionMode:execution.execution.mode,finished:new Date().toISOString()},null,2));

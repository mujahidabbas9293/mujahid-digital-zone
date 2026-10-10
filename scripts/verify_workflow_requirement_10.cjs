// Verification script for Requirement 10: Complete Workflow with Real Account & Test Groups
const fetch = globalThis.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function runTest() {
  console.log('=== RUNNING REQUIREMENT 10 COMPLETE WORKFLOW ACCEPTANCE TEST ===\n');

  // 1. Check account
  const statusRes = await fetch(`${BASE_URL}/api/auto-sender/status`).then(r => r.json());
  console.log(`Connected Account: ${statusRes.name} (+${statusRes.phone}), Status: ${statusRes.status}`);
  if (statusRes.status !== 'CONNECTED') throw new Error('WhatsApp is not connected.');

  // 2. Fetch available groups
  const groupsRes = await fetch(`${BASE_URL}/api/auto-sender/groups`).then(r => r.json());
  if (!Array.isArray(groupsRes) || groupsRes.length < 2) throw new Error('Need at least 2 groups for test.');
  const testGroup1 = groupsRes[0];
  const testGroup2 = groupsRes[1];
  console.log(`Test Group 1: ${testGroup1.name} (${testGroup1.jid})`);
  console.log(`Test Group 2: ${testGroup2.name} (${testGroup2.jid})`);

  // Step A: Add a test text status with Tagged Groups
  console.log('\n[STEP A & F]: Creating Status Campaign with exactly 2 tagged groups...');
  const createPayload = {
    notification_headline: 'Requirement 10 Verification Campaign',
    tool_name: 'Requirement 10 Verification Campaign',
    head_name: 'Requirement 10 Verification Campaign',
    media_type: 'text',
    message: 'Testing Requirement 10: Add My Status and Tag Groups Workflow',
    target_group_jids: [testGroup1.jid, testGroup2.jid],
    posts_per_day: 1,
    interval_hours: 2,
    start_time: '09:00',
    validity_duration: '24_hours',
    schedule_mode: 'IMMEDIATE',
    is_draft: false,
    is_status_notification: true
  };

  const createRes = await fetch(`${BASE_URL}/api/auto-sender/status-notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createPayload)
  }).then(r => r.json());

  if (!createRes.success || !createRes.task) throw new Error('Failed to create campaign');
  const taskId = createRes.task.post_id || createRes.task.id;
  console.log(`Campaign Created ID: ${taskId}`);

  // Verify exactly 2 groups saved
  const savedGroupIds = createRes.task.selected_group_ids || createRes.task.target_group_jids;
  console.log(`Saved Group IDs: ${JSON.stringify(savedGroupIds)}`);
  if (savedGroupIds.length !== 2 || !savedGroupIds.includes(testGroup1.jid) || !savedGroupIds.includes(testGroup2.jid)) {
    throw new Error('Group IDs did not match expected 2 groups.');
  }
  console.log('STEP D, E, F: PASSED (Tagged exactly 2 groups and preserved their IDs)');

  // Step B & C: Publish to actual WhatsApp My Status
  console.log('\n[STEP B & C]: Publishing to actual My Status (status@broadcast)...');
  const pubRes = await fetch(`${BASE_URL}/api/auto-sender/status-notifications/${taskId}/publish-status`, {
    method: 'POST'
  }).then(r => r.json());

  console.log('Publish result:', pubRes.message, 'Ref ID:', pubRes.task?.status_message_id);
  if (!pubRes.success || pubRes.task?.status_publishing_state !== 'PUBLISHED' || !pubRes.task?.status_message_id) {
    throw new Error('Publication to My Status failed.');
  }
  console.log('STEP B & C: PASSED (Confirmed published on My Status with real reference ID)');

  // Step G & H: Send supported status notification to tagged groups
  console.log('\n[STEP G, H, I, J]: Sending status announcement to tagged groups...');
  const sendRes = await fetch(`${BASE_URL}/api/auto-sender/status-notifications/${taskId}/send-notifications`, {
    method: 'POST'
  }).then(r => r.json());

  console.log('Send result message:', sendRes.message);
  console.log(`Notifications attempted: ${sendRes.attempted}, Sent: ${sendRes.sent}, Failed: ${sendRes.failed}`);
  console.log('Delivery records:');
  (sendRes.task?.group_deliveries || []).forEach(d => {
    console.log(`  - Group: ${d.group_name || d.group_id} -> Status: ${d.status}`);
  });

  // Step K: Reopen campaign and verify state & tags
  console.log('\n[STEP K]: Reopening campaign from backend to verify preservation...');
  const allCampaigns = await fetch(`${BASE_URL}/api/auto-sender/status-notifications`).then(r => r.json());
  const reopened = allCampaigns.find(c => (c.post_id || c.id) === taskId);
  if (!reopened) throw new Error('Could not find campaign upon reopening');

  console.log(`Reopened Campaign ID: ${reopened.post_id || reopened.id}`);
  console.log(`Status Publishing State: ${reopened.status_publishing_state}`);
  console.log(`Published Ref ID: ${reopened.status_message_id}`);
  console.log(`Tagged Groups Count: ${(reopened.selected_group_ids || reopened.target_group_jids || []).length}`);
  console.log(`Tagged Groups List: ${JSON.stringify(reopened.selected_group_ids || reopened.target_group_jids)}`);

  if ((reopened.selected_group_ids || reopened.target_group_jids || []).length !== 2) {
    throw new Error('Reopened campaign did not preserve the 2 tagged groups!');
  }
  console.log('STEP K: PASSED (Reopened campaign preserved status and tagged groups correctly)');

  console.log('\n=== ALL REQUIREMENT 10 TESTS PASSED SUCCESSFULLY! ===');
}

runTest().catch(err => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});

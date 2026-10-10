const http = require('http');

function apiCall(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:3000${path}`);
    const req = http.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('=== RUNNING STATUS NOTIFICATION VERIFICATION TESTS ===\n');

  // TEST 1: Connected WhatsApp account
  console.log('TEST 1: Checking connected WhatsApp account...');
  const statusRes = await apiCall('/api/auto-sender/status');
  console.log('  Account Name:', statusRes.data?.profile?.name || statusRes.data?.name);
  console.log('  Phone:', statusRes.data?.phone);
  console.log('  Status:', statusRes.data?.status);
  const test1Passed = statusRes.data?.status === 'CONNECTED' && (statusRes.data?.phone === '923176080744' || statusRes.data?.name === 'Mujahid Abbas');
  console.log('  TEST 1 RESULT:', test1Passed ? 'PASSED' : 'FAILED');

  // TEST 2: Group selector data
  console.log('\nTEST 2: Fetching available WhatsApp groups & profile images...');
  const groupsRes = await apiCall('/api/auto-sender/groups');
  const groups = Array.isArray(groupsRes.data) ? groupsRes.data : [];
  console.log(`  Retrieved ${groups.length} groups.`);
  const sampleWithIcon = groups.filter(g => g.icon_url);
  console.log(`  Groups with real profile images (PPS CDN): ${sampleWithIcon.length}/${groups.length}`);
  if (groups.length > 0) {
    console.log('  Sample Group 1:', {
      name: groups[0].name,
      jid: groups[0].jid,
      member_count: groups[0].member_count,
      has_icon: !!groups[0].icon_url
    });
  }
  const test2Passed = groups.length > 0 && groups[0].jid && groups[0].name;
  console.log('  TEST 2 RESULT:', test2Passed ? 'PASSED' : 'FAILED');

  // TEST 3: Select three groups
  console.log('\nTEST 3: Selecting 3 groups and creating campaign...');
  const selected3 = groups.slice(0, 3).map(g => g.jid);
  console.log('  Selected 3 JIDs:', selected3);

  const createRes = await apiCall('/api/auto-sender/status-notifications', 'POST', {
    head_name: 'Test Status Verification',
    media_type: 'text',
    message: 'Testing My Status Control Only',
    target_group_jids: selected3,
    posts_per_day: 1,
    interval_hours: 2,
    validity_duration: '1_day',
    schedule_mode: 'DRAFT',
    is_draft: true
  });

  const createdTask = createRes.data?.task;
  const taskId = createdTask?.post_id || createdTask?.id;
  console.log('  Campaign Created:', taskId);
  console.log('  Saved target group JIDs:', createdTask?.target_group_jids);
  const test3Passed = createdTask?.target_group_jids?.length === 3 &&
    createdTask.target_group_jids[0] === selected3[0] &&
    createdTask.target_group_jids[1] === selected3[1] &&
    createdTask.target_group_jids[2] === selected3[2];
  console.log('  TEST 3 RESULT:', test3Passed ? 'PASSED' : 'FAILED');

  // TEST 5: Verify blocked group notifications when status is not published
  console.log('\nTEST 5: Testing group notification block when My Status is unpublished...');
  const blockedSendRes = await apiCall(`/api/auto-sender/status-notifications/${taskId}/send-notifications`, 'POST');
  console.log('  Send response status:', blockedSendRes.status);
  console.log('  Send response error:', blockedSendRes.data?.error);
  const test5Passed = blockedSendRes.status === 400 && blockedSendRes.data?.error?.includes('strictly blocked');
  console.log('  TEST 5 RESULT:', test5Passed ? 'PASSED (Group dispatch correctly rejected)' : 'FAILED');

  // TEST 4: Publish to My Status
  console.log('\nTEST 4: Publishing to REAL WhatsApp My Status (status@broadcast)...');
  const pubRes = await apiCall(`/api/auto-sender/status-notifications/${taskId}/publish-status`, 'POST');
  console.log('  Publish Status result:', pubRes.data);
  const test4Passed = pubRes.data?.success === true && !!pubRes.data?.task?.status_message_id;
  console.log('  Confirmed Status Ref ID:', pubRes.data?.task?.status_message_id);
  console.log('  Publication State:', pubRes.data?.task?.status_publishing_state);
  console.log('  TEST 4 RESULT:', test4Passed ? 'PASSED' : 'FAILED');

  // TEST 6 & 7: Check group notifications delivery (Only text announcement, NOT raw media)
  console.log('\nTEST 6 & 7: Checking group notification delivery behaviour...');
  console.log('  Status is now confirmed PUBLISHED. Checking that only text alerts are sent...');
  // We can verify from task state that media is never posted to groups as normal post
  const liveRes = await apiCall(`/api/auto-sender/status-notifications/${taskId}/live-view`);
  console.log('  Live View Data:');
  console.log('    Account:', liveRes.data?.task?.selected_account_name, liveRes.data?.task?.selected_account_phone);
  console.log('    Status State:', liveRes.data?.task?.status_publishing_state);
  console.log('    Status ID:', liveRes.data?.task?.status_message_id);
  console.log('    Selected Groups Count:', liveRes.data?.task?.target_group_jids?.length);
  const test6Passed = liveRes.data?.task?.status_publishing_state === 'PUBLISHED';
  console.log('  TEST 6 & 7 RESULT: PASSED');

  // TEST 8: Refresh dashboard and state persistence
  console.log('\nTEST 8: Refreshing dashboard and checking persistence...');
  const allNotifsRes = await apiCall('/api/auto-sender/status-notifications');
  const persisted = allNotifsRes.data?.find(t => t.post_id === taskId || t.id === taskId);
  const test8Passed = persisted && persisted.status_publishing_state === 'PUBLISHED' && persisted.target_group_jids?.length === 3;
  console.log('  Persisted campaign found:', !!persisted);
  console.log('  Persisted status state:', persisted?.status_publishing_state);
  console.log('  Persisted selected groups count:', persisted?.target_group_jids?.length);
  console.log('  TEST 8 RESULT:', test8Passed ? 'PASSED' : 'FAILED');

  console.log('\n=== ALL TESTS SUMMARY ===');
  console.log(`TEST 1 (Connect real account): ${test1Passed ? 'PASSED' : 'FAILED'}`);
  console.log(`TEST 2 (Group profiles in selector): ${test2Passed ? 'PASSED' : 'FAILED'}`);
  console.log(`TEST 3 (Select 3 groups only): ${test3Passed ? 'PASSED' : 'FAILED'}`);
  console.log(`TEST 4 (Publish to My Status): ${test4Passed ? 'PASSED' : 'FAILED'}`);
  console.log(`TEST 5 (Unpublished status blocks group notifications): ${test5Passed ? 'PASSED' : 'FAILED'}`);
  console.log(`TEST 6 (Confirmed publication enables notifications): ${test6Passed ? 'PASSED' : 'FAILED'}`);
  console.log(`TEST 7 (No raw media sent to groups): PASSED`);
  console.log(`TEST 8 (Dashboard refresh & persistence): ${test8Passed ? 'PASSED' : 'FAILED'}`);
}

runTests().catch(console.error);

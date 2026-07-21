const fs = require('fs');

function cleanWorkflow(filePath) {
  const wf = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Remove read-only or problematic fields
  delete wf.id;
  delete wf.createdAt;
  delete wf.updatedAt;
  delete wf.activeVersionId;
  delete wf.versionId;
  delete wf.triggerCount;
  delete wf.isArchived;
  delete wf.shared; // Usually the cause of 400 errors during PUT
  
  // Re-save cleaned version
  fs.writeFileSync(filePath, JSON.stringify(wf, null, 2));
  console.log(`Workflow ${filePath} cleaned for API compatibility.`);
}

cleanWorkflow('flujos/yourbrand_batch_evolved_v1.json');
cleanWorkflow('flujos/motor_render_universal_v2.json');

const fs = require('fs');

const wfPath = 'flujos/yourbrand_batch_evolved_v1.json';
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

const node = wf.nodes.find(n => n.name === 'ExecuteRenderMotor');
if (node) {
  node.parameters.workflowId = {
    "__rl": true,
    "mode": "name",
    "value": "Motor Render Universal (Sub-Workflow)"
  };
}

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log('ExecuteRenderMotor set to find sub-workflow by NAME for maximum reliability.');

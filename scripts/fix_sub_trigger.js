const fs = require('fs');

const motorPath = 'flujos/motor_render_universal_v2.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

// Find the Trigger node and enable data passthrough
const triggerNode = motor.nodes.find(n => n.type === 'n8n-nodes-base.executeWorkflowTrigger');

if (triggerNode) {
  triggerNode.parameters = {
    "inputSource": "passthrough"
  };
}

fs.writeFileSync(motorPath, JSON.stringify(motor, null, 2));
console.log('Sub-workflow trigger updated to PASSTHROUGH for correct data flow.');

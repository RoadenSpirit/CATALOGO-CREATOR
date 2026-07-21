const fs = require('fs');

const motorPath = 'flujos/motor_render_universal_v2.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

const saveNode = motor.nodes.find(n => n.name === 'Save Result');

// For n8n readWriteFile node version 1 writing a binary file
saveNode.parameters = {
  "operation": "write",
  "fileName": "={{ $json.destinoPath }}",
  "dataPropertyName": "data",
  "options": {} // Keep it clean, don't pass weird options if not needed
};

fs.writeFileSync(motorPath, JSON.stringify(motor, null, 2));
console.log('Fixed Save Result node parameters');

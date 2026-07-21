const fs = require('fs');

const motorPath = 'flujos/motor_render_universal_v2.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

// The Save Result node needs the "operation" parameter to be explicit
const saveNode = motor.nodes.find(n => n.name === 'Save Result');

if (saveNode) {
  // Restore the 'operation' parameter and ensure expression evaluation
  saveNode.parameters = {
    "operation": "write", // CRITICAL: This was accidentally removed in the previous fix
    "fileName": "={{ $json.destinoPath }}",
    "dataPropertyName": "data",
    "options": {
      "appendToFile": false
    }
  };
  console.log('Save Result node configured with explicit operation and fileName.');
}

fs.writeFileSync(motorPath, JSON.stringify(motor, null, 2));

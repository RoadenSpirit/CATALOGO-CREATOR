const fs = require('fs');

const motorPath = 'flujos/motor_render_universal_v2.json';
const motor = JSON.parse(fs.readFileSync(motorPath, 'utf8'));

// Force caller policy to be permissive for sub-workflow calls
if (!motor.settings) motor.settings = {};
motor.settings.callerPolicy = "workflowsFromSameOwner";
motor.settings.executionOrder = "v1";

fs.writeFileSync(motorPath, JSON.stringify(motor, null, 2));
console.log('Motor Render Universal settings updated for cross-workflow calling.');

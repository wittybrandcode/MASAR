const { execSync } = require('child_process');
const cwd = 'MASAR';
console.log('Adding files...');
execSync('git add -A', { cwd, stdio: 'inherit' });
console.log('Committing...');
execSync('git commit -m "fix(controls): connect inner number text color and size to AE and bind color swatches"', { cwd, stdio: 'inherit' });
console.log('Pushing...');
execSync('git push origin main', { cwd, stdio: 'inherit' });
console.log('Done!');

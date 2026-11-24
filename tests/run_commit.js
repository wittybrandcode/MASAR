const { execSync } = require('child_process');
const cwd = 'MASAR';
console.log('Adding files...');
execSync('git add -A', { cwd, stdio: 'inherit' });
console.log('Committing...');
execSync('git commit -m "fix(shapes): unify shape selection across global controls, card header pill, center tab and drawer"', { cwd, stdio: 'inherit' });
console.log('Pushing...');
execSync('git push origin main', { cwd, stdio: 'inherit' });
console.log('Done!');

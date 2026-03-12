import { execSync } from 'child_process';
try {
  execSync('python3 -m py_compile backend/backend.py');
  console.log('No syntax errors');
} catch (e) {
  console.error(e.stderr.toString());
}

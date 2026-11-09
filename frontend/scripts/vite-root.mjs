import { createHash } from 'node:crypto';
import { existsSync, realpathSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export function getViteRoot(root) {
  if (!root.includes('#')) return root;

  const suffix = createHash('sha1').update(resolve(root)).digest('hex').slice(0, 10);
  const alias = join(tmpdir(), `del-valle-inventory-${suffix}`);
  if (existsSync(alias)) {
    if (realpathSync(alias) !== realpathSync(root)) {
      throw new Error(`The Vite path alias already exists and points elsewhere: ${alias}`);
    }
    return alias;
  }

  symlinkSync(root, alias, process.platform === 'win32' ? 'junction' : 'dir');
  return alias;
}

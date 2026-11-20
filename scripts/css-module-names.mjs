// CSS Modules class names shared by the app build (Vite) and the static pages (Astro, ADR 0003).
// The pages are generated once per cut and the app Worker links the app's stylesheet to them, so both
// must produce the same names. Vite's default name carries a hash of the file's content and the line
// of the rule: any CSS edit renamed the classes and the stored pages lost their styles until the next
// cut. This one depends only on the file's path and the class name, so it survives CSS changes.
import { createHash } from 'node:crypto';
import { basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

export function generateScopedName(name, filename) {
  const file = filename.split('?')[0];
  const path = relative(ROOT, file).replaceAll('\\', '/');
  const hash = createHash('sha1').update(path).digest('base64url').slice(0, 5);
  return `${basename(file).replace(/\.module\.css$/, '')}_${name}_${hash}`;
}

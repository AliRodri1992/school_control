// Minimal typing for the Node filesystem fixture used in frontend CSS regression tests.
// The app does not depend on Node.js at runtime.
declare module 'node:fs' {
 export function readFileSync(path:URL,encoding:'utf8'):string;
}

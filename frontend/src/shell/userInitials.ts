/** Short identity for a user when no portrait is shown in the sidebar. */
const nameParticles=new Set(['de','del','la','las','los','y','da','das','do','dos','van','von']);

export function userInitials(name:string|null|undefined):string{
 const words=(name||'').trim().split(/[\s\-–—]+/u)
  .map(word=>word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,''))
  .filter(Boolean);
 const significant=words.filter(word=>!nameParticles.has(word.toLocaleLowerCase('es-MX')));
 const parts=significant.length?significant:words;
 if(!parts.length)return 'US';

 const first=Array.from(parts[0])[0];
 const second=parts.length>1?Array.from(parts[parts.length-1])[0]:Array.from(parts[0])[1]||'';
 return (first+second).toLocaleUpperCase('es-MX');
}

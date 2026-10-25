import {BookOpen,LoaderCircle} from 'lucide-react';

/** A quiet session-check placeholder; the illustrated school setup is exclusive to a new login. */
export default function SessionRestoreScreen({locale}:{locale:string}){
 const english=locale==='en';
 return <main className="sc-session-restore" role="status" aria-live="polite" aria-busy="true">
  <div className="sc-session-restore-content">
   <span className="sc-session-restore-icon" aria-hidden="true"><BookOpen size={25}/></span>
   <LoaderCircle className="sc-session-restore-spinner" size={20} aria-hidden="true"/>
   <p>{english?'Restoring your session…':'Restaurando tu sesión…'}</p>
  </div>
 </main>;
}

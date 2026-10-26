import {userInitials} from './userInitials';

/** Use the exact same two-character account identity as the sidebar. */
export function TopbarAccountAvatar({name,avatarUrl}:{name:string;avatarUrl?:string|null}){
 return <span className="sc-topbar-avatar-initials" aria-hidden="true">
  {avatarUrl?<img className="sc-user-avatar-img" src={avatarUrl} alt="" onError={event=>{event.currentTarget.style.display='none';}}/>:userInitials(name)}
 </span>;
}

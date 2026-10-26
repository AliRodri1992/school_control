import {userInitials} from './userInitials';

/** Use the exact same two-character account identity as the sidebar. */
export function TopbarAccountAvatar({name,avatarUrl}:{name:string;avatarUrl?:string|null}){
 return avatarUrl?<img src={avatarUrl} alt="" className="sc-profile-shell-photo"/>:
  <span className="sc-topbar-avatar-initials" aria-hidden="true">{userInitials(name)}</span>;
}

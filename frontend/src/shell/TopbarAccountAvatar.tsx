import {userInitials} from './userInitials';

/** Use the exact same two-character account identity as the sidebar. */
export function TopbarAccountAvatar({name}:{name:string}){
 return <span className="sc-topbar-avatar-initials" aria-hidden="true">{userInitials(name)}</span>;
}

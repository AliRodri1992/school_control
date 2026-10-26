import {useEffect,useState} from 'react';
import {userInitials} from './userInitials';

export function TopbarAccountAvatar({name,avatarUrl}:{name:string;avatarUrl?:string|null}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[avatarUrl]);
 return <span className="sc-topbar-avatar-initials" aria-hidden="true">
  {avatarUrl&&!failed?<img className="sc-user-avatar-img" src={avatarUrl} alt="" onError={()=>setFailed(true)}/>:userInitials(name)}
 </span>;
}

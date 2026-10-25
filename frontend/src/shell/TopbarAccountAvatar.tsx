import {useEffect,useState} from 'react';
import {userInitials} from './userInitials';

/** Preserve the uploaded portrait, falling back to initials when an asset is missing. */
export function TopbarAccountAvatar({name,avatarUrl}:{name:string;avatarUrl?:string|null}){
 const [broken,setBroken]=useState(false);
 const src=avatarUrl||'/images/default-account-avatar.svg';
 useEffect(()=>{setBroken(false);},[src]);
 return broken?
  <span className="sc-topbar-avatar-fallback" aria-hidden="true">{userInitials(name)}</span>:
  <img className="sc-topbar-avatar-img" src={src} alt="" loading="lazy"
   onError={()=>setBroken(true)}/>;
}

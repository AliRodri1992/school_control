import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {translateUiText} from './english';

type Locale={
 locale:string;
 t:(key:string,fallback:string)=>string;
 ui:(text:string)=>string;
};
const C=createContext<Locale>({locale:'es',t:(_key,fallback)=>fallback,ui:(text)=>text});

export function LocaleProvider({locale,translations,children}:{locale:string;translations:Record<string,string>;children:ReactNode}){
 const ui=(text:string)=>translateUiText(locale,text);
 const t=(key:string,fallback:string)=>translations[key]||ui(fallback);
 return <C.Provider value={{locale,t,ui}}>{children}</C.Provider>;
}
export function useSchoolLocale(){return useContext(C);}

// The portal owns the authenticated preference. App metadata is above the
// portal provider, so subscribe to its language changes without copying API state.
export function useInterfaceLocale(){
 const [locale,setLocale]=useState(()=>localStorage.getItem('school-locale')||'es');
 useEffect(()=>{
   const refresh=()=>setLocale(localStorage.getItem('school-locale')||'es');
   window.addEventListener('school-locale-changed',refresh);
   window.addEventListener('storage',refresh);
   return()=>{
     window.removeEventListener('school-locale-changed',refresh);
     window.removeEventListener('storage',refresh);
   };
 },[]);
 return {locale,ui:(text:string)=>translateUiText(locale,text)};
}

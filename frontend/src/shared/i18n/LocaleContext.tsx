import {createContext,useContext,type ReactNode} from 'react';
type Locale={locale:string;t:(key:string,fallback:string)=>string};
const C=createContext<Locale>({locale:'es',t:(_key,fallback)=>fallback});
export function LocaleProvider({locale,translations,children}:{locale:string;translations:Record<string,string>;children:ReactNode}){
 const t=(key:string,fallback:string)=>translations[key]||fallback;
 return <C.Provider value={{locale,t}}>{children}</C.Provider>;
}
export function useSchoolLocale(){return useContext(C);}

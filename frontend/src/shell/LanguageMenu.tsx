import {Check} from 'lucide-react';

export type LanguageOption={code:string;native_name:string};

type Props={
 languages:readonly LanguageOption[];
 currentLocale:string;
 label:string;
 onSelect:(code:string)=>void;
};

/** Edge-to-edge options share the same interactive hit area and selection background. */
export default function LanguageMenu({languages,currentLocale,label,onSelect}:Props){
 return <div className="sc-flyout sc-language-menu" role="group" aria-label={label}>
  {languages.map(language=><button key={language.code} type="button"
   className="sc-flyout-link sc-language-option"
   aria-pressed={currentLocale===language.code}
   onClick={()=>onSelect(language.code)}>
   <span className="sc-language-option-label">{language.native_name} · {language.code.toUpperCase()}</span>
   {currentLocale===language.code&&<Check size={16} aria-hidden="true"/>}
  </button>)}
 </div>;
}

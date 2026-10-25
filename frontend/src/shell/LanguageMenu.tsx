import type {KeyboardEvent} from 'react';
import {Check} from 'lucide-react';

export type LanguageOption={code:string;native_name:string};

type Props={
 languages:readonly LanguageOption[];
 currentLocale:string;
 label:string;
 onSelect:(code:string)=>void;
};

/** Edge-to-edge rows with predictable Arrow/Home/End keyboard navigation. */
export default function LanguageMenu({languages,currentLocale,label,onSelect}:Props){
 function moveFocus(event:KeyboardEvent<HTMLDivElement>){
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  const options=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('.sc-language-option'));
  if(!options.length)return;
  event.preventDefault();
  const position=options.indexOf(document.activeElement as HTMLButtonElement);
  const index=event.key==='Home'?0:event.key==='End'?options.length-1:
   event.key==='ArrowDown'?(position+1)%options.length:
   (position<=0?options.length-1:position-1);
  options[index].focus();
 }
 return <div className="sc-flyout sc-language-menu" role="group" aria-label={label} onKeyDown={moveFocus}>
  {languages.map(language=><button key={language.code} type="button"
   className="sc-flyout-link sc-language-option"
   aria-pressed={currentLocale===language.code}
   onClick={()=>onSelect(language.code)}>
   <span className="sc-language-option-label">{language.native_name} · {language.code.toUpperCase()}</span>
   {currentLocale===language.code&&<Check size={16} aria-hidden="true"/>}
  </button>)}
 </div>;
}

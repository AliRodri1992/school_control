/** The original School Control Auli artwork, with a builder outfit.
 *  Inline SVG prevents loading screens from depending on another image request. */
export default function AuliBuilderIllustration({locale}:{locale:string}){
 return (
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 480" role="img" aria-label={locale==='en'?'Auli the school parrot wearing a construction helmet, holding tools and a school blueprint':'Auli, el loro de School Control, con casco de trabajador, llave y plano de la escuela'}>
<title id="title">{locale==='en'?'Auli builds your school':'Auli construye tu escuela'}</title>
<desc id="desc">{locale==='en'?'School Control parrot wearing a yellow hard hat and uniform, holding a school blueprint and wrench.':'Auli, el loro de School Control, lleva casco de seguridad amarillo, uniforme de obra, plano de escuela y llave de trabajo.'}</desc>
<defs><linearGradient id="body" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#9DD7FB"/><stop offset=".52" stopColor="#6885F5"/><stop offset="1" stopColor="#7964E8"/></linearGradient><linearGradient id="wing" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#6C69ED"/><stop offset="1" stopColor="#3D55D4"/></linearGradient><linearGradient id="belly" x1="0" x2=".6" y1="0" y2="1"><stop stopColor="#F5FBFF"/><stop offset="1" stopColor="#DBE8FF"/></linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter></defs>
<ellipse cx="217" cy="447" rx="135" ry="19" fill="#070F32" opacity=".2" filter="url(#shadow)"/>
<path d="M296 284c47-3 78 30 86 82-46-8-72-22-99-50" fill="#5968E5" stroke="#293FAD" strokeWidth="8" strokeLinejoin="round"/>
<path d="M292 316c40 31 46 61 36 104-41-15-67-43-73-80" fill="#8F74E6" stroke="#4452BD" strokeWidth="7"/>
<path d="M142 333c-40 0-63 29-60 76 30-20 56-27 82-32" fill="#6B83ED" stroke="#334CAD" strokeWidth="7"/>
<path d="M142 322c-40-13-61 23-59 62 37-7 61-21 81-38" fill="#475AD5"/>
<path d="M129 136C91 182 87 247 102 327c12 65 65 113 131 111 73-2 124-50 123-124V227c-1-57-19-100-56-133-48-44-130-32-171 42Z" fill="url(#body)" stroke="#243E9C" strokeWidth="9" strokeLinejoin="round"/>
<path d="M151 277c12-23 45-41 82-40 45 0 79 26 83 70 6 54-30 101-87 104-56 2-93-43-93-92 0-15 5-30 15-42Z" fill="url(#belly)" opacity=".96"/>
<path d="M140 136c-17-38-8-59 9-73 4 23 19 34 29 38 2-35 16-49 36-55-8 28 4 42 13 54" fill="#90A7F9" stroke="#243E9C" strokeWidth="8" strokeLinejoin="round"/>
<path d="M112 214C70 236 54 278 76 327c10 23 32 41 61 50l39-84c-21-20-26-51-64-79Z" fill="url(#wing)" stroke="#243E9C" strokeWidth="9"/>
<path d="M105 272c-18 22-13 47 2 61M123 282c-10 26-7 44 8 56" fill="none" stroke="#B9C5FF" strokeWidth="7" strokeLinecap="round"/>
<path d="M335 221c42-24 65-2 69 24 6 36-9 66-36 80l-33-48" fill="#8395F6" stroke="#243E9C" strokeWidth="8" strokeLinejoin="round"/>
<path d="M375 246l26-27M383 258l36-8M383 276l31 15" stroke="#F8F4FF" strokeWidth="8" strokeLinecap="round"/>
<ellipse cx="179" cy="197" rx="41" ry="47" fill="#FFFFFF"/>
<ellipse cx="273" cy="196" rx="41" ry="47" fill="#FFFFFF"/>
<ellipse cx="194" cy="202" rx="17" ry="23" fill="#263768"/><ellipse cx="262" cy="200" rx="17" ry="23" fill="#263768"/>
<circle cx="199" cy="193" r="7" fill="#FFFFFF"/><circle cx="267" cy="192" r="7" fill="#FFFFFF"/>
<ellipse cx="136" cy="247" rx="19" ry="10" fill="#FFB5B7" opacity=".8"/><ellipse cx="321" cy="245" rx="19" ry="10" fill="#FFB5B7" opacity=".8"/>
<path d="M199 233c8-10 22-16 34-16 14 0 28 6 35 17-6 27-17 48-35 58-15-7-28-26-34-59Z" fill="#F4A340" stroke="#8D571E" strokeWidth="6" strokeLinejoin="round"/>
<path d="M211 267c14 8 31 8 44-1" fill="none" stroke="#8D571E" strokeWidth="5" strokeLinecap="round"/>
<path d="M175 432v22m-30-5 29-3 25 4M267 431v24m-24-5 24-4 26 4" stroke="#F4A340" strokeWidth="13" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M173 126c27-15 74-22 113 0" fill="none" stroke="#CDE4FF" strokeWidth="9" opacity=".7" strokeLinecap="round"/>
<path d="M205 340c10-7 36-8 47 0" fill="none" stroke="#CBD7F8" strokeWidth="6" strokeLinecap="round"/>
<circle cx="89" cy="87" r="8" fill="#F4A340"/><path d="m355 93 6 15 15 6-15 5-6 15-6-15-15-5 15-6Z" fill="#F9D18E"/>
<g id="builder-auli" strokeLinejoin="round">

<path d="M139 125q3-65 53-81 45-20 86 8 32 21 34 73Z" fill="#FFC342" stroke="#B9770E" strokeWidth="6"/>
<path d="M151 110q12-47 49-60M281 72q17 18 19 37" fill="none" stroke="#FFE796" strokeWidth="9" strokeLinecap="round" opacity=".8"/>
<path d="M217 45v77" fill="none" stroke="#D99017" strokeWidth="7" opacity=".9"/>
<path d="M131 126q89-24 186 0l4 14q-97-10-194 3Z" fill="#FFB019" stroke="#A96B0E" strokeWidth="6"/>
<rect x="212" y="71" width="40" height="30" rx="7" fill="#0A4C9F" stroke="#FFF0A8" strokeWidth="3"/>
<path d="m221 85 9-7 10 8-10 8Z" fill="#D6ECFF"/>

<path d="M166 305q52 33 118 0l18 96q-59 31-134-5Z" fill="#153D78" opacity=".90" stroke="#173B71" strokeWidth="5"/>
<path d="M176 308 196 389M272 308l-15 86" fill="none" stroke="#E1EDFF" strokeWidth="12" opacity=".75"/>
<path d="M171 385q57 15 121 0l2 20q-63 17-123 0Z" fill="#C88238" stroke="#875121" strokeWidth="4"/>
<rect x="218" y="387" width="33" height="19" rx="4" fill="#F1C36B" stroke="#794E25" strokeWidth="3"/>

<g transform="rotate(-10 120 330)">
<rect x="68" y="299" width="120" height="103" rx="8" fill="#EDF7FF" stroke="#215CA4" strokeWidth="5"/>
<path d="M80 316h96M80 391h96" stroke="#A8D8FF" strokeWidth="3"/>
<path d="M96 373v-33l33-19 34 19v33Z" fill="none" stroke="#4385CE" strokeWidth="4"/>
<path d="M120 373v-25h15v25M102 344h10v10M146 344h10v10" fill="none" stroke="#4385CE" strokeWidth="4"/>
</g>

<g transform="rotate(13 377 262)">
<path d="M363 171c-25 8-25 37-10 51l-5 113q2 18 18 17 14-1 15-19l-5-112c17-16 19-39 1-53v27l-12 8-12-9Z"
 fill="#BACCE4" stroke="#365D91" strokeWidth="7"/>
<path d="M365 242v88" fill="none" stroke="#EFF6FF" strokeWidth="8" opacity=".76" strokeLinecap="round"/>
<circle cx="365" cy="333" r="5" fill="#4F79AC"/>
</g>

<path d="M144 448h55M242 448h54" fill="none" stroke="#326BB4" strokeWidth="7" strokeLinecap="round" opacity=".6"/>
</g>
</svg>
 );
}

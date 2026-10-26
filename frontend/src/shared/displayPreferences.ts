/** Account-scoped table settings; never restore another user's saved filters. */
export type DisplaySettings={remember_filters?:boolean;hide_notification_previews?:boolean;hide_sensitive_data?:boolean;
 time_format?:string;date_format?:string;week_start?:string;table_density?:string;rows_per_page?:number;
 high_contrast?:boolean;large_text?:boolean;reduce_motion?:boolean};
export function readDisplaySettings():DisplaySettings{
 try{const value=JSON.parse(localStorage.getItem('school-preferences')||'{}');return value&&typeof value==='object'?value:{};}
 catch{return {};}
}
export function applyDisplaySettings(settings:DisplaySettings){
 const root=document.documentElement;
 root.dataset.schoolContrast=String(settings.high_contrast===true);
 root.dataset.schoolLargeText=String(settings.large_text===true);
 root.dataset.schoolReduceMotion=String(settings.reduce_motion===true);
 root.dataset.schoolHideSensitive=String(settings.hide_sensitive_data===true);
 root.dataset.schoolTableDensity=settings.table_density||'comfortable';
 root.dataset.schoolTimeFormat=settings.time_format||'24h';
 root.dataset.schoolDateFormat=settings.date_format||'dd/mm/yyyy';
 root.dataset.schoolWeekStart=settings.week_start||'monday';
}
export function displayNotificationTitle(title:string,locale:string,settings=readDisplaySettings()){
 return settings.hide_notification_previews?(locale==='en'?'Notification preview hidden':'Vista previa oculta'):title;
}
export function schoolDate(value:string|Date,locale:string,settings=readDisplaySettings()){
 const date=new Date(value);
 if(Number.isNaN(date.getTime()))return '';
 const format=settings.date_format||'dd/mm/yyyy';
 if(format==='yyyy-mm-dd')return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 return new Intl.DateTimeFormat(locale==='en'?'en-US':'es-MX',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
}
export function schoolTime(value:string|Date,locale:string,settings=readDisplaySettings()){
 const date=new Date(value);if(Number.isNaN(date.getTime()))return '';
 return new Intl.DateTimeFormat(locale==='en'?'en-US':'es-MX',{hour:'2-digit',minute:'2-digit',hour12:settings.time_format==='12h'}).format(date);
}

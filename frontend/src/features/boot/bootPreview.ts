import type {BootStage} from './SchoolBootScreen';

/** Development-only review route, independent of authentication and the portal shell. */
export function previewBootStage(search:string):BootStage{
 return new URLSearchParams(search).get('stage')==='modules'?'modules':'connecting';
}

/** The boot preview exists only in Vite development; production always uses App. */
export function shouldShowBootPreview(isDevelopment:boolean,pathname:string):boolean{
 return isDevelopment&&pathname==='/__preview/preparing';
}

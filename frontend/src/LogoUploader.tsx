import {useEffect, useRef} from 'react';
import Uppy from '@uppy/core';
import UppyDashboard from '@uppy/dashboard';
import '@uppy/core/css/style.min.css';
import '@uppy/dashboard/css/style.min.css';
export default function LogoUploader({onChange}:{onChange:(file:File|null)=>void}) {
 const target=useRef<HTMLDivElement>(null);
 const callback=useRef(onChange);
 callback.current=onChange;
 useEffect(()=>{
  const uppy=new Uppy({autoProceed:false,restrictions:{maxNumberOfFiles:1,maxFileSize:2*1024*1024,allowedFileTypes:['image/png','image/jpeg','image/webp']}});
  uppy.use(UppyDashboard,{target:target.current!,inline:true,height:260,width:'100%',hideUploadButton:true,proudlyDisplayPoweredByUppy:false,note:'PNG, JPG o WebP · hasta 2 MB. Se carga al guardar la configuración.',locale:{strings:{dropPasteFiles:'Arrastra tu logotipo o %{browseFiles}',browseFiles:'selecciona un archivo',removeFile:'Quitar archivo',cancel:'Cancelar',done:'Listo',addMoreFiles:'Añadir archivo'}}});
  uppy.on('file-added',file=>callback.current(file.data instanceof File?file.data:null));
  uppy.on('file-removed',()=>callback.current(null));
  return()=>uppy.destroy();
 },[]);
 return <div ref={target} aria-label="Seleccionar logotipo de la escuela"/>;
}

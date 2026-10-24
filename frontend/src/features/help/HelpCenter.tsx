import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import {useState} from 'react';
import {ArrowRight,BookOpen,HelpCircle,Search} from 'lucide-react';
import type {Row} from '../../modules';

type Topic={title:string;page?:string;permission?:string;steps:string[]};
const sections:Record<string,Topic[]>={
 admin:[
  {title:'Configurar datos de la escuela',page:'school',permission:'schools.update',steps:['Abre Administración → Mi escuela.','Registra el nombre de la institución y coloca su logotipo.','Guarda los cambios y comprueba el encabezado y los correos institucionales.']},
  {title:'Crear un ciclo escolar',page:'academic_years',permission:'academic_years.create',steps:['En Gestión académica, entra a Ciclos escolares.','Selecciona Registrar ciclo.','Indica inicio, fin y periodos de inscripción o reinscripción.','Guarda el ciclo antes de crear sus grupos.']},
  {title:'Crear materias y grupos',page:'subjects',permission:'subjects.create',steps:['En Materias, registra nombre y clave única.','Abre Ciclos escolares → Grupos y crea el grado, sección A/B y cupo.','Después, en Clases, vincula grupo, materia y docente activo.']},
  {title:'Registrar un alumno',page:'students',permission:'students.create',steps:['Abre Gestión escolar → Alumnos y expedientes.','Selecciona Registrar alumno y llena nombre, CURP, fecha de nacimiento y tutor.','Corrige cualquier mensaje de validación debajo del campo.','Guarda y abre Ver expediente para gestionar direcciones, teléfonos, contactos y notas.']},
  {title:'Revisar solicitudes de inscripción',page:'admissions',permission:'admissions.approve',steps:['Abre Admisiones y localiza las solicitudes enviadas.','Revisa el folio, el ciclo y el grado.','Aprueba asignando un grupo compatible con cupo o rechaza indicando el motivo.']},
  {title:'Crear y revisar horarios',page:'schedule',permission:'schedule_slots.index',steps:['Configura primero materias, grupos y clases.','Abre Horarios y selecciona el grupo.','Agrega sesiones manualmente o utiliza el generador si tu rol tiene autorización.','Revisa posibles choques de aula, grupo o docente.']},
  {title:'Revisar y publicar calificaciones',page:'grades',permission:'grades.index',steps:['Accede a Calificaciones.','Comprueba los borradores capturados por docentes.','Revisa las notas antes de publicarlas; los alumnos y tutores ven solo resultados publicados.','Una calificación publicada requiere un proceso autorizado para corregirla.']},
  {title:'Importar Excel o CSV',page:'imports',permission:'students.create',steps:['En Importaciones, elige alumnos, materias, grupos, docentes, tutores o calificaciones.','Adjunta el archivo y asocia cada encabezado con su campo del sistema.','Guarda el mapeo como plantilla si usarás ese formato nuevamente.','Corrige filas inválidas y confirma; las calificaciones se importan como borradores.']},
  {title:'Configurar notificaciones y correos',page:'email_templates',permission:'email_templates.index',steps:['En Plantillas de correo, selecciona un tipo de mensaje.','Modifica asunto, encabezado, contenido, color y pie institucional.','Comprueba la vista previa y guarda como borrador o publica.']}
 ],
 teacher:[
  {title:'Consultar mis grupos y clases',page:'groups',permission:'groups.index',steps:['Abre Mis grupos o Mis clases.','Verifica las materias que tienes asignadas.','Consulta el horario antes de registrar actividades.']},
  {title:'Pasar lista',page:'attendances',permission:'attendances.create',steps:['Abre Asistencia.','Selecciona la inscripción del alumno y la fecha.','Indica presente, falta, retardo o justificada.','Guarda y comprueba los mensajes de validación.']},
  {title:'Capturar calificaciones',page:'grades',permission:'grades.create',steps:['Abre Calificaciones y selecciona tu clase.','Elige alumno, trimestre, nota entre 0 y 10 y retroalimentación.','Guarda el borrador. La publicación requiere revisión administrativa.']},
  {title:'Publicar actividades',page:'classroom',permission:'assignments.create',steps:['Abre Aula virtual.','Crea actividades para una de tus clases.','Revisa entregas, asigna retroalimentación y da seguimiento a las tareas.']}
 ],
 guardian:[
  {title:'Consultar la información de mis hijos',page:'students',permission:'students.index',steps:['Abre Mis hijos.','Usa el selector de alumno en el encabezado para filtrar información.','Consulta expediente y datos académicos autorizados.']},
  {title:'Realizar una inscripción o reinscripción',page:'admissions',permission:'admissions.create',steps:['Revisa que el ciclo escolar tenga la convocatoria abierta.','En Inscripciones, crea una solicitud para tu hijo y grado correspondiente.','Guarda el folio y consulta su estado hasta que sea resuelta.']},
  {title:'Entregar documentación',page:'documents',permission:'student_documents.create',steps:['Abre Documentos.','Selecciona el alumno y adjunta el PDF, PNG o JPG solicitado.','Consulta el resultado de revisión y corrige los documentos observados.']},
  {title:'Consultar calificaciones y faltas',page:'grades',permission:'grades.index',steps:['Elige el hijo que quieres consultar.','Abre Calificaciones para revisar solo las notas publicadas.','Consulta Asistencia para conocer faltas o retardos.']}
 ],
 student:[
  {title:'Consultar mi horario',page:'schedule',permission:'schedule_slots.index',steps:['Abre Mi horario desde el menú.','Revisa el día, materia y docente correspondientes.']},
  {title:'Revisar actividades',page:'classroom',permission:'assignments.index',steps:['Abre Mis tareas o Aula virtual.','Consulta las indicaciones y fechas de entrega.','Envía tus respuestas usando las opciones disponibles en cada actividad.']},
  {title:'Ver mis calificaciones',page:'grades',permission:'grades.index',steps:['Abre Mis calificaciones.','Selecciona el trimestre y revisa las notas publicadas.','Si tienes dudas, utiliza los canales de comunicación de la escuela.']}
 ]
};
export default function HelpCenter({role,can,onNavigate}:{role:string;can:(permission:string)=>boolean;onNavigate:(page:string)=>void}){
 const {t}=useSchoolLocale();
 const [query,setQuery]=useState('');
 const allowed=(sections[role]||sections.guardian).filter(t=>!t.permission||can(t.permission));
 const heading=(topic:Topic)=>t('help.'+role+'.'+topic.page+'.title',topic.title);
 const steps=(topic:Topic)=>topic.steps.map((line,i)=>t('help.'+role+'.'+topic.page+'.step'+i,line));
 const filtered=allowed.filter(topic=>(heading(topic)+' '+steps(topic).join(' ')).toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));
 return <section className="sc-help-center">
  <header className="page-heading"><div><span className="eyebrow">MI CUENTA / CENTRO DE AYUDA</span><h1>{t('help.title','Guía de uso del sistema')}</h1>
  <p>{t('help.description','Aprende paso a paso a utilizar los módulos disponibles en tu portal. Las instrucciones se adaptan a tus permisos.')}</p></div></header>
  <div className="sc-help-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)}
   aria-label="Buscar en la guía" placeholder={t("help.search","Buscar tarea o módulo…")}/></div>
  <div className="sc-help-topics">
   {filtered.map((topic,index)=><details key={topic.title} className="sc-help-topic" open={!!query||index===0}>
    <summary><span className="sc-help-number"><BookOpen size={19}/></span><strong>{heading(topic)}</strong><HelpCircle size={17}/></summary>
    <div className="sc-help-body"><ol>{steps(topic).map((step,index)=><li key={index}>{step}</li>)}</ol>
     {topic.page&&<button className="secondary" onClick={()=>onNavigate(topic.page!)}>{t("help.open","Ir al módulo")}<ArrowRight size={16}/></button>}
    </div>
   </details>)}
  </div>
  {!filtered.length&&<div className="panel sc-help-no-results">No hay temas disponibles para esta búsqueda. Prueba con el nombre de un módulo.</div>}
  <p className="sc-help-footer">Las acciones disponibles dependen de los permisos institucionales y del estado de cada expediente.</p>
 </section>;
}

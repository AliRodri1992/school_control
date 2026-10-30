import {fields,rules,request,example,resolve,type Schemas,type Schema} from './apiSchema';
export default function ApiRequestReference({body,parameters,schemas}:{body?:unknown;parameters?:unknown[];schemas:Schemas}){
 const {media,schema,required}=request(body),rows=fields(schema,schemas);
 const params=(parameters||[]) as {name:string;in:string;required?:boolean;schema?:Schema;description?:string}[];
 const sample=example(schema,schemas);
 return <div className="sc-api-reference">
 {params.length>0&&<section><h4>Parámetros de petición</h4><div className="sc-api-fields"><table><thead><tr><th>Campo</th><th>Ubicación</th><th>Tipo</th><th>Obligatorio</th><th>Reglas</th></tr></thead><tbody>{params.map(p=><tr key={p.name}><td><code>{p.name}</code></td><td>{p.in}</td><td>{resolve(p.schema,schemas).type||'No documentado'}</td><td>{p.required?'Sí':'No'}</td><td>{[...rules(resolve(p.schema,schemas)),p.description].filter(Boolean).join(' · ')||'Sin restricciones documentadas'}</td></tr>)}</tbody></table></div></section>}
 {body!==undefined&&<section><h4>Request body <small>{media||'Formato no documentado'} · {required?'Obligatorio':'Opcional'}</small></h4>
 {rows.length?<><div className="sc-api-fields"><table><thead><tr><th>Campo</th><th>Tipo</th><th>Obligatorio</th><th>Longitud, formato y opciones</th></tr></thead><tbody>{rows.map(x=><tr key={x.name}><td><code>{x.name}</code></td><td>{x.schema.type||'No documentado'}</td><td>{x.required?'Sí':'No'}</td><td>{rules(x.schema).join(' · ')||x.schema.description||'Sin restricciones documentadas'}</td></tr>)}</tbody></table></div>{sample&&<div className="sc-api-json-example"><strong>Ejemplo de request JSON</strong><pre>{sample}</pre><small>Ejemplo ilustrativo generado a partir del esquema; ajusta los valores antes de utilizarlo.</small></div>}</>:<p className="sc-api-missing-contract">El contrato OpenAPI todavía no define los campos de esta operación. No se muestran tipos, longitudes ni ejemplos inventados.</p>}
 </section>}</div>;
}

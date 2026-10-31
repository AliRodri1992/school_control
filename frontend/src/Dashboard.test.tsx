// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {useState} from 'react';
import userEvent from '@testing-library/user-event';
import CollectionToolbar from './CollectionToolbar';
afterEach(cleanup);
it('searches within its module and offers a compact non-searchable filter',async()=>{
 const onQuery=vi.fn(),onFilter=vi.fn();
 function Harness(){const [query,setQuery]=useState('');return <CollectionToolbar title="documentos" query={query} onQuery={value=>{setQuery(value);onQuery(value);}} filter="" onFilter={onFilter} total={12} options={[{value:'pending',label:'Pendientes'},{value:'approved',label:'Aprobados'}]}/>;}
 render(<Harness/>);
 await userEvent.type(screen.getByRole('searchbox',{name:'Buscar en documentos'}),'acta');
 expect(onQuery).toHaveBeenCalledWith('acta');
 await userEvent.click(screen.getByRole('combobox',{name:'Filtrar documentos'}));
 expect(screen.queryByRole('searchbox',{name:'Buscar en Filtrar documentos'})).toBeNull();
 await userEvent.click(screen.getByRole('option',{name:'Pendientes'}));
 expect(onFilter).toHaveBeenCalledWith('pending');
});

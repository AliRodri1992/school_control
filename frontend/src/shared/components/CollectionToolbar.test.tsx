// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CollectionToolbar from './CollectionToolbar';
afterEach(cleanup);
it('searches within its module and offers a compact non-searchable filter',async()=>{
 const onQuery=vi.fn(),onFilter=vi.fn();
 render(<CollectionToolbar title="documentos" query="" onQuery={onQuery} filter="" onFilter={onFilter}
  total={12} options={[{value:'pending',label:'Pendientes'},{value:'approved',label:'Aprobados'}]}/>);
 await userEvent.type(screen.getByRole('searchbox',{name:'Buscar en documentos'}),'acta');
 expect(onQuery).toHaveBeenCalledWith('acta');
 await userEvent.click(screen.getByRole('combobox',{name:'Filtrar documentos'}));
 expect(screen.queryByRole('searchbox',{name:'Buscar en Filtrar documentos'})).toBeNull();
 await userEvent.click(screen.getByRole('option',{name:'Pendientes'}));
 expect(onFilter).toHaveBeenCalledWith('pending');
});

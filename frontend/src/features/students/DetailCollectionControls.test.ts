import {describe,expect,it} from 'vitest';
import {collectionParams,initialCollectionFilters} from './DetailCollectionControls';
describe('student dossier list requests',()=>{
 it('uses server pagination for all dossier collections',()=>{
  expect(collectionParams(initialCollectionFilters)).toBe('page=1&per_page=8&sort=newest');
 });
 it('encodes searches and optional resource filters safely',()=>{
  const query=collectionParams({...initialCollectionFilters,query:'María López & familia',type:'home',flag:'primary',page:2,perPage:16});
  const params=new URLSearchParams(query);
  expect(params.get('q')).toBe('María López & familia');
  expect(params.get('type')).toBe('home');
  expect(params.get('flag')).toBe('primary');
  expect(params.get('page')).toBe('2');
  expect(params.get('per_page')).toBe('16');
 });
});

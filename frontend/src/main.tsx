import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import SchoolBootScreen from './features/boot/SchoolBootScreen';
import {previewBootStage,shouldShowBootPreview} from './features/boot/bootPreview';
import {BrowserRouter,Route,Routes} from 'react-router-dom';
import './styles.css';
import './styles/design-system.css';
import './styles/portal-shell.css';
import './styles/sidebar-account-menu.css';
import './styles/portal-footer.css';
import './styles/school-boot.css';
import './styles/session-restore.css';
import './styles/dialogs.css';
import './styles/imports.css';
import './styles/languages.css';
import './styles/forms.css';
import './styles/api-docs.css';
import './styles/mail-designer.css';
import './styles/student-details.css';
import './styles/dashboard-context.css';
import './styles/preferences.css';
import './styles/portal-home.css';
import './styles/help.css';
const previewPath='/__preview/preparing';
const preview=shouldShowBootPreview(import.meta.env.DEV,window.location.pathname);
const previewStage=previewBootStage(window.location.search);
const previewLocale=localStorage.getItem('school-locale')||'es';
createRoot(document.getElementById('root')!).render(
 <React.StrictMode>
  <BrowserRouter>
   <Routes>
    {preview&&<Route path={previewPath} element={<SchoolBootScreen locale={previewLocale} stage={previewStage}/>}/>}
    <Route path="*" element={<App/>}/>
   </Routes>
  </BrowserRouter>
 </React.StrictMode>
);

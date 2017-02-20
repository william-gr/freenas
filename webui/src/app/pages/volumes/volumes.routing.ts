import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { VolumesListComponent } from './volumes-list/';
import { ManagerComponent } from './manager/';
//import { VolumesEditComponent } from './volumes-edit/index';
//import { VolumesDeleteComponent } from './volumes-delete/index';


export const routes: Routes = [
  { path: '', component: VolumesListComponent },
  { path: 'manager', component: ManagerComponent },
  //{ path: 'edit/:pk', component: VolumesEditComponent },
  //{ path: 'delete/:pk', component: VolumesDeleteComponent },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);

import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CIFSListComponent } from './cifs-list/';
import { CIFSAddComponent } from './cifs-add/';
import { CIFSEditComponent } from './cifs-edit/index';
import { CIFSDeleteComponent } from './cifs-delete/index';


export const routes: Routes = [
  { path: '', component: CIFSListComponent },
  { path: 'add', component: CIFSAddComponent },
  { path: 'edit/:pk', component: CIFSEditComponent },
  { path: 'delete/:pk', component: CIFSDeleteComponent },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);

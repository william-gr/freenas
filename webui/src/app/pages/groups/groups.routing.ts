import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GroupListComponent } from './group-list/';
import { GroupAddComponent } from './group-add/';
//import { GroupEditComponent } from './group-edit/index';
//import { GroupDeleteComponent } from './group-delete/index';


export const routes: Routes = [
  { path: '', component: GroupListComponent },
  { path: 'add', component: GroupAddComponent }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);

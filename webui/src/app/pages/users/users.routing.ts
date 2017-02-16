import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserListComponent } from './user-list/';
import { UserAddComponent } from './user-add/';
import { UserEditComponent } from './user-edit/index';
import { UserDeleteComponent } from './user-delete/index';


export const routes: Routes = [
  { path: '', component: UserListComponent },
  { path: 'add', component: UserAddComponent },
  { path: 'edit/:pk', component: UserEditComponent },
  { path: 'delete/:pk', component: UserDeleteComponent }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);

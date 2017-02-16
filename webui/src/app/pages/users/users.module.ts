import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';

import { routing }       from './users.routing';

import { UserListComponent } from './user-list/';
import { UserAddComponent } from './user-add/';
import { UserEditComponent } from './user-edit/';
import { UserDeleteComponent } from './user-delete/';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    routing
  ],
  declarations: [
    UserListComponent,
    UserAddComponent,
    UserEditComponent,
    UserDeleteComponent
  ],
  providers: [
  ]
})
export class UsersModule {}

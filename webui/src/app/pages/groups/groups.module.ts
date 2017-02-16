import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';

import { routing }       from './groups.routing';

import { GroupListComponent } from './group-list/';
import { GroupAddComponent } from './group-add/';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    routing
  ],
  declarations: [
    GroupListComponent,
    GroupAddComponent
  ],
  providers: [
  ]
})
export class GroupsModule {}

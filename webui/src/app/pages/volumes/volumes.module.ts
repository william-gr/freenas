import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';
import { BusyModule } from 'angular2-busy';

import { routing }       from './volumes.routing';

import { DragulaModule } from 'ng2-dragula';

import { VolumesListComponent } from './volumes-list/';
import { ManagerComponent, DiskComponent, VdevComponent } from './manager/';
//import { VolumesAddComponent } from './volumes-add/';
//import { VolumesEditComponent } from './volumes-edit/';
//import { VolumesDeleteComponent } from './volumes-delete/';

@NgModule({
  imports: [
    DragulaModule,
    BusyModule,
    DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgaModule,
    routing
  ],
  declarations: [
    VolumesListComponent,
    ManagerComponent,
    DiskComponent,
    VdevComponent,
    //VolumesAddComponent,
    //VolumesEditComponent,
    //VolumesDeleteComponent,
  ],
  providers: [
  ]
})
export class VolumesModule {}

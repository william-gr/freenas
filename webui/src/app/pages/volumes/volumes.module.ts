import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';
import { BusyModule } from 'angular2-busy';

import { routing }       from './volumes.routing';

import { VolumesListComponent } from './volumes-list/';
//import { VolumesAddComponent } from './volumes-add/';
//import { VolumesEditComponent } from './volumes-edit/';
//import { VolumesDeleteComponent } from './volumes-delete/';

@NgModule({
  imports: [
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
    //VolumesAddComponent,
    //VolumesEditComponent,
    //VolumesDeleteComponent,
  ],
  providers: [
  ]
})
export class VolumesModule {}

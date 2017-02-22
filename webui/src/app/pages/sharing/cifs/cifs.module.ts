import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../theme/nga.module';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';
import { BusyModule } from 'angular2-busy';

import { EntityModule } from '../../common/entity/entity.module';
import { routing } from './cifs.routing';

import { CIFSListComponent } from './cifs-list/';
import { CIFSAddComponent } from './cifs-add/';
import { CIFSEditComponent } from './cifs-edit/';
import { CIFSDeleteComponent } from './cifs-delete/';

@NgModule({
  imports: [
    EntityModule,
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
    CIFSListComponent,
    CIFSAddComponent,
    CIFSEditComponent,
    CIFSDeleteComponent,
  ],
  providers: [
  ]
})
export class CIFSModule { }

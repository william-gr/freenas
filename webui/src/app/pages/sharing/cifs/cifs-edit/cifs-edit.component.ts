import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../../services/';

@Component({
  selector: 'app-cifs-edit',
  template: `<entity-edit [conf]="this"></entity-edit>`
})
export class CIFSEditComponent {

  protected resource_name: string = 'sharing/cifs/';
  protected route_delete: string[] = ['sharing', 'cifs', 'delete'];
  protected route_success: string[] = ['sharing', 'cifs'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'cifs_name',
      label: 'Name',
    }),
    new DynamicInputModel({
      id: 'cifs_path',
      label: 'Path',
    }),
    new DynamicSelectModel({
      id: 'cifs_vfsobjects',
      label: 'VFS Objects',
      multiple: true,
    }),
  ];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected formService: DynamicFormService) {

  }

  afterInit(entityEdit: any) {
  }

}

import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../../services/';

@Component({
  selector: 'app-smb-edit',
  template: `<entity-edit [conf]="this"></entity-edit>`
})
export class SMBEditComponent {

  protected resource_name: string = 'sharing/smb/';
  protected route_delete: string[] = ['sharing', 'smb', 'delete'];
  protected route_success: string[] = ['sharing', 'smb'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'smb_name',
      label: 'Name',
    }),
    new DynamicInputModel({
      id: 'smb_path',
      label: 'Path',
    }),
    new DynamicSelectModel({
      id: 'smb_vfsobjects',
      label: 'VFS Objects',
      multiple: true,
    }),
  ];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected formService: DynamicFormService) {

  }

  afterInit(entityEdit: any) {
  }

}

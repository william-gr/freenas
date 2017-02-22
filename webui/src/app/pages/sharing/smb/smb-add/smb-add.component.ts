import { Component, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'app-smb-add',
  template: `<entity-add [conf]="this"></entity-add>`
})
export class SMBAddComponent {

  protected route_success: string[] = ['sharing', 'smb'];
  protected resource_name: string = 'sharing/smb/';

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

  private smb_vfsobjects: DynamicSelectModel<string>;

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _state: GlobalState) {

  }

  afterInit(entityAdd: any) {
    entityAdd.ws.call('notifier.choices', ['SMB_VFS_OBJECTS']).subscribe((res) => {
      this.smb_vfsobjects = <DynamicSelectModel<string>>this.formService.findById("smb_vfsobjects", this.formModel);
      res.forEach((item) => {
        this.smb_vfsobjects.add({ label: item[1], value: item[0] });
      });
    });
  }

}

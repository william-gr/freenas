import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, } from '@angular/forms';
import { Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService } from '../../../services/';
import { EntityAddComponent } from '../../common/entity/entity-add/index';

@Component({
  selector: 'app-group-add',
  templateUrl: '../../common/entity/entity-add/entity-add.component.html',
  styleUrls: ['../../common/entity/entity-add/entity-add.component.css']
})
export class GroupAddComponent extends EntityAddComponent {

  protected route_success: string[] = ['groups'];
  protected resource_name: string = 'account/groups/';

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
        id: 'bsdgrp_gid',
        label: 'GID',
    }),
    new DynamicInputModel({
        id: 'bsdgrp_group',
        label: 'Name',
    }),
  ];
  public users: any[];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {
    super(router, rest, ws, formService, _injector, _appRef, _state);
  }

  afterInit() {
    this.rest.get('account/users/', {limit: 0}).subscribe((res) => {
      this.users = res.data;
    });

    this.rest.get(this.resource_name, {limit: 0, bsdgrp_builtin: false}).subscribe((res) => {
      let gid = 999;
      res.data.forEach((item, i) => {
        if(item.bsdgrp_gid > gid) gid = item.bsdgrp_gid;
      });
      gid += 1;
      this.formGroup.controls['bsdgrp_gid'].setValue(gid);
    });

  }

}

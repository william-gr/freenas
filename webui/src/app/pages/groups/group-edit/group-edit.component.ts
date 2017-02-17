import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../services/rest.service';
import { EntityEditComponent } from '../../common/entity/entity-edit/index';

@Component({
  selector: 'app-group-edit',
  templateUrl: '../../common/entity/entity-edit/entity-edit.component.html',
  styleUrls: ['../../common/entity/entity-edit/entity-edit.component.css']
})
export class GroupEditComponent extends EntityEditComponent {

  protected resource_name: string = 'account/groups/';
  protected route_delete: string[] = ['groups', 'delete'];
  protected route_success: string[] = ['groups'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
        id: 'bsdgrp_gid',
        label: 'GID',
    }),
    new DynamicInputModel({
        id: 'bsdgrp_group',
        label: 'Group',
    }),
  ];

  public users: any[];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef) {
    super(router, route, rest, formService, _injector, _appRef);
  }

  afterInit() {
    this.rest.get('account/users/', {limit: 0}).subscribe((res) => {
      this.users = res.data;
    });
  }

  clean(data) {
    if(data['bsdgrp_builtin']) {
      delete data['bsdgrp_name'];
      delete data['bsdgrp_gid'];
    }
    return data;
  }

}

import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService,
    DynamicCheckboxModel,
    DynamicInputModel,
    DynamicSelectModel,
    DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService } from '../../../services/rest.service';
import { EntityAddComponent } from '../../common/entity/entity-add/index';

@Component({
  selector: 'app-user-add',
  templateUrl: '../../common/entity/entity-add/entity-add.component.html',
  styleUrls: ['../../common/entity/entity-add/entity-add.component.css']
})
export class UserAddComponent extends EntityAddComponent {

  protected route_success: string[] = ['users'];
  protected resource_name: string = 'account/users/';
  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
        id: 'bsdusr_uid',
        label: 'UID',
    }),
    new DynamicInputModel({
        id: 'bsdusr_username',
        label: 'Username',
    }),
    new DynamicInputModel({
        id: 'bsdusr_full_name',
        label: 'Full Name',
    }),
    new DynamicInputModel({
        id: 'bsdusr_email',
        label: 'Email',
    }),
    new DynamicSelectModel({
        id: 'bsdusr_group',
        label: 'Primary Group',
	options: [
	  {'label': 'test', 'value': 1}
	]
    }),
  ];
  public groups: any[];
  public shells: any[];

  constructor(protected router: Router, protected rest: RestService, protected formService: DynamicFormService,protected _injector: Injector, protected _appRef: ApplicationRef, _state: GlobalState) {
    super(router, rest, formService, _injector, _appRef, _state);
    this.rest.get('account/groups/', {}).subscribe((res) => {
      this.groups = res.data;
    });
    this.rest.get(this.resource_name, {}).subscribe((res) => {
      this.groups = res.data;
      let uid = 999;
      res.data.forEach((item, i) => {
        if(item.bsdusr_uid > uid) uid = item.bsdusr_uid;
      });
      uid += 1;
      this.data['bsdusr_uid'] = uid;
    });
    this.shells = [
      '/bin/sh',
    ]
    this.data['bsdusr_shell'] = this.shells[0];
  }

  clean_uid(value) {
    if(value['uid'] == null) {
      delete value['uid'];
    }
    return value;
  }

}

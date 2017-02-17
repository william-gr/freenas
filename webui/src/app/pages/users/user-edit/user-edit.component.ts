import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../services/rest.service';
import { EntityEditComponent } from '../../common/entity/entity-edit/index';

@Component({
  selector: 'app-user-edit',
  templateUrl: '../../common/entity/entity-edit/entity-edit.component.html',
  styleUrls: ['../../common/entity/entity-edit/entity-edit.component.css']
})
export class UserEditComponent extends EntityEditComponent {

  protected resource_name: string = 'account/users';
  protected route_delete: string[] = ['users', 'delete'];
  protected route_success: string[] = ['users'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
        id: 'bsdusr_uid',
        label: 'UID',
        validators: {required: null},
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
    new DynamicInputModel({
        id: 'bsdusr_password',
        label: 'Password',
        inputType: 'password',
    }),
    new DynamicSelectModel({
        id: 'bsdusr_group',
        label: 'Primary Group',
        options: [],
    }),
    new DynamicSelectModel({
        id: 'bsdusr_shell',
        label: 'Shell',
    }),
  ];

  private bsdusr_shell: DynamicSelectModel<string>;
  private bsdusr_group: DynamicSelectModel<string>;
  public shells: any[];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef) {
    super(router, route, rest, formService, _injector, _appRef);
  }

  afterInit() {
    this.rest.get('account/groups/', {}).subscribe((res) => {
      this.bsdusr_group = <DynamicSelectModel<string>> this.formService.findById("bsdusr_group", this.formModel);
      res.data.forEach((item) => {
        this.bsdusr_group.add({label: item.bsdgrp_group, value: item.bsdgrp_id});
      });
      this.bsdusr_group.valueUpdates.next();
    });

    this.shells = [
      {label: '/bin/sh', value: '/bin/sh'},
    ]
    this.data['bsdusr_shell'] = this.shells[0];
    this.bsdusr_shell = <DynamicSelectModel<string>> this.formService.findById("bsdusr_shell", this.formModel);
    this.bsdusr_shell.options = this.shells;
    this.formGroup.controls['bsdusr_shell'].setValue(this.shells[0]['value']);

  }

  clean_uid(value) {
    if(value['bsdusr_uid'] == null) {
      delete value['bsdusr_uid'];
    }
    return value;
  }

  clean(data) {
    delete data['groups'];
    if(data['builtin']) {
      delete data['bsdusr_gecos'];
      delete data['bsdusr_homedir'];
      delete data['bsdusr_username'];
      delete data['bsdusr_gid'];
      delete data['bsdusr_uid'];
    }
    delete data['bsdusr_builtin'];
    return data;
  }

}

import { ApplicationRef, Component, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dataset-add',
  template: `<entity-add [conf]="this"></entity-add>`
})
export class DatasetAddComponent {

  protected pk: any;
  private sub: Subscription;
  protected route_success: string[] = ['volumes'];
  get resource_name(): string {
    return 'storage/volume/' + this.pk + '/datasets/';
  }

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'name',
      label: 'Name',
    }),
  ];

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService) {

  }

  afterInit(entityAdd: any) {
    this.sub = this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
    });
    // this.rest.get(this.resource_name, {limit: 0, bsdgrp_builtin: false}).subscribe((res) => {
    //   let gid = 999;
    //   res.data.forEach((item, i) => {
    //     if(item.bsdgrp_gid > gid) gid = item.bsdgrp_gid;
    //   });
    //   gid += 1;
    //   entityAdd.formGroup.controls['bsdgrp_gid'].setValue(gid);
    // });
  }

}

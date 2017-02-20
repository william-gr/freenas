import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService } from '../../../services/rest.service';
import { EntityAddComponent } from '../../common/entity/entity-add/index';

@Component({
  selector: 'app-interfaces-add',
  templateUrl: '../../common/entity/entity-add/entity-add.component.html',
  styleUrls: ['../../common/entity/entity-add/entity-add.component.css']
})
export class InterfacesAddComponent extends EntityAddComponent {

  protected route_success: string[] = ['interfaces'];
  protected resource_name: string = 'network/interface/';

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
        id: 'int_name',
        label: 'Name',
    }),
    new DynamicSelectModel({
        id: 'int_interface',
        label: 'Interface',
    }),
    new DynamicInputModel({
        id: 'int_ipv4address',
        label: 'IPv4 Address',
    }),
    new DynamicInputModel({
        id: 'int_v4netmaskbit',
        label: 'IPv4 Netmask',
    }),
    new DynamicCheckboxModel({
        id: 'int_dhcp',
        label: 'DHCP',
    }),
  ];

  constructor(protected router: Router, protected rest: RestService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, _state: GlobalState) {
    super(router, rest, formService, _injector, _appRef, _state);
  }

  afterInit() {

  }

}

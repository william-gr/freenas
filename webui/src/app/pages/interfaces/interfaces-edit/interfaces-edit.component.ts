import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { RestService } from '../../../services/rest.service';
import { EntityEditComponent } from '../../common/entity/entity-edit/index';

@Component({
  selector: 'app-interfaces-edit',
  templateUrl: '../../common/entity/entity-edit/entity-edit.component.html',
  styleUrls: ['../../common/entity/entity-edit/entity-edit.component.css']
})
export class InterfacesEditComponent extends EntityEditComponent {

  protected resource_name: string = 'network/interface/';
  protected route_delete: string[] = ['interfaces', 'delete'];
  protected route_success: string[] = ['interfaces'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
        id: 'int_name',
        label: 'Name',
    }),
    new DynamicInputModel({
        id: 'int_interface',
        label: 'Interface',
    }),
    new DynamicInputModel({
        id: 'int_ipv4address',
        label: 'IPv4 Address',
        relation: [
            {
                action: "DISABLE",
                when: [
                    {
                        id: "int_dhcp",
                        value: true,
                    }
                ]
            },
        ],
    }),
    new DynamicInputModel({
        id: 'int_v4netmaskbit',
        label: 'IPv4 Netmask',
        relation: [
            {
                action: "DISABLE",
                when: [
                    {
                        id: "int_dhcp",
                        value: true,
                    }
                ]
            },
        ],
    }),
    new DynamicCheckboxModel({
        id: 'int_dhcp',
        label: 'DHCP',
    }),
    new DynamicInputModel({
        id: 'int_options',
        label: 'Options',
    }),
  ];

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef) {
    super(router, route, rest, formService, _injector, _appRef);
  }

  afterInit() {
  }

}

import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService } from '../../../services/';
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

  private int_interface: DynamicSelectModel<string>;

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {
    super(router, rest, ws, formService, _injector, _appRef, _state);
  }

  afterInit() {
    this.ws.call('notifier.choices', ['NICChoices']).subscribe((res) => {
      this.int_interface = <DynamicSelectModel<string>> this.formService.findById("int_interface", this.formModel);
      res.forEach((item) => {
          this.int_interface.add({label: item[1], value: item[0]});
      });
    });
  }

}

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../global.state';
import { RestService } from '../../../services/rest.service';

import { EntityListComponent } from '../../common/entity/entity-list/index';

@Component({
  selector: 'app-interfaces-list',
  templateUrl: '../../common/entity/entity-list/entity-list.component.html',
  styleUrls: ['../../common/entity/entity-list/entity-list.component.css']
})
export class InterfacesListComponent extends EntityListComponent {

  protected resource_name: string = 'network/interface/';
  protected route_add: string[] = ['interfaces', 'add']
  protected route_edit: string[] = ['interfaces', 'edit']

  constructor(_rest: RestService, _router: Router, _state: GlobalState) {
    super(_rest, _router, _state);
  }

  public columns:Array<any> = [
    {title: 'Interface', name: 'int_interface'},
    {title: 'Name', name: 'int_name'},
    {title: 'Media Status', name: 'int_media_status'},
    {title: 'DHCP', name: 'int_dhcp'},
    {title: 'IPv4 Addresses', name: 'ipv4_addresses'},
    {title: 'IPv6 Addresses', name: 'ipv6_addresses'},
  ];
  public config:any = {
    paging: true,
    sorting: {columns: this.columns},
  };

  rowValue(row, attr) {
    if(attr == 'ipv4_addresses' || attr == 'ipv6_addresses') {
      return row[attr].join(', ');
    }
    return row[attr];
  }

}

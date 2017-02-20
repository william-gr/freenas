import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../global.state';
import { RestService } from '../../../services/rest.service';

import { EntityListComponent } from '../../common/entity/entity-list/index';

@Component({
  selector: 'app-volumes-list',
  templateUrl: '../../common/entity/entity-list/entity-list.component.html',
  styleUrls: ['../../common/entity/entity-list/entity-list.component.css']
})
export class VolumesListComponent extends EntityListComponent {

  protected resource_name: string = 'storage/volume/';
  protected route_add: string[] = ['volumes', 'manager'];

  constructor(_rest: RestService, _router: Router, _state: GlobalState) {
    super(_rest, _router, _state);
  }

  public columns:Array<any> = [
    {title: 'Name', name: 'vol_name'},
    {title: 'Status', name: 'status'},
  ];
  public config:any = {
    paging: true,
    sorting: {columns: this.columns},
  };

}

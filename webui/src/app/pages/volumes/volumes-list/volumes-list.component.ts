import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../global.state';
import { RestService } from '../../../services/rest.service';

import { EntityListComponent } from '../../common/entity/entity-list/index';

import filesize from 'filesize.js';

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
    {title: 'Name', name: 'name'},
    {title: 'Status', name: 'status'},
    {title: 'Available', name: 'avail'},
    {title: 'Used', name: 'used'},
  ];
  public config:any = {
    paging: true,
    sorting: {columns: this.columns},
  };

  rowValue(row, attr) {
    switch(attr) {
      case 'avail':
        return filesize(row[attr]);
      case 'used':
        return filesize(row[attr]) + " (" + row['used_pct'] + ")";
      default:
        return row[attr];
    }
  }

}

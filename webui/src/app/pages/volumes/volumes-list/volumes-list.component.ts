import { Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../global.state';
import { RestService } from '../../../services/rest.service';

import filesize from 'filesize.js';

@Component({
  selector: 'app-volumes-list',
  template: `<entity-list [conf]="this"></entity-list>`
})
export class VolumesListComponent {

  protected resource_name: string = 'storage/volume/';
  protected route_add: string[] = ['volumes', 'manager'];

  constructor(_rest: RestService, _router: Router, _state: GlobalState, _eRef: ElementRef) {

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

  getActions(row) {
    if(row.vol_fstype == 'ZFS') {
      return [
        {
          label: "Add Dataset",
          onClick: (row) => {
            
          }
        }
      ]
    }
    return [];
  }

}

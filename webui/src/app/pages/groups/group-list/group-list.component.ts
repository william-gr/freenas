import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../global.state';
import { RestService } from '../../../services/rest.service';

import { EntityListComponent } from '../../common/entity/entity-list/index';

@Component({
  selector: 'app-group-list',
  templateUrl: '../../common/entity/entity-list/entity-list.component.html',
  styleUrls: ['../../common/entity/entity-list/entity-list.component.css']
})
export class GroupListComponent extends EntityListComponent {

  protected resource_name: string = 'account/groups/';
  protected route_add: string[] = ['groups', 'add']
  protected route_edit: string[] = ['groups', 'edit']

  constructor(_rest: RestService, _router: Router, _state: GlobalState) {
    super(_rest, _router, _state);
  }

  public columns:Array<any> = [
    {title: 'Group', name: 'bsdgrp_group'},
    {title: 'GID', name: 'bsdgrp_gid'},
    {title: 'Builtin', name: 'bsdgrp_builtin'},
  ];
  public config:any = {
    paging: true,
    sorting: {columns: this.columns},
  };


}

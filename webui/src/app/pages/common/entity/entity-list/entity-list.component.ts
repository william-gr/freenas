import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../../global.state';
import { RestService } from '../../../../services/rest.service';

@Component({
  moduleId: module.id,
  selector: 'app-entity-list',
  templateUrl: 'entity-list.component.html',
  styleUrls: ['entity-list.component.css']
})
export abstract class EntityListComponent implements OnInit {

  protected resource_name: string;
  protected route_add: string[];
  protected route_edit: string[];

  public rows:Array<any> = [];
  public columns:Array<any> = [];
  public page:number = 1;
  public itemsPerPage:number = 10;
  public maxSize:number = 5;
  public numPages:number = 1;
  public length:number = 0;
  public config:any = {
    paging: true,
    sorting: {columns: this.columns},
  };

  constructor(protected rest: RestService, protected router: Router, protected _state: GlobalState) { }

  ngOnInit() {
    this.getData();
  }

  getData() {
    let offset = this.itemsPerPage * (this.page - 1)
    let sort:Array<String> = [];
    let options:Object = new Object();

    for(let i in this.config.sorting.columns) {
      let col = this.config.sorting.columns[i];
      if(col.sort == 'asc') {
        sort.push(col.name);
      } else if(col.sort == 'desc') {
        sort.push('-' + col.name);
      }
    }

    //options = {limit: this.itemsPerPage, offset: offset};
    options = {limit: 0};
    if(sort.length > 0) {
      options['sort'] = sort.join(',');
    }

    this.rest.get(this.resource_name, options).subscribe((res) => {
      this.length = res.total;
      this.rows = res.data;
    });
  }

  onChangeTable(config, page:any = {page: this.page, itemsPerPage: this.itemsPerPage}) {
    if (config.filtering) {
      Object.assign(this.config.filtering, config.filtering);
    }
    if (config.sorting) {
      Object.assign(this.config.sorting, config.sorting);
    }
    this.page = page.page;
    this.getData();
  }

  doAdd() {
    this.router.navigate(new Array('/pages').concat(this.route_add));
  }

  doEdit(id) {
    this.router.navigate(new Array('/pages').concat(this.route_edit).concat(id));
  }

}

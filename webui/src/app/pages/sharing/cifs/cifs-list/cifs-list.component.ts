import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../../global.state';
import { RestService } from '../../../../services/rest.service';

@Component({
  selector: 'app-cifs-list',
  template: `<entity-list [conf]="this"></entity-list>`
})
export class CIFSListComponent {

  protected resource_name: string = 'sharing/cifs/';
  protected route_add: string[] = ['sharing', 'cifs', 'add'];
  protected route_edit: string[] = ['sharing', 'cifs', 'edit'];
  protected route_delete: string[] = ['sharing', 'cifs', 'delete'];

  constructor(_rest: RestService, _router: Router, _state: GlobalState) {

  }

  public columns: any[] = [
    { title: 'Name', name: 'cifs_name' },
    { title: 'Path', name: 'cifs_path' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

}

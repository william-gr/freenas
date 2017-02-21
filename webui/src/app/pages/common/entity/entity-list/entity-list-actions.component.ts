import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../../global.state';
import { RestService } from '../../../../services/rest.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-entity-list-actions',
  template: `
    <button *ngFor="let action of entity.getActions(this.row)" class="btn" (click)="action.onClick(this.row)">{{ action?.label }}</button>
  `
})
export class EntityListActionsComponent implements OnInit {

  @Input('entity') entity: any;
  @Input('row') row: any;

  ngOnInit() {
  }

}

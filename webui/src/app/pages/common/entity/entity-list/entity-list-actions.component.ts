import { Component, Input, OnInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../../global.state';
import { RestService } from '../../../../services/rest.service';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-entity-list-actions',
  template: `
    <a href>Edit</a> - <a href>Delete</a>
  `
})
export class EntityListActionsComponent implements OnInit {

  ngOnInit() {
  }

}

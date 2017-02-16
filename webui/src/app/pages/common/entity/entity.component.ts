import { Component, OnInit } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';
import { EntityListComponent } from './entity-list/index';

@Component({
  moduleId: module.id,
  selector: 'app-entity',
  templateUrl: 'entity.component.html',
  styleUrls: ['entity.component.css'],
  directives: [ROUTER_DIRECTIVES],
})
export class EntityComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {
  }

}

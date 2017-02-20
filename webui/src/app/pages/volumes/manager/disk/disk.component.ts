import { Component, ElementRef, Input, OnInit, Type } from '@angular/core';

@Component({
  selector: 'app-disk',
  template: `
  <ba-card>
    {{ data.devname }}
  </ba-card>
  `,
  styles: ['span { width: 120px; margin: 5px; padding: 2px; margin-top: 4px; }'],
})
export class DiskComponent implements OnInit {

  @Input() data: any;

  constructor(public elementRef:ElementRef) {
  }

  ngOnInit() {
  }

}

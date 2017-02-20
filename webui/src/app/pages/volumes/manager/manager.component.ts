import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';

import { DragulaService } from 'ng2-dragula';

import { WebSocketService, RestService } from '../../../services/';
import { DiskComponent } from './disk/';
import { VdevComponent } from './vdev/';

@Component({
  selector: 'app-manager',
  templateUrl: 'manager.component.html',
  styleUrls: [
    'manager.component.css',
  ],
  providers: [
    RestService,
  ],
})
export class ManagerComponent implements OnInit {

  public disks: Array<any>;
  public vdevs: any = {
    data: [
      {},
    ],
    cache: [],
    spare: [],
    log: []
  }
  public error: string;
  @ViewChildren(VdevComponent) vdevComponents: QueryList<VdevComponent>;
  @ViewChildren(DiskComponent) diskComponents: QueryList<DiskComponent>;

  private name: string;

  constructor(private rest: RestService, private ws: WebSocketService, private router: Router, private dragulaService: DragulaService) {
    dragulaService.setOptions('pool-vdev', {
      accepts: (el, target, source, sibling) => {
	return true;
      },
    });
    dragulaService.drag.subscribe((value) => {
      console.log(value);
    });
    dragulaService.drop.subscribe((value) => {
      let [bucket, diskDom, destDom, srcDom, _] = value;
      let disk, srcVdev, destVdev;
      this.diskComponents.forEach((item) => {
        if(diskDom == item.elementRef.nativeElement) {
          disk = item;
	}
      });
      this.vdevComponents.forEach((item) => {
        if(destDom.parentNode.parentNode == item.elementRef.nativeElement) {
          destVdev = item;
	} else if(srcDom.parentNode.parentNode == item.elementRef.nativeElement) {
          srcVdev = item;
	}
      });
      if(srcVdev) {
        srcVdev.removeDisk(disk);
      }
      if(destVdev) {
        destVdev.addDisk(disk);
      }
    });
    dragulaService.over.subscribe((value) => {
      console.log(value);
    });
    dragulaService.out.subscribe((value) => {
      console.log(value);
    });
  }

  ngOnInit() {
    this.ws.call("notifier.get_disks", [], (res) => {
      this.disks = []
      for(let i in res) {
        this.disks.push(res[i]);
      }
    });
  }

  addVdev(group) {
    this.vdevs[group].push({});
  }

  doSubmit() {
    this.error = null;

    let topology = {
        'data': [],
        'cache': [],
        'log': [],
        'spare': [],
    }
    this.vdevComponents.forEach((vdev) => {
      let disks = [];
      vdev.getDisks().forEach((disk) => {
	disks.push('/dev/' + disk.data.name);
      });
      topology[vdev.group].push({type: vdev.type, disks: disks});
    });
    this.rest.post("zpool", {
      body: JSON.stringify({
        name: this.name,
	topology: topology
      })
    }).subscribe((res) => {
    this.router.navigate(['/dashboard', 'pool']);
    }, (res) => {this.error = res.error.stacktrace});
  }

}

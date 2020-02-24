import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import {IpcService} from '../../services/ipc.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  fileDirectory: string = '';
  queueDirectory: string = '';

  machineName: String = '';
  panelInterval: number;

  constructor(private ipc: IpcService, private chRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.ipc.send('request-panel-interval', '');
    this.ipc.send('request-file-directory', '');
    // this.ipc.send('request-queue-directory', '');

    this.ipc.send('request-machine', '');

    this.ipc.on('new-directory', (event, arg) => {
      console.log('new custom? ', arg);
      if (arg || arg.length > 0) {
        if (arg.type === 'printer') {
          this.fileDirectory = arg.value;
        } else if (arg.type === 'queue') {
          this.queueDirectory = arg.value;
        }

        console.log('destroyed? ', this.chRef['destroyed']);
        if (!this.chRef['destroyed']) {
          this.chRef.detectChanges();
      }
        // this.chRef.detectChanges(); // change detection outside of an angular zone. possibly useful on other this.ipc
      } else {
        console.log('no custom directory');
      }
    })

    this.ipc.on('machine-name', (event, arg) => {
      if (arg && arg.length > 0) {
        this.machineName = arg;         
        if (!this.chRef['destroyed']) {
          this.chRef.detectChanges();
      }
      } else {
        console.log('no machine name');
      }
    })

    this.ipc.on('new-panel-interval', (event, arg) => {
      console.log('new panel interval?', arg);
      this.panelInterval = arg;
      if (!this.chRef['destroyed']) {
        this.chRef.detectChanges();
    }
    });

  }

 
  updateFileDirectory() {
    if (confirm('Change default file directory to ' + this.fileDirectory + '?')) {
      this.ipc.send('update-file-directory', this.fileDirectory);
    }
  }

  updateQueueDirectory() {
    if (confirm('Change default queue directory to ' + this.queueDirectory + '?')) {
      this.ipc.send('update-file-directory', this.queueDirectory);
    }
  }

  updateCronTimeout() {
    this.ipc.send('update-panel-interval', this.panelInterval);
  }

  ngOnDestroy() {
    this.chRef.detach();
  }

}

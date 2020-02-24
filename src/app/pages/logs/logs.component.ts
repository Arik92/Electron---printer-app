import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import {IpcService} from '../../services/ipc.service';
import * as moment from 'moment';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit, OnDestroy {
  logInterval;
  logs: any[] = [];
  showLogs: boolean = false;
  cronFlag: boolean = false;
  logType: string = '';
  panelInterval: number;
  constructor(private ipc: IpcService, private chRef: ChangeDetectorRef) {    
   }  

  ngOnInit() {
    this.ipc.send('request-panel-interval', '');
    this.ipc.send('request-panel-cron', '');    

      this.ipc.on('panel-cron-update', (event, arg) => {
        console.log('cron flag changed to ', arg);
        this.cronFlag = arg;
        if (!this.chRef['destroyed']) {
          this.chRef.detectChanges();
      }
      });

      this.ipc.on('new-panel-interval', (event, arg) => {
        this.panelInterval = arg;
        if (!this.chRef['destroyed']) {
          this.chRef.detectChanges();
      }
      });      
      this.ipc.on('new-log', (event, arg) => {
        arg.formattedDate = moment(arg.Date).format('YYYY/MM/DD HH:mm:ss');
        this.logs.unshift(arg);
        if (this.logs.length > 100) {
          this.logs.splice(this.logs.length - 1, 1);
        }
        if (!this.chRef['destroyed']) {
          this.chRef.detectChanges();
      }
      })
  }

  setLogType(type) {
    this.logType = type;
  }
  updateFiles() {
    this.ipc.send('update-files');
  }

  cancelCron() {
    this.ipc.send('update-panel-cron', false);
  }
  
  ngOnDestroy(){
    this.chRef.detach();
    // clearInterval(this.logInterval);
  }

}

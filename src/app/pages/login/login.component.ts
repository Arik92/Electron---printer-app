import { Component, ChangeDetectorRef, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import {IpcService} from '../../services/ipc.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  login: any = {};  
  incorrectCreds: boolean = false;

  constructor(private ipc: IpcService ,private router: Router, private chRef: ChangeDetectorRef, private zone: NgZone) { }

  ngOnInit() {
    this.login = {
      username: '',
      password: ''
    };
    this.ipc.on('loginAnswer', (event, arg) => {
      console.log('login answer? ', arg)
      if (arg) {
        this.zone.run(() => {
          this.router.navigate(['/admin/app']); //success
        });
        }        
        else {
          this.incorrectCreds = true;
          if (!this.chRef['destroyed']) {
            this.chRef.detectChanges();
        }
        }      
    });    
  }

  ngOnDestroy() {
    this.chRef.detach();
  }

  attemptLogin() {
    console.log('attempting login?');
    this.ipc.send('attemptLogin', this.login);
  }
  

}

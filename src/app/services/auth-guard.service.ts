import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

import { IpcService } from './ipc.service';
@Injectable()
export class AuthGuardService implements CanActivate {
  loggedState: boolean = false;
  constructor(private ipc: IpcService , private router: Router) {}
   canActivate(): boolean {
     /////////////////////// DISCONTINUED - There's no visible/modifiable route on the electron app **************************///////////////////////


    // this.ipc.send('isLoggedIn', '');
    // this.ipc.on('currentLoginState', (event, arg) => {
    //   return arg.isLoggedIn;
    //   })     
    // if (!this.auth.isAuthenticated()) {
    //   this.router.navigate(['login']);
    //   return false;
    // } else {
    //   return true;
    // }

    // ask the ipc 
    return true;
  }
}
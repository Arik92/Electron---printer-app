import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LogService {
    /** You know what? on second thought this might not be needed
     * if all communication goes through the ipc, I wouldnt need routes neither. so routes and services are obsolete
     */


  constructor() {  }
  public getLogs() {
      /**api request to get logs */
  }
    

}

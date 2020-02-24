import { Component, OnInit } from '@angular/core';
import {IpcService} from '../services/ipc.service';



export interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
}

const adminPrefix = '/admin';
export const ROUTES: RouteInfo[] = [
    { path: adminPrefix + '/app',       title: 'App',    icon:'nc-button-play', class: '' },
    { path: adminPrefix + '/settings', title: 'Settings', icon: 'nc-settings-gear-65', class: '' },
    // { path: adminPrefix + '/queue', title: 'Queue', icon: 'nc-settings-gear-65', class: '' },

    // { path: adminPrefix + '/dashboard',     title: 'Dashboard',         icon:'nc-bank',       class: '' },
    // { path: adminPrefix + '/icons',         title: 'Icons',             icon:'nc-diamond',    class: '' },
    // { path: '/maps',          title: 'Maps',              icon:'nc-pin-3',      class: '' },
    // { path: adminPrefix + '/notifications', title: 'Notifications',     icon:'nc-bell-55',    class: '' },
    // { path: adminPrefix + '/user',          title: 'User Profile',      icon:'nc-single-02',  class: '' },
    // { path: adminPrefix + '/table',         title: 'Table List',        icon:'nc-tile-56',    class: '' }
    // { path: '/typography',    title: 'Typography',        icon:'nc-caps-small', class: '' },
    // { path: '/upgrade',       title: 'Upgrade to PRO',    icon:'nc-spaceship',  class: 'active-pro' },   
];

@Component({
    moduleId: module.id,
    selector: 'sidebar-cmp',
    templateUrl: 'sidebar.component.html',
})

export class SidebarComponent implements OnInit {
    public menuItems: any[];

    constructor(private ipc: IpcService) {}
    ngOnInit() {
        this.menuItems = ROUTES.filter(menuItem => menuItem);
    }
    exit() {
        // const exitSure = confirm("Exit Application? ");
        // if (exitSure) {
            this.ipc.send('exit');
        // }
    }
}

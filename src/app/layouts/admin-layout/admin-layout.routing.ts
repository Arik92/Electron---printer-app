import { Routes } from '@angular/router';

import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { UserComponent } from '../../pages/user/user.component';
import { TableComponent } from '../../pages/table/table.component';
import { TypographyComponent } from '../../pages/typography/typography.component';
import { IconsComponent } from '../../pages/icons/icons.component';
import { NotificationsComponent } from '../../pages/notifications/notifications.component';
import {LogsComponent} from '../../pages/logs/logs.component';
import { PrinterDashboardComponent } from '../../pages/printer-dashboard/printer-dashboard.component';
import { SettingsComponent } from '../../pages/settings/settings.component';
import {LoginComponent} from '../../pages/login/login.component';
import {QueueComponent} from '../../pages/queue/queue.component';

export const AdminLayoutRoutes: Routes = [
    // { path: 'dashboard',      component: DashboardComponent },
    // { path: 'user',           component: UserComponent },
    // { path: 'table',          component: TableComponent },
    { path: 'app',        component: LogsComponent },
    { path: 'settings' , component: SettingsComponent },
    { path: 'queue', component: QueueComponent },
    // {path: 'login' , component: LoginComponent },
    // { path: 'typography',     component: TypographyComponent },
    { path: 'icons',          component: IconsComponent }
    // { path: 'notifications',  component: NotificationsComponent },
];

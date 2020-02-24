import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminLayoutRoutes } from './admin-layout.routing';

import { DashboardComponent }       from '../../pages/dashboard/dashboard.component';
import { UserComponent }            from '../../pages/user/user.component';
import { TableComponent }           from '../../pages/table/table.component';
// import { TypographyComponent }      from '../../pages/typography/typography.component';
import { IconsComponent }           from '../../pages/icons/icons.component';
// import { NotificationsComponent }   from '../../pages/notifications/notifications.component';

import { PrinterDashboardComponent } from '../../pages/printer-dashboard/printer-dashboard.component'
import { SettingsComponent } from '../../pages/settings/settings.component';
import { LogsComponent } from '../../pages/logs/logs.component';
import { QueueComponent } from '../../pages/queue/queue.component';


// import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule
    // NgbModule
  ],
  declarations: [
    DashboardComponent,
    UserComponent,
    TableComponent,
    IconsComponent,
    PrinterDashboardComponent,
    SettingsComponent, 
    LogsComponent,
    QueueComponent
    // NotificationsComponent,
  ]
})

export class AdminLayoutModule {}

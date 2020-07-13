import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Routes
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';

// Guards
import { AuthGuard } from './shared/guards/auth.guard';
import { LoginRedirectGuard } from './shared/guards/login-redirect.guard';
import { InviteComponent } from './invite/invite.component';
import { RegisterComponent } from './register/register.component';
import { RequestAccessComponent } from './request-access/request-access.component';
import { RequestAccessNhsComponent } from './request-access/request-access-nhs/request-access-nhs.component';
import { RequestAccessGeneralComponent } from './request-access/request-access-general/request-access-general.component';
import { ValidateInviteGuard } from './shared/guards/validate-invite.guard';

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginRedirectGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [ValidateInviteGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'invite',
    component: InviteComponent,
  },
  {
    path: 'request-access',
    component: RequestAccessComponent,
    children: [
      { path: 'nhs', component: RequestAccessNhsComponent },
      { path: 'general', component: RequestAccessGeneralComponent },
    ],
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

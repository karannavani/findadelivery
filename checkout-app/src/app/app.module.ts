import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule, SETTINGS } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { environment } from '../environments/environment';
import { NgxPageScrollCoreModule } from 'ngx-page-scroll-core';
import { NgxPageScrollModule } from 'ngx-page-scroll';
import { AppRoutingModule } from './app-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { HeaderComponent } from './header/header.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { FooterComponent } from './footer/footer.component';
import { InviteComponent } from './invite/invite.component';
import { RegisterComponent } from './register/register.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DashboardComponent,
    LoginComponent,
    HeaderComponent,
    FooterComponent,
    InviteComponent,
    RegisterComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule, // imports firebase/firestore, only needed for database features
    AngularFireAuthModule, // imports firebase/auth, only needed for auth features
    ReactiveFormsModule,
    NgxPageScrollCoreModule.forRoot({}),
    NgxPageScrollModule,
  ],
  providers: [
    AuthGuard,
    Title,
    // {
    //   provide: SETTINGS,
    //   useValue: environment.production
    //   ? undefined
    //   : {
    //     host: 'localhost:8080',
    //     ssl: false,
    //   },
    // }, // K.N – let's just toggle this flag manually for when we want to use local server,
    // will need to investigate why it's not working in production
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

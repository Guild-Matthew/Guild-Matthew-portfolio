import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app';
import { DashboardComponent } from './components/dashboard/dashboard';
import { SetDetailComponent } from './components/set-detail/set-detail';
import { CreateSetComponent } from './components/create-set/create-set';
import { LearnComponent } from './components/learn/learn';
import { MatchComponent } from './components/match/match';
import { TestSetupComponent } from './components/test-setup/test-setup';
import { TestTakeComponent } from './components/test-take/test-take';
import { EditCardComponent } from './components/edit-card/edit-card';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    SetDetailComponent,
    CreateSetComponent,
    LearnComponent,
    MatchComponent,
    TestSetupComponent,
    TestTakeComponent,
    EditCardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
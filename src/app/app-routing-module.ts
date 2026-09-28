import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { SetDetailComponent } from './components/set-detail/set-detail';
import { CreateSetComponent } from './components/create-set/create-set';
import { LearnComponent } from './components/learn/learn';
import { MatchComponent } from './components/match/match';
import { TestSetupComponent } from './components/test-setup/test-setup';
import { TestTakeComponent } from './components/test-take/test-take';
import { EditCardComponent } from './components/edit-card/edit-card';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'create-set', component: CreateSetComponent },
  { path: 'set/:id', component: SetDetailComponent },
  { path: 'learn/:setId', component: LearnComponent },
  { path: 'match/:setId', component: MatchComponent },
  { path: 'test-setup/:setId', component: TestSetupComponent },
  { path: 'test/:setId', component: TestTakeComponent },
  { path: 'edit/:setId/:cardId', component: EditCardComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
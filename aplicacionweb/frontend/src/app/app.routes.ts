import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Patients } from './pages/patients/patients';
import { PatientDetail } from './pages/patient-detail/patient-detail';
import { Alerts } from './pages/alerts/alerts';
import { Settings } from './pages/settings/settings';
import { TestDetail } from './pages/test-detail/test-detail';
import { Login } from './pages/login/login';
import { Profile } from './pages/profile/profile';
import { Doctors } from './pages/doctors/doctors';
import { DoctorPatients } from './pages/doctor-patients/doctor-patients';
import { Register } from './pages/login/register';

import { LayoutComponent } from './components/layout/layout.component';
import { authGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard, data: { breadcrumb: 'bc_dashboard' } },
      {
        path: 'patients',
        data: { breadcrumb: 'bc_patients' },
        children: [
          { path: '', component: Patients },
          { path: 'detail/:id', component: PatientDetail, data: { breadcrumb: 'bc_patient_detail' } }
        ]
      },
      { path: 'alerts', component: Alerts, data: { breadcrumb: 'bc_alerts' } },
      { path: 'profile', component: Profile, data: { breadcrumb: 'bc_profile' } },
      { path: 'test-detail', component: TestDetail, data: { breadcrumb: 'bc_test_detail' } },
      {
        path: 'doctors',
        component: Doctors,
        canActivate: [roleGuard],
        data: { breadcrumb: 'Gestión de Médicos', roles: ['ADMIN'] }
      },
      {
        path: 'doctor-patients',
        component: DoctorPatients,
        canActivate: [roleGuard],
        data: { breadcrumb: 'Asignación de Pacientes', roles: ['ADMIN'] }
      },
    ]
  },
];

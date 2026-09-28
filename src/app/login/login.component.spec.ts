import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginComponent } from './login.component';
import { Meta } from '@angular/platform-browser';
import { createSsrRenderState, SSR_RENDER_STATE, SsrRenderState } from '../ssr-render-state';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let ssrRenderState: SsrRenderState;

  beforeEach(async () => {
    ssrRenderState = createSsrRenderState();
    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule],
      providers: [
        { provide: Auth, useValue: {} },
        { provide: SSR_RENDER_STATE, useValue: ssrRenderState }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks the login page as noindex', () => {
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, nofollow');
    expect(ssrRenderState.cacheable).toBeFalse();
  });
});

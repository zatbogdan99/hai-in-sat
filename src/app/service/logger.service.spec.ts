import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let originalProduction: boolean;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggerService);
    originalProduction = environment.production;
  });

  afterEach(() => {
    environment.production = originalProduction;
  });

  it('forwards log, warn and error messages in development', () => {
    environment.production = false;
    const logSpy = spyOn(console, 'log');
    const warnSpy = spyOn(console, 'warn');
    const errorSpy = spyOn(console, 'error');
    const details = { value: 1 };

    service.log('log message', details);
    service.warn('warn message', details);
    service.error('error message', details);

    expect(logSpy).toHaveBeenCalledWith('log message', details);
    expect(warnSpy).toHaveBeenCalledWith('warn message', details);
    expect(errorSpy).toHaveBeenCalledWith('error message', details);
  });

  it('suppresses log and warn messages in production but keeps errors', () => {
    environment.production = true;
    const logSpy = spyOn(console, 'log');
    const warnSpy = spyOn(console, 'warn');
    const errorSpy = spyOn(console, 'error');

    service.log('log message');
    service.warn('warn message');
    service.error('error message');

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('error message');
  });
});

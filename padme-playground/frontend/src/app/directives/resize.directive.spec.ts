import { ElementRef } from '@angular/core';
import { ResizeDirective } from './resize.directive';

describe('ResizeDirective', () => {
  it('should create an instance', () => {
    const el = new ElementRef<HTMLElement>(document.createElement('div'));
    const directive = new ResizeDirective(el);
    expect(directive).toBeTruthy();
  });
});

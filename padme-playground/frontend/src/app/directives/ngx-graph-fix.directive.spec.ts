import { NgxGraphFixDirective } from './ngx-graph-fix.directive';
import { GraphComponent } from '@swimlane/ngx-graph';

describe('NgxGraphFixDirective', () => {
  describe('NgxGraphFixDirective', () => {
    it('should create an instance', () => {
      const directive = new NgxGraphFixDirective({} as GraphComponent); // pass in an empty object as a placeholder argument
      expect(directive).toBeTruthy();
    });
  });
});

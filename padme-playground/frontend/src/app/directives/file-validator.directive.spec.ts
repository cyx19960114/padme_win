import { FileManager } from '../services/file-manager';
import { FileValidatorDirective } from './file-validator.directive';

describe('FileValidatorDirective', () => {
  it('should create an instance', () => {
    const fileManager = new FileManager();
    const directive = new FileValidatorDirective(fileManager);
    expect(directive).toBeTruthy();
  });
});

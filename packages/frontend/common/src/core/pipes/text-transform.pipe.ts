import { Pipe, PipeTransform } from '@angular/core';

import { StringUtil } from '../../utils/string/string.util';

@Pipe({
  name: 'textTransform',
  standalone: true,
  pure: true
})
export class TextTransformPipe implements PipeTransform {
  transform (
    value: string | null | undefined,
    transformation: 'capitalize' | 'camelCase' | 'kebabCase' | 'snakeCase' | 'slugify' | 'truncate' = 'capitalize',
    ...args: unknown[]
  ): string {
    if (!value) return '';

    switch (transformation) {
      case 'capitalize':
        return StringUtil.capitalize(value);
      case 'camelCase':
        return StringUtil.camelCase(value);
      case 'kebabCase':
        return StringUtil.kebabCase(value);
      case 'snakeCase':
        return StringUtil.snakeCase(value);
      case 'slugify':
        return StringUtil.slugify(value);
      case 'truncate': {
        const length = typeof args[0] === 'number' ? args[0] : 50;
        const suffix = typeof args[1] === 'string' ? args[1] : '...';
        return StringUtil.truncate(value, length, suffix);
      }
      default:
        return value;
    }
  }
}

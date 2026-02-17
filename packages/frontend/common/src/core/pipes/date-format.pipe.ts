import { Pipe, PipeTransform } from '@angular/core';

import { DateUtil } from '../../utils/date/date.util';

@Pipe({
  name: 'dateFormat',
  standalone: true,
  pure: true
})
export class DateFormatPipe implements PipeTransform {
  transform (value: Date | string | null | undefined, format = 'yyyy-MM-dd'): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';
    return DateUtil.format(date, format);
  }
}

import { ParserFn, ParserType } from '../../types/common/util.type';

export const parsers: Record<ParserType, ParserFn> = {
  boolean: v => v.toLowerCase() === 'true',
  number: (v, def) => {
    const n = Number(v);
    return isNaN(n) ? def : n;
  },
  string: v => v
};

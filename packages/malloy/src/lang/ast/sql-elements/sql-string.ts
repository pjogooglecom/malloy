/*
 * Copyright 2023 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {SQLPhrase} from '../../../model/malloy_types';

import {QueryElement, isQueryElement} from '../types/query-element';
import {MalloyElement} from '../types/malloy-element';

type SQLStringSegment = string | QueryElement;
export class SQLString extends MalloyElement {
  elementType = 'sqlString';
  elements: SQLStringSegment[] = [];
  containsQueries = false;

  complete() {
    this.has({
      queries: this.elements.filter(isMalloyElement),
    });
  }

  push(el: string | MalloyElement): void {
    if (typeof el === 'string') {
      if (el.length > 0) {
        this.elements.push(el);
      }
    } else if (isQueryElement(el)) {
      this.elements.push(el);
      this.containsQueries = true;
      el.parent = this;
    } else {
      el.log('This element is not legal inside an SQL string');
    }
  }

  sqlPhrases(): SQLPhrase[] {
    return this.elements.map(el => {
      if (typeof el === 'string') {
        return {sql: el};
      }
      return el.query();
    });
  }
}

function isMalloyElement(x: SQLStringSegment): x is QueryElement {
  return typeof x !== 'string' && isQueryElement(x);
}

/*
 * Copyright 2022 Google LLC
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 */
import { Result, Runtime } from "@malloydata/malloy";

interface InitValues {
  sql?: string;
  malloy?: string;
}

export function mkSqlEqWith(runtime: Runtime, initV?: InitValues) {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  return async function (
    expr: string,
    result: string | boolean
  ): Promise<Result> {
    const qExpr = expr.replace(/'/g, "`");
    const sqlV = initV?.sql || "SELECT 1 as one";
    const malloyV = initV?.malloy || "";
    const sourceDef = `
      sql: sqlData is || ${sqlV} ;;
      source: basicTypes is from_sql(sqlData) ${malloyV}
    `;
    let query: string;
    if (typeof result == "boolean") {
      const notEq = `concat('sqlEq failed', CHR(10), '    Expected: ${qExpr} to be ${result}')`;
      const varName = result ? "expectTrue" : "expectFalse";
      const whenPick = result
        ? `'=' when ${varName}`
        : `${notEq} when ${varName}`;
      const elsePick = result ? notEq : "'='";
      query = `${sourceDef}
          query: basicTypes
          -> { project: ${varName} is ${expr} }
          -> {
            project: calc is pick ${whenPick} else ${elsePick}
          }`;
    } else {
      const qResult = result.replace(/'/g, "`");
      query = `${sourceDef}
          query: basicTypes
          -> {
            project: expect is ${result}
            project: got is ${expr}
          } -> {
            project: calc is
              pick '=' when expect = got
              else concat('sqlEq failed', CHR(10), '    Expected: ${qExpr} == ${qResult}', CHR(10), '    Received: ', got::string)
          }`;
    }
    return runtime.loadQuery(query).run();
  };
}

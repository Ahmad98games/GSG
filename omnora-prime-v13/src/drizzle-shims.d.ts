declare module 'drizzle-orm/sqlite-core' {
  export const sqliteTable: (name: string, columns: any, extraConfig?: (table: any) => any) => any;
  export const text: any;
  export const integer: any;
  export const blob: any;
  export const index: any;
  export const uniqueIndex: any;
}

declare module 'drizzle-orm/pg-core' {
  export const pgTable: (name: string, columns: any, extraConfig?: (table: any) => any) => any;
  export const uuid: any;
  export const text: any;
  export const timestamp: any;
  export const numeric: any;
  export const unique: any;
}

declare module 'drizzle-orm' {
  export const sql: any;
  export const eq: any;
  export const and: any;
  export const or: any;
  export const relations: any;
  export const desc: any;
  export const asc: any;
  export const like: any;
  export const not: any;
  export const inArray: any;
  export const notInArray: any;
  export const isNull: any;
  export const isNotNull: any;
  export const gt: any;
  export const gte: any;
  export const lt: any;
  export const lte: any;
  export const ne: any;
  export const between: any;
}

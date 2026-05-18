type GobyFieldMap = {
    "string":string;
    "boolean":boolean;
    "select":string[];
}

export type GobyFieldType = keyof GobyFieldMap;

type GobyField = {
    [T in GobyFieldType]: {
        name:string;
        key:string;
        base?:boolean;
        type:T;
        value:GobyFieldMap[T];
    } & (T extends "select" ? {
        max:number;
    } : {})
}[GobyFieldType]
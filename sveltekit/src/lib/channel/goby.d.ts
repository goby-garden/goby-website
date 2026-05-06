type GobyFieldMap = {
    "string":string;
    "boolean":boolean;
    "tags":string[];
}

export type GobyFieldType = keyof GobyFieldMap;

type GobyField = {
    [T in GobyFieldType]: {
        name:string;
        base?:boolean;
        type:T;
        value:GobyFieldMap[T];
    }
}[GobyFieldType]
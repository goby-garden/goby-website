type GobyFieldMap = {
    "string": string;
    "boolean": boolean;
    "select": string[];
}

export type GobyFieldDefinition = {
    [T in GobyFieldType]: {
        name: string;
        key: string;
        type: T;
    } & (T extends "select" ? {
        max: number;
    } : {})
}


export type GobyFieldType = keyof GobyFieldMap;

export type GobyField = {
    [T in GobyFieldType]:
    GobyFieldDefinition[T] & {
        base?: boolean;
        value: GobyFieldMap[T] | null;
    }
}[GobyFieldType];


export type GobySchema = {
    fields: {
        [T in GobyFieldType]:
        GobyFieldDefinition[T] & {
            values?: Record<string, GobyFieldMap[T] | undefined>
        }
    }[GobyFieldType][]
}
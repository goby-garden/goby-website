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
        max: 'single' | 'multiple';
        options:{
            name:string;
            color?:string;
        }[]
    } : {})
}


export type GobyFieldType = keyof GobyFieldMap;

export type GobyField = {
    [T in GobyFieldType]:
    GobyFieldDefinition[T] & {
        canon?: boolean;
        value: GobyFieldMap[T] | null;
    }
}[GobyFieldType];


export type GobySchema = {
    /** Definitions for each custom field on blocks in this channel */
    fields: {
        [T in GobyFieldType]:
        GobyFieldDefinition[T] & {
            /** Optionally save block field values, indexed by block ID. Only recorded here if not authenticated. */
            values?: Record<string, GobyFieldMap[T] | undefined | null>
        }
    }[GobyFieldType][];

    /** Optionally override the default are.na title/description. Only recorded here if not authenticated.  */
    overrides?:{
        title:{
            /** indexed by block ID */
            values:Record<string,string>
        },
        description:{
            /** indexed by block ID */
            values:Record<string,string>
        }
    },
    preferences:{
        namespace_keys?:boolean;
    }
}
import type { GobyField, GobyFieldMap, GobyFieldType } from '$lib/channel_v2/goby';

export type FieldBinding = {
[T in GobyFieldType]:
    {
        type:T
        getValue?: ()=> GobyFieldMap[T] | null;
    }
}[GobyFieldType] & {
    changed:boolean;
    key:string;
}
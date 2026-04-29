import { marked } from "marked";

export default function parse(str:string){
    const highlight_match = /==(.*?)==/gm;
    let parsed:string=marked(str) as string;
    return parsed.replace(highlight_match, '<mark>$1</mark>');
}
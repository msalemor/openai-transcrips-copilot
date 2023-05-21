export interface ISectionInfo {
    index: number;
    content: string;
    words: number;
    characters: number;
    tokens: number;
    summary: string;
}

export interface ISettings {
    max_tokens: string;
    temperature: string;
    chunk_size: string;
}

export interface IContent {
    content: string;
}

export interface IMessage {
    role: string;
    content: string;
}

export interface ISummariesRequest {
    max_tokens: number;
    temperature: number;
    messages: IMessage[];
    sections: ISectionInfo[];
}

export interface ISummariesResponse {
    index: number;
    summary: string;
}

export interface ISummaryRequest {
    max_tokens: number;
    temperature: number;
    messages: IMessage[];
    summaries: ISummariesResponse[];
}

export interface ISummaryRespose {
    summary: string;
}

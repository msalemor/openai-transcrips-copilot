import axios from "axios";
import { ISectionInfo, ISettings, IContent, ISummariesRequest, ISummariesResponse, ISummaryRequest, ISummaryRespose } from "../interfaces";

const config = {
    headers: {
        'Content-Type': 'application/json',
    }
}

async function PromiseAllAxiosAsync(promises: any[]) {
    return await axios.all(promises);
}

function AxiosGetPromise(url: string) {
    return axios.get(url);
}

function AxiosPostPromise(url: string, payload: any) {
    return axios.post(url, payload, config);
}

export async function PostSectionsAsync(payload: IContent) {
    const url = "/api/sections";
    const promise = AxiosPostPromise(url, payload);
    const responses = await PromiseAllAxiosAsync([promise]);
    return responses[0].data as ISectionInfo[];
}

export async function PostSummariesAsync(payload: ISummariesRequest) {
    const url = "/api/summaries";
    const promise = AxiosPostPromise(url, payload);
    const responses = await PromiseAllAxiosAsync([promise]);
    return responses[0].data as ISummariesResponse[];
}

export async function PostSummaryAsync(payload: ISummaryRequest) {
    const url = "/api/summary";
    const promise = AxiosPostPromise(url, payload);
    const responses = await PromiseAllAxiosAsync([promise]);
    return responses[0].data as ISummaryRespose;
}

export async function GetSettingsAsync() {
    const url = "/api/settings";
    const promise = AxiosGetPromise(url);
    const responses = await PromiseAllAxiosAsync([promise]);
    return responses[0].data as ISettings;
}

export async function PostSettingsAsync(payload: any) {
    const url = "/api/settings";
    const promise = AxiosPostPromise(url, payload);
    const responses = await PromiseAllAxiosAsync([promise]);
    return responses[0].data as ISettings;
}
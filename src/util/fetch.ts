import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { defaultsDeep } from 'lodash';

export const ENDPOINT = 'api.beta.riotchat.gq';

export default function get(method: 'get' | 'post', url: string, opt: AxiosRequestConfig = {}): Promise<AxiosResponse> {
	return axios(url, defaultsDeep(opt, <AxiosRequestConfig> {
		method,
		baseURL: 'http://' + ENDPOINT + '/api/v1',
	}));
}
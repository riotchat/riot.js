import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { defaultsDeep } from 'lodash';

export const ENDPOINT = '86.11.153.158:3000';

export default function get(method: 'get' | 'post', url: string, opt: AxiosRequestConfig = {}): Promise<AxiosResponse> {
	return axios(url, defaultsDeep(opt, <AxiosRequestConfig> {
		method,
		baseURL: 'http://' + ENDPOINT + '/api/v1',
	}));
}
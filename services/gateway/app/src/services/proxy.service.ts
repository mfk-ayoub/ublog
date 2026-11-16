import { HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';  // ✅ Add this import

@Injectable()
export class ProxyService {
	constructor(private httpService: HttpService) { }

	readonly serviceUrls = {
		auth: process.env.AUTH_SERVICE_URL,
		articles: process.env.ARTICLES_SERVICE_URL,
		users: process.env.USERS_SERVICE_URL,
		ai: process.env.AI_SERVICE_URL,
	};

	async forwardRequest(
		service: 'auth' | 'articles' | 'users' | 'ai',
		path: string,
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
		data?: any,
		headers?: any,
		options?: { responseType?: 'text'; timeout?: number },
	) {
		const url = `${this.serviceUrls[service]}${path}`;
		if (service === 'ai') {
			let key: string | undefined;
			try {
				key = process.env.AI_SERVICE_API_KEY_FILE
					? readFileSync(process.env.AI_SERVICE_API_KEY_FILE, 'utf8').trim()
					: process.env.AI_SERVICE_API_KEY;
			} catch {
				throw new ServiceUnavailableException('AI service credentials are not configured');
			}
			if (!key || key.length < 32)
				throw new ServiceUnavailableException('AI service credentials are not configured');
			headers = { ...headers, 'X-AI-Service-Key': key };
		}

		try {
			const response = await firstValueFrom(
				this.httpService.request({
					method,
					url,
					data,
					headers,
					responseType: options?.responseType,
					timeout: options?.timeout,
				}),
			);
			return response.data;
		} catch (error) {
			if (service === 'ai') {
				const status = error.response?.status;
				const messages: Record<number, string> = {
					403: 'Content is unsafe.',
					404: 'Article not found.',
					422: 'Invalid AI request.',
					429: 'Daily request limit reached. Try again tomorrow.',
					503: 'AI service is temporarily unavailable. Retry the request.',
				};
				throw new HttpException(messages[status] || 'AI service is temporarily unavailable.', messages[status] ? status : 502);
			}
			throw error.response?.data || error;
		}
	}

	async forwardBinaryRequest(
		service: 'auth' | 'articles' | 'users',
		path: string,
		method: 'GET' | 'POST' = 'GET',
	) {
		const url = `${this.serviceUrls[service]}${path}`;

		try {
			const response = await firstValueFrom(
				this.httpService.request({
					method,
					url,
					responseType: 'stream',
				}),
			);

			return {
				stream: response.data,
				contentType: response.headers['content-type'] || 'application/octet-stream',
				contentLength: response.headers['content-length'],
			};
		} catch (error) {
			throw error.response?.data || error;
		}
	}
}
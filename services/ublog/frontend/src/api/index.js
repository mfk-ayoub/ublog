import axios from 'axios';
import { getCookie } from '../utils/cookie';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({
	baseURL: BASE_URL,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	},
});

// Attach JWT from Authorization cookie to every request
api.interceptors.request.use((config) => {
	const authCookie = getCookie('Authorization');
	if (authCookie) {
		config.headers.Authorization = authCookie;
	}
	return config;
});

// Auth
export const login = (data) => api.post('/auth/login', data);
export const signup = (data) => api.post('/auth/signup', data);
export const changePassword = (data) => api.post('/auth/password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

// Articles – public / feed
export const getAllArticles = () => api.post('/article/all');
export const getArticlesByAuthor = (author, page = 1) =>
	api.get(`/article/by/${author}?page=${page}`);
export const getArticle = (slug) => api.get(`/article/${slug}`);
export const getArticleById = (id) => api.get(`/article/id/${id}`);
export const getArticleComments = (slug, page = 1) =>
	api.get(`/article/${slug}/comments`, { params: { page } });
export const getArticlePictureUrl = (slug) =>
	`${BASE_URL}/article/${slug}/picture`;

// Articles – authenticated user
export const getMyArticles = () => api.get('/article/all');
export const createArticle = () => api.post('/article/create');
export const updateArticle = (id, data) => api.patch(`/article/${id}`, data);
export const publishArticle = (id) => api.patch(`/article/${id}/publish`);
export const deleteArticle = (id) => api.delete(`/article/${id}`);
export const uploadArticlePicture = (id, formData) =>
	api.post(`/article/${id}/picture`, formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
export const deleteArticlePicture = (id) => api.delete(`/article/${id}/pic`);
export const writeComment = (slug, data) =>
	api.post(`/article/${slug}/comments`, data);
export const addCategoryToArticle = (id, data) =>
	api.post(`/article/${id}/category`, data);

// Views
export const recordArticleView = (slug) =>
	api.post(`/article/${slug}/view`);

// Saves & Likes
export const getMySaves = () => api.post('/article/my/saves');
export const getMyLikes = () => api.post('/article/likes/all');
export const getArticleLikes = (slug) => api.get(`/article/${slug}/likes`);
export const getArticleLikeStatus = (slug) => api.get(`/article/${slug}/like`);
export const getArticleSaveStatus = (slug) => api.get(`/article/${slug}/save`);
export const likeArticle = (slug) => api.post(`/article/${slug}/like`);
export const unlikeArticle = (slug) => api.post(`/article/${slug}/unlike`);
export const saveArticle = (slug) => api.post(`/article/${slug}/save`);
export const unsaveArticle = (slug) => api.post(`/article/${slug}/unsave`);

// AI
export const summarizeArticle = (slug) => api.post(`/article/${slug}/summarize`);
export const aiChat = (question) => api.post('/article/ai/chat', { question });
export const askArticle = (slug, question) =>
	api.post(`/article/${slug}/ask`, { question });

// Users
export const getUser = (username) => api.get(`/users/${username}`);
export const getUserPictureUrl = (username) =>
	`${BASE_URL}/users/${username}/picture`;
export const uploadProfilePicture = (formData) =>
	api.post('/users/picture', formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
export const updateProfile = (data) => api.post('/users/update', data);
export const removeProfilePic = () => api.delete('/users/picture');
export const getAllFollows = () => api.post('/users/following/all');

export default api;

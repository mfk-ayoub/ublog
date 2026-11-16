import { useState, useCallback } from 'react';
import AuthContext from './authContext';
import { getCookie, setCookie, removeCookie } from '../utils/cookie';

function getTokenFromCookie() {
	const value = getCookie('Authorization');
	if (value && value.startsWith('Bearer ')) {
		return value.substring(7);
	}
	return null;
}

export function AuthProvider({ children }) {
	const [token, setToken] = useState(() => getTokenFromCookie());
	const [username, setUsername] = useState(() => localStorage.getItem('username'));

	const login = useCallback((accessToken, user) => {
		setCookie('Authorization', `Bearer ${accessToken}`, 7 * 24 * 3600);
		localStorage.setItem('username', user);
		setToken(accessToken);
		setUsername(user);
	}, []);

	const logout = useCallback(() => {
		removeCookie('Authorization');
		localStorage.removeItem('username');
		setToken(null);
		setUsername(null);
	}, []);

	return (
		<AuthContext.Provider value={{ token, username, login, logout, isAuth: !!token }}>
			{children}
		</AuthContext.Provider>
	);
}

/**
 * Get a cookie value by name.
 */
export function getCookie(name) {
	const cookies = document.cookie.split('; ');
	for (const cookie of cookies) {
		const [key, ...rest] = cookie.split('=');
		if (key === name) {
			return decodeURIComponent(rest.join('='));
		}
	}
	return null;
}

/**
 * Set a cookie with the given name, value, and max-age in seconds.
 */
export function setCookie(name, value, maxAge) {
	let cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
	if (location.protocol === 'https:') {
		cookie += '; Secure';
	}
	document.cookie = cookie;
}

/**
 * Remove a cookie by name.
 */
export function removeCookie(name) {
	document.cookie = `${name}=; path=/; max-age=0`;
}

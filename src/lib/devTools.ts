import { redirect } from '@sveltejs/kit';
import { CookieOptions } from './constants';

export const devToolsActions = {
	devToolsPreimage: async ({ params, cookies, request }) => {
		const data = await request.formData();
		const preimage = data.get('preimage');
		const cookie = JSON.parse(cookies.get(params.slug));

		cookie.preimage = preimage;
		cookie.count++;
		cookies.set(params.slug, JSON.stringify(cookie), CookieOptions);

		throw redirect(302, `/articles/${params.slug}`);
	}
};

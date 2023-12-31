// This is an endpoint that generates a basic rss feed for your posts.
// It is OK to delete this file if you don't want an RSS feed.
// credit: https://scottspence.com/posts/make-an-rss-feed-with-sveltekit#add-posts-for-the-rss-feed

import { Title, SiteUrl } from '$lib/constants';
import { postSummaries } from '$lib/stores/posts';

export const prerender = true;

const websiteDescription = Title;
const postsUrl = `${SiteUrl}/articles`;

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function GET({ setHeaders }) {
	setHeaders({
		'Cache-Control': `max-age=0, s-max-age=600`,
		'Content-Type': 'application/xml'
	});

	const xml = `<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
      <channel>
        <title>${Title}</title>
        <link>${SiteUrl}</link>
        <description>${websiteDescription}</description>
        <atom:link href="${SiteUrl}/rss.xml" rel="self" type="application/rss+xml" />
        ${postSummaries
					.map(
						(post) =>
							`
              <item>
                <guid>${postsUrl}/${post.slug}</guid>
                <title>${post.title}</title>
                <description>${escapeHtml(post.preview.text)}</description>
                <link>${postsUrl}/${post.slug}</link>
                <pubDate>${new Date(post.date).toUTCString()}</pubDate>
            </item>
          `
					)
					.join('')}
      </channel>
    </rss>`;

	return new Response(xml);
}

function escapeHtml(target) {
	if (typeof target !== 'string') {
		return target;
	}
	return target.replace(/[&'`"<>]/g, (match) => {
		return {
			'&': '&amp;',
			"'": '&#x27;',
			'`': '&#x60;',
			'"': '&quot;',
			'<': '&lt;',
			'>': '&gt;'
		}[match];
	});
}

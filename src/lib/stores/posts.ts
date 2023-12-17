import { browser } from '$app/environment';
import type { PostSummary } from '$lib/type';
import { format } from 'date-fns';
import { parse } from 'node-html-parser';
import readingTime from 'reading-time/lib/reading-time';

// we require some server-side APIs to parse all metadata
if (browser) {
	throw new Error(`posts can only be imported server-side`);
}

// Get all posts and add metadata
export const postSummaries = Object.entries(import.meta.glob('/posts/**/*.md', { eager: true }))
	.map(([filepath, post]) => {
		const html = parse(post.default.render().html);
		const preview = post.metadata.preview ? parse(post.metadata.preview) : html.querySelector('p');

		// Required
		if (!post.metadata.title || post.metadata.title === '') {
			throw new Error(`must set the title: ${filepath}`);
		}
		if (!post.metadata.date || post.metadata.date === '') {
			throw new Error(`must set the date: ${filepath}`);
		}

		const htmlString = post.default.render().html;
		const hasPaywallContent = hasL402Content(htmlString);
		const wordCount = hasPaywallContent ? countWordOfPaywall(htmlString) : 0;
		if (hasPaywallContent && (!post.metadata.price || post.metadata.price === '')) {
			throw new Error(`must set the price: ${filepath}`);
		}

		return {
			...post.metadata,

			// generate the slug from the file path
			slug: filepath
				.replace(/(\/index)?\.md/, '')
				.split('/')
				.pop(),

			// whether or not this file is `my-post.md` or `my-post/index.md`
			// (needed to do correct dynamic import in posts/[slug].svelte)
			isIndexFile: filepath.endsWith('/index.md'),

			// format date as yyyy-MM-dd
			date: format(
				// offset by timezone so that the date is correct
				addTimezoneOffset(new Date(post.metadata.date)),
				'yyyy-MM-dd'
			),

			preview: {
				html: preview.toString(),
				// text-only preview (i.e no html elements), used for SEO
				text: preview.structuredText ?? preview.toString()
			},

			// get estimated reading time for the post
			readingTime: readingTime(html.structuredText).text,

			paywall: {
				hasPaywallContent,
				price: post.metadata.price,
				wordCount
			}
		} as PostSummary;
	})
	// sort by date
	.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	// add references to the next/previous post
	.map((post, index, allPosts) => ({
		...post,
		next: allPosts[index - 1],
		previous: allPosts[index + 1]
	}));

const contents = {} as {
	[slug: string]: { html: string; l402html: string };
};
postSummaries.forEach(async (post) => {
	// load the markdown file based on slug
	const md = post.isIndexFile
		? // vite requires relative paths and explicit file extensions for dynamic imports
		  // see https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
		  await import(`../../../posts/${post.slug}/index.md`)
		: await import(`../../../posts/${post.slug}.md`);
	const html = md.default.render().html;
	const l402html = eraceL402Content(html);
	contents[post.slug] = { html, l402html };
});
export const postContents = contents;

function addTimezoneOffset(date) {
	const offsetInMilliseconds = new Date().getTimezoneOffset() * 60 * 1000;
	return new Date(new Date(date).getTime() + offsetInMilliseconds);
}

function hasL402Content(html: string) {
	// TODO: make symbol&parse of l402 more practical
	return html.includes('<hr class="l402" hidden>');
}
// hide the content wrapped with L402
function eraceL402Content(html: string) {
	// TODO: make symbol&parse of l402 more practical
	const resut = html.substring(0, html.indexOf('<hr class="l402" hidden>'));
	return resut;
}
function countWordOfPaywall(html: string) {
	// TODO: make symbol&parse of l402 more practical
	const resut = html.substring(html.indexOf('<hr class="l402" hidden>'));
	return parse(resut).structuredText.length;
}

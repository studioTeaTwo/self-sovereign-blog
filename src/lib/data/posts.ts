import { browser } from '$app/environment';
import { format } from 'date-fns';
import { parse } from 'node-html-parser';
import readingTime from 'reading-time/lib/reading-time.js';

// we require some server-side APIs to parse all metadata
if (browser) {
	throw new Error(`posts can only be imported server-side`);
}

// Get all posts and add metadata
export const postSummaries = Object.entries(import.meta.glob('/posts/**/*.md', { eager: true }))
	.map(([filepath, post]) => {
		const html = parse(post.default.render().html);
		const preview = post.metadata.preview ? parse(post.metadata.preview) : html.querySelector('p');

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
			date: post.metadata.date
				? format(
						// offset by timezone so that the date is correct
						addTimezoneOffset(new Date(post.metadata.date)),
						'yyyy-MM-dd'
				  )
				: undefined,

			preview: {
				html: preview.toString(),
				// text-only preview (i.e no html elements), used for SEO
				text: preview.structuredText ?? preview.toString()
			},

			// get estimated reading time for the post
			readingTime: readingTime(html.structuredText).text
		};
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
	[slug: string]: { html: string; l402html: string; wordCount: number };
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
	const wordCount = countWordOfPaywall(html);
	contents[post.slug] = { html, l402html, wordCount };
});
export const postContents = contents;

function addTimezoneOffset(date) {
	const offsetInMilliseconds = new Date().getTimezoneOffset() * 60 * 1000;
	return new Date(new Date(date).getTime() + offsetInMilliseconds);
}

// hide the content wrapped with L402
function eraceL402Content(html: string) {
	// TODO: make symbol&parse of l402 more practical
	const resut = html.substring(0, html.indexOf('<hr id="l402" hidden>'));
	return resut;
}
function countWordOfPaywall(html: string) {
	const resut = html.substring(html.indexOf('<hr id="l402" hidden>'));
	const wordCount = parse(resut).structuredText.length;
	return wordCount;
}

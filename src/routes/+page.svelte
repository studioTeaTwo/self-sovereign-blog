<script>
	import { Author, SiteUrl, Title } from '$lib/constants';
	import { base } from '$app/paths';
	import { displayDate } from '$lib/utils';

	export let data;
</script>

<svelte:head>
	<title>{Title}</title>
	<meta name="description" content="" />
	<meta name="author" content={Author} />

	<!-- Facebook Meta Tags -->
	<meta property="og:url" content={SiteUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={Title} />
	<meta property="og:description" content="" />
	<!-- <meta property="og:image" content={ogImage} /> -->

	<!-- Twitter Meta Tags -->
	<meta name="twitter:card" content="summary" />
	<meta property="twitter:domain" content={SiteUrl} />
	<meta property="twitter:url" content={SiteUrl} />
	<meta name="twitter:title" content={Title} />
	<meta name="twitter:description" content="" />
	<!-- <meta name="twitter:image" content={ogImage} /> -->
</svelte:head>

{#each data.posts as post}
	<a href={`${base}/articles/${post.slug}`}>
		<article>
			<span class="post-date">{displayDate(post.date)}</span>
			<span class="post-title">{post.title}</span>
		</article>
	</a>
{/each}

<style>
	article {
		display: grid;
		grid-template-columns: 100px auto;
		place-items: baseline;
		margin-top: 0.5rem;
	}
	.post-date {
		font-size: 0.8rem;
	}
</style>

<script>
	import { Title } from '$lib/constants';
	import { base } from '$app/paths';
	import { displayDate } from '$lib/utils';

	export let data;
</script>

<svelte:head>
	<title>{Title}</title>
	<meta name="description" content="" />
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

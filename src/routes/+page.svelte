<script>
	import { Title } from '$lib';

	export let data;
</script>

<svelte:head>
	<title>{Title}</title>
	<meta name="description" content="" />
</svelte:head>

{#each data.posts as post}
	<article>
		<a href={`/articles/${post.slug}`}>
			<span>{post.date}</span>
			<span>{post.title}</span>
		</a>
	</article>
{/each}

<style>
	a {
		text-decoration: none;
		color: inherit;
	}
</style>

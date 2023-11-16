<script>
	export let data;
</script>

<article>
	<header>
		<h1>{data.post.title}</h1>
		<div class="post-date"><span>{data.post.date}</span>・<span>{data.post.readingTime}</span></div>
	</header>

	<svelte:component this={data.component} />
</article>

<style>
	.post-date {
		font-size: 0.8rem;
	}
</style>

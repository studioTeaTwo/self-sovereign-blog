<script>
	import { Title, RepositoryUrl } from '$lib/constants';
	import { base } from '$app/paths';
	import GithubLogo from '$lib/assets/GitHub-Mark-32px.png';
</script>

<header>
	<h1><a href={`${base}/`}>{Title}</a></h1>
</header>

<main>
	<slot />
</main>

<footer>
	<p>© studioTeaTwo</p>
	<p><a href={RepositoryUrl} target="”_blank”"><img alt="Github logo" src={GithubLogo} /></a></p>
</footer>

<style>
	:global(html, body) {
		min-height: 100vh;
		margin: 0;
		padding: 0;
	}
	:global(body) {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;
	}
	main {
		flex-grow: 1;
	}
	a {
		text-decoration: none;
		color: inherit;
	}
	footer {
		position: sticky;
		top: 100vh;

		display: flex;
		align-items: center;
		justify-content: center;
		column-gap: 16px;
		margin-top: auto;
	}
</style>

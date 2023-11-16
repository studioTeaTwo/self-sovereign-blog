<script>
  import { Title, RepositoryUrl } from '$lib'
  import GithubLogo from '$lib/assets/GitHub-Mark-32px.png'
</script>

<header>
  <h1>{ Title }</h1>
</header>

<main>
  <slot />
</main>

<footer>
  <p>© studioTeaTwo</p>
  <p><a href={ RepositoryUrl } target=”_blank”><img alt="Github logo" src={GithubLogo} /></a></p>
</footer>

<style>
  footer {
    position: fixed;
    bottom: 0;
    width: 100vw;

    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: 16px;
    margin-top: auto;
  }
</style>
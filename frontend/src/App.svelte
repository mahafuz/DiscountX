<script>
	import Router from 'svelte-spa-router';
	import Header from './components/Header.svelte'
	import Popups from './components/Popups.svelte'
	import Create from './components/Create.svelte'

	const routes = {
		'/': Popups,
		'/create': Create
	}
</script>

<main>
	<Header />

	<Router {routes} />
</main>

<style>
	
</style>
<script>
	import Router from 'svelte-spa-router'
	import Header from './components/Header.svelte'
	import Rules from './components/Rules.svelte'
	import Create from './components/Create.svelte'

	const routes = {
		'/': Rules,
		'/rule': Create,
		'/rule/:id': Create
	}
</script>

<main>
	<Header />

	<Router {routes} />
</main>

<style>
	
</style>
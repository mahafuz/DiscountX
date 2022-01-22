import App from './App.svelte';
import './Helper.js'

const root = document.getElementById('discountx-app-container');

const app = new App({
	target: root,
});

export default app;
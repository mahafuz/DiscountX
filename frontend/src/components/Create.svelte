<script>
    import Condition from './settings/Condition.svelte';
    import General from './settings/General.svelte';
    import Style from './settings/Style.svelte';
    let currentTab = 'condition'
</script>

<div class="discountx-popups-box">
    <div class="discountx-popups-wrap-head">
        <h2>Create</h2>
        <p>Create Popup</p>
    </div>

    <div class="discountx-popups-info">
        <h2>Name: </h2>
        <input type="text" name="" id="">
        <button>Save</button>
    </div>
</div>

<div class="discountx-popups-wrap">
    <div class="discountx-popups-wrap-head">
        <h2>Create</h2>
        <p>Create Popup</p>
    </div>

    <div class="discountx-popups-wrap-body">
        <nav class="discountx-tab-navbar">
            <button on:click={ () => currentTab = 'condition' }>Condition</button>
            <button on:click={ () => currentTab = 'settings' }>Settings</button>
            <button on:click={ () => currentTab = 'style' }>Style</button>
        </nav>

        {#if currentTab === 'condition'}
        <div class="discountx-tab-content">
            <Condition />
        </div>
        {/if}

        {#if currentTab === 'settings'}
        <div class="discountx-tab-content">
            <General />
        </div>
        {/if}

        {#if currentTab === 'style'}
        <div class="discountx-tab-content">
            <Style />
        </div>
        {/if}

    </div>

    <button>Save</button>
</div>

<style>
    nav.discountx-tab-navbar {
        border: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
    }

    nav.discountx-tab-navbar > button {
        background: transparent;
        border: 0px solid;
        color: blue;
        padding: 30px;
        cursor: pointer;
        width: 33.33%;
        border-right: 1px solid #fff555;
    }
</style>
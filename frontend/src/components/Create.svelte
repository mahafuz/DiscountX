<script>
    import { onMount } from 'svelte'
    import {push} from 'svelte-spa-router'
    import Condition from './settings/Condition.svelte'
    import Settings from './settings/Settings.svelte'
    import Style from './settings/Style.svelte'
    import { translation, getAjaxURL, getNonce } from './../Helper'

    export let params;


    let result = ''
    let settings = ''
    let name = ''
    let imageUrl = ''

    onMount( async () => {
        if ( params?.id ) {
            const res  = await fetch( getAjaxURL() + '?action=discountx_get_rule&id='+ params.id )
            const json = await res.json()

            result   = json.data
            settings = JSON.parse( result.settings )
            name     = result.name
            imageUrl = result.image_url
        }
    });


    let currentTab = 'condition',
        popup = {},
        frame;

    const handleProducts = (products) => {
        popup = { ...popup, products }
    }

    const handleMediaUpload = (e) => {
        e.preventDefault()

        if ( frame ) {
			frame.open()
			return
		}

		frame = wp.media({
			title: "Select or Upload Client logo",
			button: {
				text: "Use this image",
			},
			multiple: false,
		});

		frame.on("select", function () {
			const attachment = frame.state().get("selection").first().toJSON()
            settings.image_url = attachment.url
		});

		frame.open()
    }

    const createRule = (e) => {
        const data = new FormData(e.target);
        data.append( 'action', 'discountx_create_rule' )
        data.append( 'nonce', getNonce( 'create_dxrule' ) )
        data.append( 'products', popup?.products?.join() )

        const settings   = {}
        const duplicates = [ 'action', 'nonce' ]

        for( let [ key, value ] of Array.from( data ) ) {
            settings[key] = value

            if ( ! duplicates.includes( key ) ) {
                data.delete(key)
            }
        }

        data.append( 'settings', JSON.stringify( settings ) )

        fetch( getAjaxURL(), {
            method: 'POST',
            body: data
        })
        .then( res => res.json() )
        .then( res => {
            if ( res.data.insertId ) {
                push('#/rule/'+res.data.insertId)
            }
        } )
    }

    const updateRule = (e) => {
        const data = new FormData(e.target);
            data.append( 'action', 'discountx_update_rule' )
            data.append( 'nonce', getNonce( 'update_dxrule' ) )
            data.append( 'products', popup?.products?.join() )
            data.append( 'id', params?.id );

        
        const savedSettings = JSON.parse( result.settings );
        const newSettings   = {}
        const duplicates = [ 'action', 'nonce' ]

        for( let [ key, value ] of Array.from( data ) ) {
            newSettings[key] = value

            if ( ! duplicates.includes( key ) ) {
                data.delete(key)
            }
        }


        const settingsToSave = { ...savedSettings, ...newSettings }

        data.append( 'settings', JSON.stringify( settingsToSave ) )

        fetch( getAjaxURL(), {
            method: 'POST',
            body: data
        })
    }

    const onSubmit = (e) => {
        params?.id ? updateRule(e) : createRule(e);
    }
</script>

<form on:submit|preventDefault={onSubmit}>
    <div class="discountx-popups-box">
        <div class="discountx-popups-wrap-head">
            <h2>{ translation( 'create-title' ) }</h2>
            <p>{ translation( 'create-desc' ) }</p>
        </div>
    
        <div class="discountx-popups-info">
            <h2>{ translation( 'popup-name' ) } </h2>
            <input
                type="text"
                class="widefat regular-text"
                name="name" id="name"
                bind:value={name}
            >
            <button type="submit">{ translation( 'save-button' ) }</button>
        </div>
    </div>

    <div class="discountx-popups-wrap">
        <div class="discountx-popups-wrap-body">
            <nav class="discountx-tab-navbar">
                <span on:click={ () => currentTab = 'condition' }>{ translation( 'condition-tab-label' ) }</span>
                <span on:click={ () => currentTab = 'settings' }>{ translation( 'settings-tab-label' ) }</span>
                <span on:click={ () => currentTab = 'style' }>{ translation( 'style-tab-label' ) }</span>
            </nav>
    
            {#if currentTab === 'condition'}
                <div class="discountx-tab-content">
                    <Condition
                        handleProducts={(products) => handleProducts( products )}
                        settings={settings}
                        products={settings.products}
                    />
                </div>
            {/if}
    
            {#if currentTab === 'settings'}
                <div class="discountx-tab-content">
                    <Settings
                        on:click={handleMediaUpload}
                        settings={settings}
                    />
                </div>
            {/if}
    
            {#if currentTab === 'style'}
                <div class="discountx-tab-content">
                    <Style settings={settings} />
                </div>
            {/if}
    
        </div>
    
        <button type="submit">{ translation( 'save-button' ) }</button>
    </div>
</form>

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
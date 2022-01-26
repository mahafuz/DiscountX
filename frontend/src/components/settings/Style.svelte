<script>
    import RangeSlider from 'svelte-range-slider-pips'
    import { translation } from '../../Helper'
    let buttonColorState = 'normal'
    export let settings
    console.log( 'settings', settings.titleColor );
</script>

<div>
    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'title-fontsize-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <input type="hidden" name="titleFontSize" id="titleFontSize" value={settings.titleFontSize}>
            <RangeSlider
                values={[settings.titleFontSize ? settings.titleFontSize : 10]}
                float={true} min={10} max={100}
                on:stop={ (e) => settings.titleFontSize = e.detail.value }
            />
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'content-fontsize-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <input type="hidden" name="contentFontSize" id="contentFontSize"  value={settings.contentFontSize}>

            <RangeSlider
                values={[settings.contentFontSize ? settings.contentFontSize : 10]}
                float={true} min={10} max={100}
                on:stop={ (e) => settings.contentFontSize = e.detail.value }
            />
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'title-color-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <input
                type="color"
                name="titleColor"
                id="titleColor"
                value={settings.titleColor}
                on:input={(e) => settings.titleColor = e.target.value}
            >
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'content-color-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <input
                type="color"
                name="contentColor"
                id="contentColor"
                value={settings.contentColor}
                on:input={(e) => settings.contentColor = e.target.value}
            >
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'button-color-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <div class="color-tab">
                <button class="normal" on:click={ () => buttonColorState = 'normal' }>{translation( 'normal-label') }</button>
                <button class="hover" on:click={ () => buttonColorState = 'hover' }>{translation( 'hover-label' )}</button>
            </div>
            <div class="color-tab-content">
                {#if buttonColorState === 'normal' }
                    <div class="normal-color-picker">
                        <h4>{ translation( 'color-label' ) }</h4>
                        <input
                            type="color"
                            name="buttonColor"
                            id="buttonColor"
                            value={settings.buttonColor}
                            on:input={ e => settings.buttonColor = e.target.value }
                        >
                    </div>

                    <div class="normal-bgcolor-picker">
                        <h4>{ translation( 'background-label' ) }</h4>
                        <input
                            type="color"
                            name="buttonBgColor"
                            id="buttonBgColor"
                            value={settings.buttonBgColor}
                            on:input={ e => settings.buttonBgColor = e.target.value }
                        >
                    </div>
                {/if}
                {#if buttonColorState === 'hover' }
                    <div class="hover-color-picker">
                        <h4>{ translation( 'hover-color-label' ) }</h4>
                        <input
                            type="color"
                            name="buttonHoverColor"
                            id="buttonHoverColor"
                            value={settings.buttonHoverColor}
                            on:input={ e => settings.buttonHoverColor = e.target.value }
                        >
                    </div>

                    <div class="hover-bgcolor-picker">
                        <h4>{ translation( 'hover-background-label' ) }</h4>
                        <input
                            type="color"
                            name="buttonHoverBgColor"
                            id="buttonHoverBgColor"
                            value={settings.buttonHoverBgColor}
                            on:input={ e => settings.buttonHoverBgColor = e.target.value }
                        >
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'popup-background-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <input
                type="color"
                name="popupBgColor"
                id="popupBgColor"
                value={settings.popupBgColor}
                on:input={ e => settings.popupBgColor = e.target.value }
            >
        </div>
    </div>
</div>
<script>
    import { translation } from '../../Helper'
    let buttonColorState = 'normal'
</script>

<div>
    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'title-fontsize-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <input type="number" name="titleFontSize" id="titleFontSize" on:input>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'title-color-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <input type="color" name="titleColor" id="titleColor" on:input>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'content-fontsize-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <input type="number" name="contentFontSize" id="contentFontSize" on:input>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'content-color-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <input type="color" name="contentColor" id="contentColor" on:input>
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
                        <input type="color" name="buttonColor" id="buttonColor" on:input>
                    </div>

                    <div class="normal-bgcolor-picker">
                        <h4>{ translation( 'background-label' ) }</h4>
                        <input type="color" name="buttonBgColor" id="buttonBgColor" on:input>
                    </div>
                {/if}
                {#if buttonColorState === 'hover' }
                    <div class="hover-color-picker">
                        <h4>{ translation( 'hover-color-label' ) }</h4>
                        <input type="color" name="buttonHoverColor" id="buttonHoverColor" on:input>
                    </div>

                    <div class="hover-bgcolor-picker">
                        <h4>{ translation( 'hover-background-label' ) }</h4>
                        <input type="color" name="buttonHoverBgColor" id="buttonHoverBgColor" on:input>
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
            <input type="color" name="popupBgColor" id="popupBgColor" on:input>
        </div>
    </div>
</div>
<script>
    import { translation, getDisplayOptions, getThemes } from '../../Helper'
    export let settings
</script>

<div>
    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'display-on-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <select name="displayOn" id="displayOn">
                {#each Object.entries( getDisplayOptions() ) as [key, option] }
                    <option selected={key === settings.displayOn} value="{key}">{option}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation('theme-label') }</h4>
        </div>
        <div class="discountx-settings-control">
            <select name="theme" id="theme">
                {#each getThemes() as theme }
                    <option selected={theme.value === settings.theme} value="{theme.value}" disabled={theme.pro}>{theme.label}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation('image-label') }</h4>
        </div>
        <div class="discountx-settings-control">
            <div class="discountx-image-control-wrap">
                {#if settings.image_url}
                    <img src={settings.image_url} alt="">
                    <span class="discountx-remove-image" on:click|preventDefault={() => settings.image_url = ''}>x</span>
                {/if}
            </div>

            <input type="hidden" name="image_url" id="image_url" value={settings.image_url} />
            <button id="discountx-upload-popup-image" on:click><i class="dashicons-before dashicons-cloud-upload"></i></button>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation('pre-title-label') }</h4>
        </div>
        <div class="discountx-settings-control">
            <input
                type="text"
                name="popupPreTitle"
                id="popupPreTitle"
                value={settings.popupPreTitle}
            />
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation('title-label') }</h4>
        </div>
        <div class="discountx-settings-control">
            <input
                type="text"
                name="popupTitle"
                id="popupTitle"
                value={settings.popupTitle}
            />
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation('content-label') }</h4>
        </div>
        <div class="discountx-settings-control">
            <textarea name="popupContent" id="popupContent" cols="30" rows="10">{settings.popupContent}</textarea>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation('button-text-label') }</h4>
        </div>
        <div class="discountx-settings-control">
            <input type="text" name="buttonText" id="buttonText" value={settings.buttonText}/>
        </div>
    </div>

</div>
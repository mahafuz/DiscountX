<script>
    import { translation, getDisplayOptions, getThemes } from '../../Helper'
</script>

<div>
    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation( 'display-on-label' ) }</h4>
        </div>
        <div class="discountx-settings-control">
            <select name="displayOn" id="displayOn">
                {#each Object.entries( getDisplayOptions() ) as [key, option] }
                    <option value="{key}">{option}</option>
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
                <option value="{theme.value}" disabled={theme.pro}>{theme.label}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation('image-label') }</h4>
        </div>
        <div class="discountx-settings-control">
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
                value=""
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
                value=""
            />
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation('content-label') }</h4>
        </div>
        <div class="discountx-settings-control">
            <textarea name="popupContent" id="popupContent" cols="30" rows="10"></textarea>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>{ translation('button-text-label') }</h4>
        </div>
        <div class="discountx-settings-control">
            <input type="text" name="buttonText" id="buttonText"/>
        </div>
    </div>

</div>
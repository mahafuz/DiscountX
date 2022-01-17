<script>
    let buttonColorState = 'normal';
</script>

<div>
    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>Title Font Size</h4>
            <p class="desc">Select coupon code to apply when user will click on the popup apply button.</p>
        </div>
        <div class="discountx-settings-control">
            <input type="number" name="" id="">
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>Title Color</h4>
            <p class="desc">Select coupon code to apply when user will click on the popup apply button.</p>
        </div>
        <div class="discountx-settings-control">
            <input type="color" name="" id="">
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>Content Font Size</h4>
            <p class="desc">Select coupon code to apply when user will click on the popup apply button.</p>
        </div>
        <div class="discountx-settings-control">
            <input type="number" name="" id="">
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>Content Color</h4>
            <p class="desc">Select coupon code to apply when user will click on the popup apply button.</p>
        </div>
        <div class="discountx-settings-control">
            <input type="color" name="" id="">
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>Button Color</h4>
            <p class="desc">Select coupon code to apply when user will click on the popup apply button.</p>
        </div>
        <div class="discountx-settings-control">
            <div class="color-tab">
                <button class="normal" on:click={ () => buttonColorState = 'normal' }>Normal</button>
                <button class="hover" on:click={ () => buttonColorState = 'hover' }>Hover</button>
            </div>
            <div class="color-tab-content">
                {#if buttonColorState === 'normal' }
                    <div class="normal-color-picker">
                        <h4>Color</h4>
                        <input type="color" name="" id="">
                    </div>

                    <div class="normal-bgcolor-picker">
                        <h4>Background Color</h4>
                        <input type="color" name="" id="">
                    </div>
                {/if}
                {#if buttonColorState === 'hover' }
                    <div class="hover-color-picker">
                        <h4>Hover Color</h4>
                        <input type="color" name="" id="">
                    </div>

                    <div class="hover-bgcolor-picker">
                        <h4>Hover Background Color</h4>
                        <input type="color" name="" id="">
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <div class="discountx-settings-panel">
        <div class="discountx-settings-label">
            <h4>Popup Background Color</h4>
            <p class="desc">Select coupon code to apply when user will click on the popup apply button.</p>
        </div>
        <div class="discountx-settings-control">
            <input type="color" name="" id="">
        </div>
    </div>


</div>
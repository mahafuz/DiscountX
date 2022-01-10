<?php

/**
 * Responsible for displaying settings page.
 *
 * @since 1.0.0
 */

// if direct access than exit the file.
defined('ABSPATH') || exit;

$coupons     = ct()->helpers->getCouponList();
$savedCoupon = isset( $settings->savedCoupon ) ? esc_attr( $settings->savedCoupon ) : '';

$displayOn     = isset( $settings->displayOn ) ? esc_attr( $settings->displayOn ) : '';
$appearance    = isset( $settings->appearance ) ? esc_attr( $settings->appearance ) : '';
$popupTitle    = isset( $settings->popupTitle ) ? esc_attr( $settings->popupTitle ) : __( 'Hear’s 15% Off!', 'cart-targeting' );
$popupPreTitle = isset( $settings->popupPreTitle ) ? esc_attr( $settings->popupPreTitle ) : '';
$popupContent  = isset( $settings->popupContent ) ? esc_attr( $settings->popupContent ) : __( 'Subscribe to our email get 15% of on first sell dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolo', 'cart-targeting' );
$buttonText    = isset( $settings->buttonText ) ? esc_attr( $settings->buttonText ) : __( 'Apply Now', 'cart-targeting' );
$popupImage    = isset( $settings->popupImage ) ? esc_attr( $settings->popupImage ) : '';

$titleFontSize  = isset( $settings->titleFontSize ) ? absint( $settings->titleFontSize ) : '60';
$buttonFontSize = isset( $settings->buttonFontSize ) ? absint( $settings->buttonFontSize ) : '15';
$titleColor     = isset( $settings->titleColor ) ? esc_attr( $settings->titleColor ) : '';
$contentColor   = isset( $settings->contentColor ) ? esc_attr( $settings->contentColor ) : '';

$buttonColor      = isset( $settings->buttonColor ) ? esc_attr( $settings->buttonColor ) : '';
$buttonHoverColor = isset( $settings->buttonHoverColor ) ? esc_attr( $settings->buttonHoverColor ) : '';

$buttonBgColor      = isset( $settings->buttonBgColor ) ? esc_attr( $settings->buttonBgColor ) : '';
$buttonHoverBgColor = isset( $settings->buttonHoverBgColor ) ? esc_attr( $settings->buttonHoverBgColor ) : '';
$popupBgColor       = isset( $settings->popupBgColor ) ? esc_attr( $settings->popupBgColor ) : '';

$theme      = isset( $settings->theme ) ? esc_attr( $settings->theme ) : '';
$cartType   = isset( $settings->cart_type ) ? esc_attr( $settings->cart_type ) : '';
$couponCode = isset( $settings->coupon_code ) ? esc_attr( $settings->coupon_code ) : '';
$condition  = isset( $settings->condition ) ? esc_attr( $settings->condition ) : '';
$number     = isset( $settings->number ) ? absint( $settings->number ) : '';
?>
<div class="ct-container ct-options-wrapper wrap">
    <form action="options.php" id="ct-settings-form">

        <ul class="ct-settings-nav">
            <li><a href="#general" id="general-tab"><?php _e( 'Condition', 'cart-targeting' ); ?></a></li>
            <li><a href="#popup" id="popup-tab"><?php _e( 'Popup', 'cart-targeting' ); ?></a></li>
            <li><a href="#styles" id="styles-tab"><?php _e( 'Styles', 'cart-targeting' ); ?></a></li>
        </ul>

        <div class="ct-options-box" id="general">
            <h2 class="ct-options-box-header">
                <i class="dashicons-before dashicons-admin-generic"></i> <?php _e( 'Display Condition Settings', 'cart-targeting' ); ?>
            </h2>
            <div class="ct-options-settings-section">
                <div class="ct-flex">
                    <div class="ct-settings-panel coupon-code-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Coupon Code', 'cart-targeting' ); ?></h4>
							<p class="desc"><?php _e( 'Select coupon code to apply when user will click on the popup apply button.', 'cart-targeting' ); ?></p>
                        </div>
                        <div class="ct-settings-control">
                            <?php if ( ! empty( $coupons ) ) : ?>
                                <select name="savedCoupon" id="saved-coupon" class="saved-coupon">
                                    <?php foreach( $coupons as $coupon ) {
                                        printf(
                                            '<option value="%s" %s>%s</option>',
											$coupon->text,
                                            selected( $savedCoupon, $coupon->text ),
                                            $coupon->text
                                        );
                                    } ?>
                                </select>
                            <?php endif; ?>
                        </div>
                    </div><!-- /.ct-settings-panel.coupon-code-setting -->

                    <div class="ct-settings-panel appearance-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Appearance', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <select name="appearance" id="appearance">
                                <option value="show" <?php selected( $appearance, 'show' ); ?>>
                                    <?php _e( 'Show', 'cart-targeting' ); ?>
                                </option>
                                <option value="dont-show" <?php selected( $appearance, 'dont-show' ); ?>>
                                    <?php _e( "Don't show", 'cart-targeting' ); ?>
                                </option>
                            </select>
                        </div>
                    </div><!-- /.ct-settings-panel.appearance-setting -->

                    <div class="ct-settings-panel cart-type-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Cart type', 'cart-targeting' ); ?></h4>
							<p class="desc"><?php _e( 'Select Cart Type condition.', 'cart-targeting' ); ?></p>
                        </div>
                        <div class="ct-settings-control">
                            <select name="cart_type" id="cart_type">
                                <option value="money" <?php selected( $cartType, 'money' ); ?>>
                                    <?php _e( 'Cart money value', 'cart-targeting' ); ?>
                                </option>
                                <option value="items" <?php selected( $cartType, 'items' ); ?>>
                                    <?php _e( 'Number of cart items', 'cart-targeting' ); ?>
                                </option>
                                <option value="products" <?php selected( $cartType, 'products' ); ?>>
                                    <?php _e( 'Products in the cart', 'cart-targeting' ); ?>
                                </option>
                            </select>
                        </div>
                    </div><!-- /.ct-settings-panel.cart-type-setting -->

                    <div class="ct-settings-panel condition-setting<?php echo ( 'products' === $cartType ) ? ' hidden' : '' ?>">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Condition', 'cart-targeting' ); ?></h4>
							<p class="desc"><?php _e( 'Select the condition.', 'cart-targeting' ); ?></p>
                        </div>
                        <div class="ct-settings-control">
                            <select name="condition" id="condition">
                                <option value="over_or_equal" <?php selected( $condition, 'over_or_equal' ); ?>>
                                    <?php _e( 'Over or equal', 'cart-targeting' ); ?>
                                </option>
                                <option value="equal" <?php selected( $condition, 'equal' ); ?>>
                                    <?php _e( 'Equal', 'cart-targeting' ); ?>
                                </option>
                                <option value="under" <?php selected( $condition, 'under' ); ?>>
                                    <?php _e( 'Under', 'cart-targeting' ); ?>
                                </option>
                            </select>
                        </div>
                    </div><!-- /.ct-settings-panel.condition-setting -->

                    <div class="ct-settings-panel products-setting<?php echo ( 'products' === $cartType ) ? '' : ' hidden' ?>">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Products', 'cart-targeting' ); ?></h4>
							<p class="desc"><?php _e( 'Choose products.', 'cart-targeting' ); ?></p>
                        </div>
                        <div class="ct-settings-control">
                            <?php if ( ! empty( $products ) ) : ?>
                                <select name="products[]" id="products" class="products" multiple="true">
                                    <?php foreach( $products as $product ) {
                                        printf(
                                            '<option value="%d" %s>%s</option>',
                                            $product->id,
                                            in_array( absint( $product->id ), $productIds ) ? 'selected="selected"' : '',
                                            $product->text
                                        );
                                    } ?>
                                </select>
                            <?php endif; ?>
                        </div>
                    </div><!-- /.ct-settings-panel.products-setting -->

                    <div class="ct-settings-panel number-setting<?php echo ( 'products' === $cartType ) ? ' hidden' : '' ?>">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Number', 'cart-targeting' ); ?></h4>
							<p class="desc"><?php _e( 'The number to set the condition.', 'cart-targeting' ); ?></p>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                type="number"
                                name="number"
                                id="number"
                                value="<?php echo $number; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.number-setting -->

                </div>
            </div>
        </div><!-- /.end of general settings -->

        <div class="ct-options-box" id="popup">
            <h2 class="ct-options-box-header">
                <i class="dashicons-before dashicons-megaphone"></i> <?php _e( 'Popup Settings', 'cart-targeting' ); ?>
            </h2>
            <div class="ct-options-settings-section">
                <div class="ct-flex">

                    <div class="ct-settings-panel popup-display-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Display On', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <select name="displayOn" id="display-on">
                                <option value="cart_page" <?php selected( $displayOn, 'cart_page' ); ?>>
                                    <?php _e( 'Cart Page', 'cart-targeting' ); ?>
                                </option>
                                <option value="every_page" <?php selected( $displayOn, 'every_page' ); ?>>
                                    <?php _e( "Every Page", 'cart-targeting' ); ?>
                                </option>
                            </select>
                        </div>
                    </div><!-- /.ct-settings-panel.popup-styles-setting -->

                    <div class="ct-settings-panel popup-styles-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Theme', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <select name="theme" id="popup-styles">
                                <option value="theme-1" <?php selected( $theme, 'style_1' ); ?>>
                                    <?php _e( 'Theme 1', 'cart-targeting' ); ?>
                                </option>
                                <option value="theme-2" <?php selected( $theme, 'style_2' ); ?> disabled>
                                    <?php _e( "Theme 2 (PRO)", 'cart-targeting' ); ?>
                                </option>
                                <option value="theme-3" <?php selected( $theme, 'style_3' ); ?> disabled>
                                    <?php _e( "Theme 3 (PRO)", 'cart-targeting' ); ?>
                                </option>
								<option value="theme-4" <?php selected( $theme, 'style_3' ); ?> disabled>
									<?php _e( "Theme 3 (PRO)", 'cart-targeting' ); ?>
								</option>
                            </select>
                        </div>
                    </div><!-- /.ct-settings-panel.popup-styles-setting -->

                    <div class="ct-settings-panel popup-image-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Image', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                class="hidden"
                                type="text"
                                name="popupImage"
                                id="popup-image"
                                value="<?php echo $popupImage; ?>"
                            />
                            <div class="popup-image-container">
                                <i class="dashicons-before popup-image-close dashicons-no-alt"></i>
                                <img src="<?php echo $popupImage; ?>" id="popup-image-src" />
                            </div>
                            <button id="ct-upload-popup-image"><i class="dashicons-before dashicons-cloud-upload"></i></button>
                        </div>
                    </div><!-- /.ct-settings-panel.popup-title-setting -->

                    <div class="ct-settings-panel popup-pre-title-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Pre Title', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                type="text"
                                name="popupPreTitle"
                                id="popup-pre-title"
                                value="<?php echo $popupPreTitle; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.popup-title-setting -->

                    <div class="ct-settings-panel popup-title-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Title', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                type="text"
                                name="popupTitle"
                                id="popup-title"
                                value="<?php echo $popupTitle; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.popup-title-setting -->

                    <div class="ct-settings-panel popup-content-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Content', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <textarea
                                name="popupContent"
                                id="popup-content"
                                cols="30"
                                rows="10"><?php echo $popupContent; ?></textarea>
                        </div>
                    </div><!-- /.ct-settings-panel.popup-title-setting -->

                    <div class="ct-settings-panel popup-button-text-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Button Text', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                type="text"
                                name="buttonText"
                                id="button-text"
                                value="<?php echo $buttonText; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.popup-title-setting -->

                </div>
            </div>
        </div><!-- /. end of popup settings -->

        <div class="ct-options-box" id="styles">
            <h2 class="ct-options-box-header">
                <i class="dashicons-before dashicons-art"></i> <?php _e( 'Style Settings', 'cart-targeting' ); ?>
            </h2>
            <div class="ct-options-settings-section">
                <div class="ct-flex">

                    <div class="ct-settings-panel title-fontsize-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Title Font Size', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                type="number"
                                name="titleFontSize"
                                id="title-font-size"
                                value="<?php echo $titleFontSize; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.coupon-code-setting -->

                    <div class="ct-settings-panel title-color-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Title Color', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                class="ct-color-control"
                                type="text"
                                name="titleColor"
                                id="title-color"
                                value="<?php echo $titleColor; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.coupon-code-setting -->

                    <div class="ct-settings-panel content-color-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Content Color', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                class="ct-color-control"
                                type="text"
                                name="contentColor"
                                id="content-color"
                                value="<?php echo $contentColor; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.coupon-code-setting -->

                    <div class="ct-settings-panel button-fontsize-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Button Font Size', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                type="number"
                                name="buttonFontSize"
                                id="button-font-size"
                                value="<?php echo $buttonFontSize; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.coupon-code-setting -->

                    <div class="ct-settings-panel button-color-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Button Color', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                class="ct-color-control"
                                type="text"
                                name="buttonColor"
                                id="button-color"
                                value="<?php echo $buttonColor; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.coupon-code-setting -->

                    <div class="ct-settings-panel button-hover-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Button Hover Color', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                class="ct-color-control"
                                type="text"
                                name="buttonHoverColor"
                                id="button-hover-color"
                                value="<?php echo $buttonHoverColor; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.coupon-code-setting -->

                    <div class="ct-settings-panel button-bg-color-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Button Background Color', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                class="ct-color-control"
                                type="text"
                                name="buttonBgColor"
                                id="button-bg-color"
                                value="<?php echo $buttonBgColor; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.coupon-code-setting -->

                    <div class="ct-settings-panel button-hover-bg-color-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Button Hover Background Color', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                class="ct-color-control"
                                type="text"
                                name="buttonHoverBgColor"
                                id="button-hover-bg-color"
                                value="<?php echo $buttonHoverBgColor; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.coupon-code-setting -->

                    <div class="ct-settings-panel popup-background-setting">
                        <div class="ct-settings-label">
                            <h4><?php _e( 'Popup Background Color', 'cart-targeting' ); ?></h4>
                        </div>
                        <div class="ct-settings-control">
                            <input
                                class="ct-color-control"
                                type="text"
                                name="popupBgColor"
                                id="popup-bg-color"
                                value="<?php echo $popupBgColor; ?>"
                            />
                        </div>
                    </div><!-- /.ct-settings-panel.coupon-code-setting -->

                </div>
            </div>
        </div><!-- /.end of style settings -->

        <div class="ct-save-changes">
            <button type="submit" id="save-ct-settings" class="button button-primary">
                <div class="ct-loading-spinner">
                    <div class="double-bounce1"></div>
                    <div class="double-bounce2"></div>
                </div>
                <?php _e( 'Save Changes', 'cart-targeting' ); ?>
            </button>
        </div>

        <input type="hidden" name="nonce" id="nonce" value="<?php echo wp_create_nonce( 'ct_save_settings_action' ); ?>">
    </form>

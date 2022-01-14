<?php

/**
 * Responsible for displaying settings page.
 *
 * @since 1.0.0
 */

// if direct access than exit the file.
defined('ABSPATH') || exit;

$coupons           = DX()->helpers->getCouponList();
$savedCoupon       = isset( $settings->savedCoupon ) ? esc_attr( $settings->savedCoupon ) : '';
$displayOn         = isset( $settings->displayOn ) ? esc_attr( $settings->displayOn ) : '';
$appearance        = isset( $settings->appearance ) ? esc_attr( $settings->appearance ) : '';
$popupTitle        = isset( $settings->popupTitle ) ? esc_attr( $settings->popupTitle ) : __( 'Hear’s 15% Off!', 'discountx' );
$popupPreTitle     = isset( $settings->popupPreTitle ) ? esc_attr( $settings->popupPreTitle ) : '';
$popupContent      = isset( $settings->popupContent ) ? esc_attr( $settings->popupContent ) : __( 'Subscribe to our email get 15% of on first sell dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolo', 'discountx' );
$buttonText        = isset( $settings->buttonText ) ? esc_attr( $settings->buttonText ) : __( 'Apply Now', 'discountx' );
$popupImage        = isset( $settings->popupImage ) ? esc_attr( $settings->popupImage ) : '';
$titleFontSize      = isset( $settings->titleFontSize ) ? absint( $settings->titleFontSize ) : '60';
$buttonFontSize     = isset( $settings->buttonFontSize ) ? absint( $settings->buttonFontSize ) : '15';
$titleColor         = isset( $settings->titleColor ) ? esc_attr( $settings->titleColor ) : '';
$contentColor       = isset( $settings->contentColor ) ? esc_attr( $settings->contentColor ) : '';
$buttonColor        = isset( $settings->buttonColor ) ? esc_attr( $settings->buttonColor ) : '';
$buttonHoverColor   = isset( $settings->buttonHoverColor ) ? esc_attr( $settings->buttonHoverColor ) : '';
$buttonBgColor      = isset( $settings->buttonBgColor ) ? esc_attr( $settings->buttonBgColor ) : '';
$buttonHoverBgColor = isset( $settings->buttonHoverBgColor ) ? esc_attr( $settings->buttonHoverBgColor ) : '';
$popupBgColor       = isset( $settings->popupBgColor ) ? esc_attr( $settings->popupBgColor ) : '';
$theme              = isset( $settings->theme ) ? esc_attr( $settings->theme ) : '';
$cartType           = isset( $settings->cart_type ) ? esc_attr( $settings->cart_type ) : '';
$couponCode         = isset( $settings->coupon_code ) ? esc_attr( $settings->coupon_code ) : '';
$condition          = isset( $settings->condition ) ? esc_attr( $settings->condition ) : '';
$number             = isset( $settings->number ) ? absint( $settings->number ) : '';
?>
<div class="dx-container dx-options-wrapper wrap">
    <form action="options.php" id="dx-settings-form">

        <ul class="dx-settings-nav">
            <li><a href="#general" id="general-tab"><?php _e( 'Condition', 'discountx' ); ?></a></li>
            <li><a href="#popup" id="popup-tab"><?php _e( 'Popup', 'discountx' ); ?></a></li>
            <li><a href="#styles" id="styles-tab"><?php _e( 'Styles', 'discountx' ); ?></a></li>
        </ul>

        <div class="dx-options-box" id="general">
            <h2 class="dx-options-box-header">
                <i class="dashicons-before dashicons-admin-generic"></i> <?php _e( 'Display Condition Settings', 'discountx' ); ?>
            </h2>
            <div class="dx-options-settings-section">
                <div class="dx-flex">
                    <div class="dx-settings-panel coupon-code-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Coupon Code', 'discountx' ); ?></h4>
							<p class="desc"><?php _e( 'Select coupon code to apply when user will click on the popup apply button.', 'discountx' ); ?></p>
                        </div>
                        <div class="dx-settings-control">
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
                    </div><!-- /.dx-settings-panel.coupon-code-setting -->

                    <div class="dx-settings-panel appearance-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Appearance', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <select name="appearance" id="appearance">
                                <option value="show" <?php selected( $appearance, 'show' ); ?>>
                                    <?php _e( 'Show', 'discountx' ); ?>
                                </option>
                                <option value="dont-show" <?php selected( $appearance, 'dont-show' ); ?>>
                                    <?php _e( "Don't show", 'discountx' ); ?>
                                </option>
                            </select>
                        </div>
                    </div><!-- /.dx-settings-panel.appearance-setting -->

                    <div class="dx-settings-panel cart-type-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Cart type', 'discountx' ); ?></h4>
							<p class="desc"><?php _e( 'Select Cart Type condition.', 'discountx' ); ?></p>
                        </div>
                        <div class="dx-settings-control">
                            <select name="cart_type" id="cart_type">
                                <option value="money" <?php selected( $cartType, 'money' ); ?>>
                                    <?php _e( 'Cart money value', 'discountx' ); ?>
                                </option>
                                <option value="items" <?php selected( $cartType, 'items' ); ?>>
                                    <?php _e( 'Number of cart items', 'discountx' ); ?>
                                </option>
                                <option value="products" <?php selected( $cartType, 'products' ); ?>>
                                    <?php _e( 'Products in the cart', 'discountx' ); ?>
                                </option>
                            </select>
                        </div>
                    </div><!-- /.dx-settings-panel.cart-type-setting -->

                    <div class="dx-settings-panel condition-setting<?php echo ( 'products' === $cartType ) ? ' hidden' : '' ?>">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Condition', 'discountx' ); ?></h4>
							<p class="desc"><?php _e( 'Select the condition.', 'discountx' ); ?></p>
                        </div>
                        <div class="dx-settings-control">
                            <select name="condition" id="condition">
                                <option value="over_or_equal" <?php selected( $condition, 'over_or_equal' ); ?>>
                                    <?php _e( 'Over or equal', 'discountx' ); ?>
                                </option>
                                <option value="equal" <?php selected( $condition, 'equal' ); ?>>
                                    <?php _e( 'Equal', 'discountx' ); ?>
                                </option>
                                <option value="under" <?php selected( $condition, 'under' ); ?>>
                                    <?php _e( 'Under', 'discountx' ); ?>
                                </option>
                            </select>
                        </div>
                    </div><!-- /.dx-settings-panel.condition-setting -->

                    <div class="dx-settings-panel products-setting<?php echo ( 'products' === $cartType ) ? '' : ' hidden' ?>">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Products', 'discountx' ); ?></h4>
							<p class="desc"><?php _e( 'Choose products.', 'discountx' ); ?></p>
                        </div>
                        <div class="dx-settings-control">
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
                    </div><!-- /.dx-settings-panel.products-setting -->

                    <div class="dx-settings-panel number-setting<?php echo ( 'products' === $cartType ) ? ' hidden' : '' ?>">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Number', 'discountx' ); ?></h4>
							<p class="desc"><?php _e( 'The number to set the condition.', 'discountx' ); ?></p>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                type="number"
                                name="number"
                                id="number"
                                value="<?php echo absint( $number ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.number-setting -->

                </div>
            </div>
        </div><!-- /.end of general settings -->

        <div class="dx-options-box" id="popup">
            <h2 class="dx-options-box-header">
                <i class="dashicons-before dashicons-megaphone"></i> <?php _e( 'Popup Settings', 'discountx' ); ?>
            </h2>
            <div class="dx-options-settings-section">
                <div class="dx-flex">

                    <div class="dx-settings-panel popup-display-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Display On', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <select name="displayOn" id="display-on">
                                <option value="cart_page" <?php selected( $displayOn, 'cart_page' ); ?>>
                                    <?php _e( 'Cart Page', 'discountx' ); ?>
                                </option>
                                <option value="every_page" <?php selected( $displayOn, 'every_page' ); ?>>
                                    <?php _e( "Every Page", 'discountx' ); ?>
                                </option>
                            </select>
                        </div>
                    </div><!-- /.dx-settings-panel.popup-styles-setting -->

                    <div class="dx-settings-panel popup-styles-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Theme', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <select name="theme" id="popup-styles">
                                <option value="theme-1" <?php selected( $theme, 'style_1' ); ?>>
                                    <?php _e( 'Theme 1', 'discountx' ); ?>
                                </option>
                                <option value="theme-2" <?php selected( $theme, 'style_2' ); ?> disabled>
                                    <?php _e( "Theme 2 (PRO)", 'discountx' ); ?>
                                </option>
                                <option value="theme-3" <?php selected( $theme, 'style_3' ); ?> disabled>
                                    <?php _e( "Theme 3 (PRO)", 'discountx' ); ?>
                                </option>
								<option value="theme-4" <?php selected( $theme, 'style_3' ); ?> disabled>
									<?php _e( "Theme 3 (PRO)", 'discountx' ); ?>
								</option>
                            </select>
                        </div>
                    </div><!-- /.dx-settings-panel.popup-styles-setting -->

                    <div class="dx-settings-panel popup-image-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Image', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                class="hidden"
                                type="text"
                                name="popupImage"
                                id="popup-image"
                                value="<?php echo esc_url( $popupImage ); ?>"
                            />
                            <div class="popup-image-container">
                                <i class="dashicons-before popup-image-close dashicons-no-alt"></i>
                                <img src="<?php echo esc_url( $popupImage ); ?>" id="popup-image-src" />
                            </div>
                            <button id="dx-upload-popup-image"><i class="dashicons-before dashicons-cloud-upload"></i></button>
                        </div>
                    </div><!-- /.dx-settings-panel.popup-title-setting -->

                    <div class="dx-settings-panel popup-pre-title-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Pre Title', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                type="text"
                                name="popupPreTitle"
                                id="popup-pre-title"
                                value="<?php echo esc_attr( $popupPreTitle ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.popup-title-setting -->

                    <div class="dx-settings-panel popup-title-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Title', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                type="text"
                                name="popupTitle"
                                id="popup-title"
                                value="<?php echo esc_attr( $popupTitle ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.popup-title-setting -->

                    <div class="dx-settings-panel popup-content-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Content', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <textarea
                                name="popupContent"
                                id="popup-content"
                                cols="30"
                                rows="10"><?php echo wp_kses_post( $popupContent ); ?></textarea>
                        </div>
                    </div><!-- /.dx-settings-panel.popup-title-setting -->

                    <div class="dx-settings-panel popup-button-text-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Button Text', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                type="text"
                                name="buttonText"
                                id="button-text"
                                value="<?php echo esc_attr( $buttonText ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.popup-title-setting -->

                </div>
            </div>
        </div><!-- /. end of popup settings -->

        <div class="dx-options-box" id="styles">
            <h2 class="dx-options-box-header">
                <i class="dashicons-before dashicons-art"></i> <?php _e( 'Style Settings', 'discountx' ); ?>
            </h2>
            <div class="dx-options-settings-section">
                <div class="dx-flex">

                    <div class="dx-settings-panel title-fontsize-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Title Font Size', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                type="number"
                                name="titleFontSize"
                                id="title-font-size"
                                value="<?php echo absint( $titleFontSize ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.coupon-code-setting -->

                    <div class="dx-settings-panel title-color-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Title Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                class="dx-color-control"
                                type="text"
                                name="titleColor"
                                id="title-color"
                                value="<?php echo esc_attr( $titleColor ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.coupon-code-setting -->

                    <div class="dx-settings-panel content-color-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Content Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                class="dx-color-control"
                                type="text"
                                name="contentColor"
                                id="content-color"
                                value="<?php echo esc_attr( $contentColor ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.coupon-code-setting -->

                    <div class="dx-settings-panel button-fontsize-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Button Font Size', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                type="number"
                                name="buttonFontSize"
                                id="button-font-size"
                                value="<?php echo absint( $buttonFontSize ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.coupon-code-setting -->

                    <div class="dx-settings-panel button-color-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Button Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                class="dx-color-control"
                                type="text"
                                name="buttonColor"
                                id="button-color"
                                value="<?php echo esc_attr( $buttonColor ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.coupon-code-setting -->

                    <div class="dx-settings-panel button-hover-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Button Hover Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                class="dx-color-control"
                                type="text"
                                name="buttonHoverColor"
                                id="button-hover-color"
                                value="<?php echo esc_attr( $buttonHoverColor ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.coupon-code-setting -->

                    <div class="dx-settings-panel button-bg-color-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Button Background Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                class="dx-color-control"
                                type="text"
                                name="buttonBgColor"
                                id="button-bg-color"
                                value="<?php echo esc_attr( $buttonBgColor ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.coupon-code-setting -->

                    <div class="dx-settings-panel button-hover-bg-color-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Button Hover Background Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                class="dx-color-control"
                                type="text"
                                name="buttonHoverBgColor"
                                id="button-hover-bg-color"
                                value="<?php echo esc_attr( $buttonHoverBgColor ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.coupon-code-setting -->

                    <div class="dx-settings-panel popup-background-setting">
                        <div class="dx-settings-label">
                            <h4><?php _e( 'Popup Background Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="dx-settings-control">
                            <input
                                class="dx-color-control"
                                type="text"
                                name="popupBgColor"
                                id="popup-bg-color"
                                value="<?php echo esc_attr( $popupBgColor ); ?>"
                            />
                        </div>
                    </div><!-- /.dx-settings-panel.coupon-code-setting -->

                </div>
            </div>
        </div><!-- /.end of style settings -->

        <div class="dx-save-changes">
            <button type="submit" id="save-dx-settings" class="button button-primary">
                <div class="dx-loading-spinner">
                    <div class="double-bounce1"></div>
                    <div class="double-bounce2"></div>
                </div>
                <?php _e( 'Save Changes', 'discountx' ); ?>
            </button>
        </div>

        <input type="hidden" name="nonce" id="nonce" value="<?php echo wp_create_nonce( 'dx_save_settings_action' ); ?>">
    </form>

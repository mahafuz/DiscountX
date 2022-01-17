<?php

/**
 * Responsible for displaying settings page.
 *
 * @since 1.0.0
 */

// if direct access than exit the file.
defined('ABSPATH') || exit;

$coupons            = discountx()->helpers->getCouponList();
$savedCoupon        = isset( $settings['savedCoupon'] ) ? esc_attr( $settings['savedCoupon'] ) : '';
$displayOn          = isset( $settings['displayOn'] ) ? esc_attr( $settings['displayOn'] ) : '';
$appearance         = isset( $settings['appearance'] ) ? esc_attr( $settings['appearance'] ) : '';
$popupTitle         = isset( $settings['popupTitle'] ) ? esc_attr( $settings['popupTitle'] ) : __( 'Hear’s 15% Off!', 'discountx' );
$popupPreTitle      = isset( $settings['popupPreTitle'] ) ? esc_attr( $settings['popupPreTitle'] ) : '';
$popupContent       = isset( $settings['popupContent'] ) ? esc_attr( $settings['popupContent'] ) : __( 'Subscribe to our email get 15% of on first sell dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolo', 'discountx' );
$buttonText         = isset( $settings['buttonText'] ) ? esc_attr( $settings['buttonText'] ) : __( 'Apply Now', 'discountx' );
$popupImage         = isset( $settings['popupImage'] ) ? esc_attr( $settings['popupImage'] ) : '';
$titleFontSize      = isset( $settings['titleFontSize'] ) ? absint( $settings['titleFontSize'] ) : '60';
$buttonFontSize     = isset( $settings['buttonFontSize'] ) ? absint( $settings['buttonFontSize'] ) : '15';
$titleColor         = isset( $settings['titleColor'] ) ? esc_attr( $settings['titleColor'] ) : '';
$contentColor       = isset( $settings['contentColor'] ) ? esc_attr( $settings['contentColor'] ) : '';
$buttonColor        = isset( $settings['buttonColor'] ) ? esc_attr( $settings['buttonColor'] ) : '';
$buttonHoverColor   = isset( $settings['buttonHoverColor'] ) ? esc_attr( $settings['buttonHoverColor'] ) : '';
$buttonBgColor      = isset( $settings['buttonBgColor'] ) ? esc_attr( $settings['buttonBgColor'] ) : '';
$buttonHoverBgColor = isset( $settings['buttonHoverBgColor'] ) ? esc_attr( $settings['buttonHoverBgColor'] ) : '';
$popupBgColor       = isset( $settings['popupBgColor'] ) ? esc_attr( $settings['popupBgColor'] ) : '';
$theme              = isset( $settings['theme'] ) ? esc_attr( $settings['theme'] ) : '';
$cartType           = isset( $settings['cart_type'] ) ? esc_attr( $settings['cart_type'] ) : '';
$couponCode         = isset( $settings['coupon_code'] ) ? esc_attr( $settings['coupon_code'] ) : '';
$condition          = isset( $settings['condition'] ) ? esc_attr( $settings['condition'] ) : '';
$number             = isset( $settings['number'] ) ? absint( $settings['number'] ) : '';
?>
<div class="discountx-container discountx-options-wrapper wrap">
    <form action="options.php" id="discountx-settings-form">

        <ul class="discountx-settings-nav">
            <li><a href="#general" id="general-tab"><?php esc_html_e( 'Condition', 'discountx' ); ?></a></li>
            <li><a href="#popup" id="popup-tab"><?php esc_html_e( 'Popup', 'discountx' ); ?></a></li>
            <li><a href="#styles" id="styles-tab"><?php esc_html_e( 'Styles', 'discountx' ); ?></a></li>
        </ul>

        <div class="discountx-options-box" id="general">
            <h2 class="discountx-options-box-header">
                <i class="dashicons-before dashicons-admin-generic"></i> <?php esc_html_e( 'Display Condition Settings', 'discountx' ); ?>
            </h2>
            <div class="discountx-options-settings-section">
                <div class="discountx-flex">
                    <div class="discountx-settings-panel coupon-code-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Coupon Code', 'discountx' ); ?></h4>
							<p class="desc"><?php esc_html_e( 'Select coupon code to apply when user will click on the popup apply button.', 'discountx' ); ?></p>
                        </div>
                        <div class="discountx-settings-control">
                            <?php if ( ! empty( $coupons ) ) : ?>
                                <select name="savedCoupon" id="saved-coupon" class="saved-coupon">
                                    <?php foreach( $coupons as $coupon ) {
                                        printf(
                                            '<option value="%s" %s>%s</option>',
											esc_attr( $coupon->text ),
                                            selected( $savedCoupon, $coupon->text ),
                                            esc_attr( $coupon->text )
                                        );
                                    } ?>
                                </select>
                            <?php endif; ?>
                        </div>
                    </div><!-- /.discountx-settings-panel.coupon-code-setting -->

                    <div class="discountx-settings-panel appearance-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Appearance', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <select name="appearance" id="appearance">
                                <option value="show" <?php selected( $appearance, 'show' ); ?>>
                                    <?php esc_html_e( 'Show', 'discountx' ); ?>
                                </option>
                                <option value="dont-show" <?php selected( $appearance, 'dont-show' ); ?>>
                                    <?php esc_html_e( "Don't show", 'discountx' ); ?>
                                </option>
                            </select>
                        </div>
                    </div><!-- /.discountx-settings-panel.appearance-setting -->

                    <div class="discountx-settings-panel cart-type-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Cart type', 'discountx' ); ?></h4>
							<p class="desc"><?php esc_html_e( 'Select Cart Type condition.', 'discountx' ); ?></p>
                        </div>
                        <div class="discountx-settings-control">
                            <select name="cart_type" id="cart_type">
                                <option value="money" <?php selected( $cartType, 'money' ); ?>>
                                    <?php esc_html_e( 'Cart money value', 'discountx' ); ?>
                                </option>
                                <option value="items" <?php selected( $cartType, 'items' ); ?>>
                                    <?php esc_html_e( 'Number of cart items', 'discountx' ); ?>
                                </option>
                                <option value="products" <?php selected( $cartType, 'products' ); ?>>
                                    <?php esc_html_e( 'Products in the cart', 'discountx' ); ?>
                                </option>
                            </select>
                        </div>
                    </div><!-- /.discountx-settings-panel.cart-type-setting -->

                    <div class="discountx-settings-panel condition-setting<?php echo ( 'products' === $cartType ) ? ' hidden' : '' ?>">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Condition', 'discountx' ); ?></h4>
							<p class="desc"><?php esc_html_e( 'Select the condition.', 'discountx' ); ?></p>
                        </div>
                        <div class="discountx-settings-control">
                            <select name="condition" id="condition">
                                <option value="over_oresc_html_equal" <?php selected( $condition, 'over_oresc_html_equal' ); ?>>
                                    <?php esc_html_e( 'Over or equal', 'discountx' ); ?>
                                </option>
                                <option value="equal" <?php selected( $condition, 'equal' ); ?>>
                                    <?php esc_html_e( 'Equal', 'discountx' ); ?>
                                </option>
                                <option value="under" <?php selected( $condition, 'under' ); ?>>
                                    <?php esc_html_e( 'Under', 'discountx' ); ?>
                                </option>
                            </select>
                        </div>
                    </div><!-- /.discountx-settings-panel.condition-setting -->

                    <div class="discountx-settings-panel products-setting<?php echo ( 'products' === $cartType ) ? '' : ' hidden' ?>">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Products', 'discountx' ); ?></h4>
							<p class="desc"><?php esc_html_e( 'Choose products.', 'discountx' ); ?></p>
                        </div>
                        <div class="discountx-settings-control">
                            <?php if ( ! empty( $products ) ) : ?>
                                <select name="products[]" id="products" class="products" multiple="true">
                                    <?php foreach( $products as $product ) {
                                        printf(
                                            '<option value="%d" %s>%s</option>',
                                            absint( $product->id ),
                                            in_array( absint( $product->id ), $productIds ) ? 'selected="selected"' : '',
                                            esc_attr( $product->text )
                                        );
                                    } ?>
                                </select>
                            <?php endif; ?>
                        </div>
                    </div><!-- /.discountx-settings-panel.products-setting -->

                    <div class="discountx-settings-panel number-setting<?php echo ( 'products' === $cartType ) ? ' hidden' : '' ?>">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Number', 'discountx' ); ?></h4>
							<p class="desc"><?php esc_html_e( 'The number to set the condition.', 'discountx' ); ?></p>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                type="number"
                                name="number"
                                id="number"
                                value="<?php echo absint( $number ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.number-setting -->

                </div>
            </div>
        </div><!-- /.end of general settings -->

        <div class="discountx-options-box" id="popup">
            <h2 class="discountx-options-box-header">
                <i class="dashicons-before dashicons-megaphone"></i> <?php esc_html_e( 'Popup Settings', 'discountx' ); ?>
            </h2>
            <div class="discountx-options-settings-section">
                <div class="discountx-flex">

                    <div class="discountx-settings-panel popup-display-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Display On', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <select name="displayOn" id="display-on">
                                <option value="cart_page" <?php selected( $displayOn, 'cart_page' ); ?>>
                                    <?php esc_html_e( 'Cart Page', 'discountx' ); ?>
                                </option>
                                <option value="every_page" <?php selected( $displayOn, 'every_page' ); ?>>
                                    <?php esc_html_e( "Every Page", 'discountx' ); ?>
                                </option>
                            </select>
                        </div>
                    </div><!-- /.discountx-settings-panel.popup-styles-setting -->

                    <div class="discountx-settings-panel popup-styles-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Theme', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <select name="theme" id="popup-styles">
                                <option value="theme-1" <?php selected( $theme, 'style_1' ); ?>>
                                    <?php esc_html_e( 'Theme 1', 'discountx' ); ?>
                                </option>
                                <option value="theme-2" <?php selected( $theme, 'style_2' ); ?> disabled>
                                    <?php esc_html_e( "Theme 2 (PRO)", 'discountx' ); ?>
                                </option>
                                <option value="theme-3" <?php selected( $theme, 'style_3' ); ?> disabled>
                                    <?php esc_html_e( "Theme 3 (PRO)", 'discountx' ); ?>
                                </option>
								<option value="theme-4" <?php selected( $theme, 'style_3' ); ?> disabled>
									<?php esc_html_e( "Theme 3 (PRO)", 'discountx' ); ?>
								</option>
                            </select>
                        </div>
                    </div><!-- /.discountx-settings-panel.popup-styles-setting -->

                    <div class="discountx-settings-panel popup-image-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Image', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
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
                            <button id="discountx-upload-popup-image"><i class="dashicons-before dashicons-cloud-upload"></i></button>
                        </div>
                    </div><!-- /.discountx-settings-panel.popup-title-setting -->

                    <div class="discountx-settings-panel popup-pre-title-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Pre Title', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                type="text"
                                name="popupPreTitle"
                                id="popup-pre-title"
                                value="<?php echo esc_attr( $popupPreTitle ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.popup-title-setting -->

                    <div class="discountx-settings-panel popup-title-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Title', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                type="text"
                                name="popupTitle"
                                id="popup-title"
                                value="<?php echo esc_attr( $popupTitle ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.popup-title-setting -->

                    <div class="discountx-settings-panel popup-content-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Content', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <textarea
                                name="popupContent"
                                id="popup-content"
                                cols="30"
                                rows="10"><?php echo esc_html( $popupContent ); ?></textarea>
                        </div>
                    </div><!-- /.discountx-settings-panel.popup-title-setting -->

                    <div class="discountx-settings-panel popup-button-text-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Button Text', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                type="text"
                                name="buttonText"
                                id="button-text"
                                value="<?php echo esc_attr( $buttonText ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.popup-title-setting -->
                </div>
            </div>
        </div><!-- /. end of popup settings -->

        <div class="discountx-options-box" id="styles">
            <h2 class="discountx-options-box-header">
                <i class="dashicons-before dashicons-art"></i> <?php esc_html_e( 'Style Settings', 'discountx' ); ?>
            </h2>
            <div class="discountx-options-settings-section">
                <div class="discountx-flex">

                    <div class="discountx-settings-panel title-fontsize-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Title Font Size', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                type="number"
                                name="titleFontSize"
                                id="title-font-size"
                                value="<?php echo absint( $titleFontSize ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.coupon-code-setting -->

                    <div class="discountx-settings-panel title-color-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Title Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                class="discountx-color-control"
                                type="text"
                                name="titleColor"
                                id="title-color"
                                value="<?php echo esc_attr( $titleColor ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.coupon-code-setting -->

                    <div class="discountx-settings-panel content-color-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Content Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                class="discountx-color-control"
                                type="text"
                                name="contentColor"
                                id="content-color"
                                value="<?php echo esc_attr( $contentColor ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.coupon-code-setting -->

                    <div class="discountx-settings-panel button-fontsize-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Button Font Size', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                type="number"
                                name="buttonFontSize"
                                id="button-font-size"
                                value="<?php echo absint( $buttonFontSize ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.coupon-code-setting -->

                    <div class="discountx-settings-panel button-color-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Button Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                class="discountx-color-control"
                                type="text"
                                name="buttonColor"
                                id="button-color"
                                value="<?php echo esc_attr( $buttonColor ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.coupon-code-setting -->

                    <div class="discountx-settings-panel button-hover-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Button Hover Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                class="discountx-color-control"
                                type="text"
                                name="buttonHoverColor"
                                id="button-hover-color"
                                value="<?php echo esc_attr( $buttonHoverColor ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.coupon-code-setting -->

                    <div class="discountx-settings-panel button-bg-color-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Button Background Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                class="discountx-color-control"
                                type="text"
                                name="buttonBgColor"
                                id="button-bg-color"
                                value="<?php echo esc_attr( $buttonBgColor ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.coupon-code-setting -->

                    <div class="discountx-settings-panel button-hover-bg-color-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Button Hover Background Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                class="discountx-color-control"
                                type="text"
                                name="buttonHoverBgColor"
                                id="button-hover-bg-color"
                                value="<?php echo esc_attr( $buttonHoverBgColor ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.coupon-code-setting -->

                    <div class="discountx-settings-panel popup-background-setting">
                        <div class="discountx-settings-label">
                            <h4><?php esc_html_e( 'Popup Background Color', 'discountx' ); ?></h4>
                        </div>
                        <div class="discountx-settings-control">
                            <input
                                class="discountx-color-control"
                                type="text"
                                name="popupBgColor"
                                id="popup-bg-color"
                                value="<?php echo esc_attr( $popupBgColor ); ?>"
                            />
                        </div>
                    </div><!-- /.discountx-settings-panel.coupon-code-setting -->

                </div>
            </div>
        </div><!-- /.end of style settings -->

        <div class="discountx-save-changes">
            <button type="submit" id="save-discountx-settings" class="button button-primary">
                <div class="discountx-loading-spinner">
                    <div class="double-bounce1"></div>
                    <div class="double-bounce2"></div>
                </div>
                <?php esc_html_e( 'Save Changes', 'discountx' ); ?>
            </button>
        </div>

        <input type="hidden" name="nonce" id="nonce" value="<?php echo wp_create_nonce( 'discountx_save_settings_action' ); ?>">
    </form>

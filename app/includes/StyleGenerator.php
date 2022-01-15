<?php

namespace DISCOUNTX;

// if direct access than exit the file.
defined('ABSPATH') || exit;

/**
 * Responsible for generating the popup styles based on the settings.
 * 
 * @since 1.0.0
 */
class StyleGenerator {

	/**
	 * Generate dynamic style.
	 * 
	 * @since 1.0.0
	 */
	public function generatePopupStyles() {
		$css = '';
		$titleFontSize      = discountx()->helpers->getSettings( 'titleFontSize', 60 );
		$titleColor         = discountx()->helpers->getSettings( 'titleColor' );
		$buttonFontSize     = discountx()->helpers->getSettings( 'buttonFontSize', 15 );
		$contentColor       = discountx()->helpers->getSettings( 'contentColor' );
		$buttonColor        = discountx()->helpers->getSettings( 'buttonColor' );
		$buttonHoverColor   = discountx()->helpers->getSettings( 'buttonHoverColor' );
		$buttonBgColor      = discountx()->helpers->getSettings( 'buttonBgColor' );
		$buttonHoverBgColor = discountx()->helpers->getSettings( 'buttonHoverBgColor' );
		$popupBgColor       = discountx()->helpers->getSettings( 'popupBgColor' );

		if ( $titleFontSize ) {
			$css .= "
				.discountx-popup-content .discountx-popup-title { font-size: {$titleFontSize}px; }
			";
		}

		if ( $titleColor ) {
			$css .= "
				.discountx-popup-content .discountx-popup-title { color: $titleColor; }
			";
		}

		if ( $contentColor ) {
			$css .= "
				.discountx-popup-content .discountx-popup-desc { color: $contentColor; }
			";
		}

		if ( $buttonFontSize ) {
			$css .= "
				.discountx-popup-content .discountx-popup-button { font-size: {$buttonFontSize}px; }
			";
		}

		if ( $buttonColor ) {
			$css .= "
				.discountx-popup-content .discountx-popup-button { color: $buttonColor; }
			";
		}

		if ( $buttonBgColor ) {
			$css .= "
				.discountx-popup-content .discountx-popup-button { background-color: $buttonBgColor; }
			";
		}

		if ( $buttonHoverColor ) {
			$css .= "
				.discountx-popup-content .discountx-popup-button:hover { color: $buttonHoverColor; }
			";
		}

		if ( $buttonHoverBgColor ) {
			$css .= "
				.discountx-popup-content .discountx-popup-button:hover { background-color: $buttonHoverBgColor; }
			";
		}

		if ( $popupBgColor ) {
			$css .= "
				.discountx-popup { background-color: $buttonHoverBgColor; }
			";
		}

		return $css;
	}

}

<?php

namespace CT;

// if direct access than exit the file.
defined('ABSPATH') || exit;

class StyleGenerator {

	public function generatePopupStyles() {
		$css = '';
		$titleFontSize      = ct()->helpers->getSettings( 'titleFontSize', 60 );
		$titleColor         = ct()->helpers->getSettings( 'titleColor' );
		$buttonFontSize     = ct()->helpers->getSettings( 'buttonFontSize', 15 );
		$contentColor       = ct()->helpers->getSettings( 'contentColor' );
		$buttonColor        = ct()->helpers->getSettings( 'buttonColor' );
		$buttonHoverColor   = ct()->helpers->getSettings( 'buttonHoverColor' );
		$buttonBgColor      = ct()->helpers->getSettings( 'buttonBgColor' );
		$buttonHoverBgColor = ct()->helpers->getSettings( 'buttonHoverBgColor' );
		$popupBgColor       = ct()->helpers->getSettings( 'popupBgColor' );

		if ( $titleFontSize ) {
			$css .= "
				.ct-popup-content .ct-popup-title { font-size: {$titleFontSize}px; }
			";
		}

		if ( $titleColor ) {
			$css .= "
				.ct-popup-content .ct-popup-title { color: $titleColor; }
			";
		}

		if ( $contentColor ) {
			$css .= "
				.ct-popup-content .ct-popup-desc { color: $contentColor; }
			";
		}

		if ( $buttonFontSize ) {
			$css .= "
				.ct-popup-content .ct-popup-button { font-size: {$buttonFontSize}px; }
			";
		}

		if ( $buttonColor ) {
			$css .= "
				.ct-popup-content .ct-popup-button { color: $buttonColor; }
			";
		}

		if ( $buttonBgColor ) {
			$css .= "
				.ct-popup-content .ct-popup-button { background-color: $buttonBgColor; }
			";
		}

		if ( $buttonHoverColor ) {
			$css .= "
				.ct-popup-content .ct-popup-button:hover { color: $buttonHoverColor; }
			";
		}

		if ( $buttonHoverBgColor ) {
			$css .= "
				.ct-popup-content .ct-popup-button:hover { background-color: $buttonHoverBgColor; }
			";
		}

		if ( $popupBgColor ) {
			$css .= "
				.ct-popup { background-color: $buttonHoverBgColor; }
			";
		}

		return $css;
	}

}

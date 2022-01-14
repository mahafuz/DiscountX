<?php

namespace DX;

// if direct access than exit the file.
defined('ABSPATH') || exit;

class StyleGenerator {

	public function generatePopupStyles() {
		$css = '';
		$titleFontSize      = DX()->helpers->getSettings( 'titleFontSize', 60 );
		$titleColor         = DX()->helpers->getSettings( 'titleColor' );
		$buttonFontSize     = DX()->helpers->getSettings( 'buttonFontSize', 15 );
		$contentColor       = DX()->helpers->getSettings( 'contentColor' );
		$buttonColor        = DX()->helpers->getSettings( 'buttonColor' );
		$buttonHoverColor   = DX()->helpers->getSettings( 'buttonHoverColor' );
		$buttonBgColor      = DX()->helpers->getSettings( 'buttonBgColor' );
		$buttonHoverBgColor = DX()->helpers->getSettings( 'buttonHoverBgColor' );
		$popupBgColor       = DX()->helpers->getSettings( 'popupBgColor' );

		if ( $titleFontSize ) {
			$css .= "
				.dx-popup-content .dx-popup-title { font-size: {$titleFontSize}px; }
			";
		}

		if ( $titleColor ) {
			$css .= "
				.dx-popup-content .dx-popup-title { color: $titleColor; }
			";
		}

		if ( $contentColor ) {
			$css .= "
				.dx-popup-content .dx-popup-desc { color: $contentColor; }
			";
		}

		if ( $buttonFontSize ) {
			$css .= "
				.dx-popup-content .dx-popup-button { font-size: {$buttonFontSize}px; }
			";
		}

		if ( $buttonColor ) {
			$css .= "
				.dx-popup-content .dx-popup-button { color: $buttonColor; }
			";
		}

		if ( $buttonBgColor ) {
			$css .= "
				.dx-popup-content .dx-popup-button { background-color: $buttonBgColor; }
			";
		}

		if ( $buttonHoverColor ) {
			$css .= "
				.dx-popup-content .dx-popup-button:hover { color: $buttonHoverColor; }
			";
		}

		if ( $buttonHoverBgColor ) {
			$css .= "
				.dx-popup-content .dx-popup-button:hover { background-color: $buttonHoverBgColor; }
			";
		}

		if ( $popupBgColor ) {
			$css .= "
				.dx-popup { background-color: $buttonHoverBgColor; }
			";
		}

		return $css;
	}

}

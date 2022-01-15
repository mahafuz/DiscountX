<?php
// if direct access than exit the file.
defined('ABSPATH') || exit;

/**
 * Theme Name: Theme 1
 * @package  : DiscountX
 * @since    : 1.0.0
 */
$preTitle   = discountx()->helpers->getSettings( 'popupPreTitle' );
$title      = discountx()->helpers->getSettings( 'popupTitle' );
$content    = discountx()->helpers->getSettings( 'popupContent' );
$buttonText = discountx()->helpers->getSettings( 'buttonText' );
$img        = discountx()->helpers->getSettings( 'popupImage' );
$theme      = discountx()->helpers->getSettings( 'theme' );
?>

<?php printf( '<div class="discountx-overlay %s">', $theme ); ?>
	<div class="discountx-popup">
		<div id="discountx-close"></div>
		<div class="discountx-popup-inner">
			<div class="discountx-popup-content">
				<?php if ( ! empty( $preTitle ) ) : ?><h4 class="discountx-popup-pre-title"><?php echo esc_attr( $preTitle ); ?></h4><?php endif; ?>
				<?php if ( ! empty( $title ) ) : ?><h2 class="discountx-popup-title"><?php echo esc_attr( $title ); ?></h2><?php endif; ?>
				<?php if ( ! empty( $content ) ) : ?><p class="discountx-popup-desc"><?php echo esc_attr( $content ); ?></p><?php endif; ?>
				<?php if ( ! empty( $buttonText ) ) : ?><?php printf( '<button id="discountx-apply-cupon" class="discountx-popup-button">%s</button>', esc_attr( $buttonText ) ); ?><?php endif; ?>
			</div>

			<?php if ( ! empty( $img ) ) : ?>
			<div class="discountx-popup-img">
				<img src="<?php echo esc_url( $img ); ?>" />
			</div>
			<?php endif; ?>
		</div>
	</div>
</div>

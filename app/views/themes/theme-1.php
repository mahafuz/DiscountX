<?php
	$preTitle   = ct()->helpers->getSettings( 'popupPreTitle' );
	$title      = ct()->helpers->getSettings( 'popupTitle' );
	$content    = ct()->helpers->getSettings( 'popupContent' );
	$buttonText = ct()->helpers->getSettings( 'buttonText' );
	$img        = ct()->helpers->getSettings( 'popupImage' );
	$theme      = ct()->helpers->getSettings( 'theme' );
?>

<?php printf( '<div class="ct-overlay %s">', $theme ); ?>
	<div class="ct-popup">
		<div id="ct-close"></div>
		<div class="ct-popup-inner">
			<div class="ct-popup-content">
				<?php if ( ! empty( $preTitle ) ) : ?><h4 class="ct-popup-pre-title"><?php echo esc_attr( $preTitle ); ?></h4><?php endif; ?>
				<?php if ( ! empty( $title ) ) : ?><h2 class="ct-popup-title"><?php echo esc_attr( $title ); ?></h2><?php endif; ?>
				<?php if ( ! empty( $content ) ) : ?><p class="ct-popup-desc"><?php echo esc_attr( $content ); ?></p><?php endif; ?>
				<?php if ( ! empty( $buttonText ) ) : ?><?php printf( '<button id="ct-apply-cupon" class="ct-popup-button">%s</button>', $buttonText ); ?><?php endif; ?>
			</div>

			<?php if ( ! empty( $img ) ) : ?>
			<div class="ct-popup-img">
				<img src="<?php echo esc_url( $img ); ?>" alt="">
			</div>
			<?php endif; ?>
		</div>
	</div>
</div>

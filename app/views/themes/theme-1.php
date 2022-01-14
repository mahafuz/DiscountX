<?php
	$preTitle   = DX()->helpers->getSettings( 'popupPreTitle' );
	$title      = DX()->helpers->getSettings( 'popupTitle' );
	$content    = DX()->helpers->getSettings( 'popupContent' );
	$buttonText = DX()->helpers->getSettings( 'buttonText' );
	$img        = DX()->helpers->getSettings( 'popupImage' );
	$theme      = DX()->helpers->getSettings( 'theme' );
?>

<?php printf( '<div class="dx-overlay %s">', $theme ); ?>
	<div class="dx-popup">
		<div id="dx-close"></div>
		<div class="dx-popup-inner">
			<div class="dx-popup-content">
				<?php if ( ! empty( $preTitle ) ) : ?><h4 class="dx-popup-pre-title"><?php echo esc_attr( $preTitle ); ?></h4><?php endif; ?>
				<?php if ( ! empty( $title ) ) : ?><h2 class="dx-popup-title"><?php echo esc_attr( $title ); ?></h2><?php endif; ?>
				<?php if ( ! empty( $content ) ) : ?><p class="dx-popup-desc"><?php echo esc_attr( $content ); ?></p><?php endif; ?>
				<?php if ( ! empty( $buttonText ) ) : ?><?php printf( '<button id="dx-apply-cupon" class="dx-popup-button">%s</button>', $buttonText ); ?><?php endif; ?>
			</div>

			<?php if ( ! empty( $img ) ) : ?>
			<div class="dx-popup-img">
				<img src="<?php echo esc_url( $img ); ?>" alt="">
			</div>
			<?php endif; ?>
		</div>
	</div>
</div>

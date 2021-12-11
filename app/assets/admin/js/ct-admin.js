(function( $ ) {
    $(document).ready(function() {

        $( '.ct-color-control' ).wpColorPicker();
        $( '.ct-options-box' ).hide();

        var activetab = '';
        if ( typeof(localStorage) != 'undefined' ) {
            activetab = localStorage.getItem("activetab");
        }

        if ( activetab != '' && $(activetab).length ) {
            $(activetab).fadeIn();
        } else {
            $('.ct-options-box:first').fadeIn();
        }

        if ( activetab != '' && $(activetab + '-tab').length ) {
            $(activetab + '-tab').addClass('ct-tab-active');
        } else {
            $('.ct-settings-nav li:first > a').addClass('ct-tab-active');
        }

        $('.ct-settings-nav > li > a').on( 'click', function(ev) {
            ev.preventDefault();

            $('.ct-settings-nav > li > a').removeClass('ct-tab-active');
            $(this).addClass('ct-tab-active').blur();
            
            var clicked_group = $( this ).attr( 'href' );

            if ( typeof(localStorage) != 'undefined' ) {
                localStorage.setItem( "activetab", $( this ).attr( 'href' ) );
            }

            $('.ct-options-box').hide();
            $( clicked_group ).fadeIn();
        });

        // appearance
        $( '#saved-coupon' ).select2({
            minimumResultsForSearch: Infinity,
            width: 'resolve'
        });

        // appearance
        $( '#appearance' ).select2({
            minimumResultsForSearch: Infinity,
            width: 'resolve'
        });

        $( '#popup-styles' ).select2({
            minimumResultsForSearch: Infinity,
            width: 'resolve'
        });

        // cart-type
        $( '#cart_type' ).select2({
            minimumResultsForSearch: Infinity,
            width: 'resolve'
        });

        // condition
        $( '#condition' ).select2({
            minimumResultsForSearch: Infinity,
            width: 'resolve'
        });

        // products
        var $products = $( '#products' );
            $products.select2({
                multiple: true,
                width: 'resolve'
            });

        $( '#cart_type' ).on( 'change', function(e) {
            if ( 'products' === e.target.value ) {
                $( '.products-setting' ).removeClass( 'hidden' );
                $( '.number-setting' ).addClass( 'hidden' );
                $( '.condition-setting' ).addClass( 'hidden' );
            } else {
                $( '.products-setting' ).addClass( 'hidden' );
                $( '.number-setting' ).removeClass( 'hidden' );
                $( '.condition-setting' ).removeClass( 'hidden' );
            }
        });

        $( '#save-ct-settings' ).on( 'click', function(e) {
            e.preventDefault();

            var $button = $(this);

            $button.addClass('loading');

            var formData = new FormData(),
                $cartType    = $( '#cart_type' ).val(),
                $numberValue = $( '#number' ).val();

                // check if products field is empty
                if ( 'products' === $cartType ) {
                    var $selectedProducts = $( '#select2-products-container').children( 'li' ).length;

                    $( '.ct-settings-panel.products-setting' ).find( '.select2-selection' ).css( 'border-color', '#d0d1d7' );

                    if ( $selectedProducts < 1 ) {
                        $( '.ct-settings-panel.products-setting' ).find( '.select2-selection' ).css( 'border-color', 'red' );
                        $button.removeClass('loading');
                        return;
                    }
                } else {
                    if( '' == $numberValue ) {
                        $('#number').css( 'border-color', 'red' );
                        $button.removeClass('loading');
                        return;
                    } else {
                        $('#number').css( 'border-color', '#d0d1d7' );
                    }
                }

            formData.append('action', 'ct_save_settings');
            formData.append('savedCoupon', $( '#saved-coupon' ).val() );
            formData.append('appearance', $( '#appearance' ).val() );
            formData.append( 'theme', $( '#popup-styles' ).val() );

            formData.append( 'popupTitle', $( '#popup-title' ).val() );
            formData.append( 'titleFontSize', $( '#title-font-size' ).val() );
            formData.append( 'titleColor', $( '#title-color' ).val() );
            formData.append( 'contentColor', $( '#content-color' ).val() );
            formData.append( 'buttonFontSize', $( '#button-font-size' ).val() );
            formData.append( 'buttonColor', $( '#button-color' ).val() );
            formData.append( 'buttonHoverColor', $( '#button-hover-color' ).val() );
            formData.append( 'buttonBgColor', $( '#button-bg-color' ).val() );
            formData.append( 'buttonHoverBgColor', $( '#button-hover-bg-color' ).val() );
            formData.append( 'popupBgColor', $( '#popup-bg-color' ).val() );

            formData.append( 'popupContent', $( '#popup-content' ).val() );
            formData.append( 'buttonText', $( '#button-text' ).val() );
            formData.append('cart_type', $cartType );
            formData.append('condition', $( '#condition' ).val() );
            formData.append('products', $( '#products' ).val() );
            formData.append('number', $numberValue );
            formData.append('nonce', $( '#nonce' ).val() );

            $.ajax({
                type        : 'POST',
                url         : CT_ADMIN.ajaxUrl,
                data        : formData,
                contentType : false,
			    processData : false,
                success : function( response ) {
                    setTimeout( function() {
                        $button.removeClass('loading');
                    }, 500 );
                },
                error: function( error ) {
                    console.error( error );
                }
            });
        });
    });
} )(jQuery);
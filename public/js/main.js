/*  ---------------------------------------------------
    Theme Name: Cake
    Description: Cake e-commerce tamplate
    Author: Colorib
    Author URI: https://www.colorib.com/
    Version: 1.0
    Created: Colorib
---------------------------------------------------------  */

'use strict';


(function ($) {

    /*------------------
        Preloader
    --------------------*/
    $(window).on('load', function () {
        $(".loader").fadeOut();
        $("#preloder").delay(200).fadeOut("slow");
    });

    /*------------------
        Background Set
    --------------------*/
    $('.set-bg').each(function () {
        var bg = $(this).data('setbg');
        $(this).css('background-image', 'url(' + bg + ')');
    });

    //Search Switch
    $('.search-switch').on('click', function () {
        $('.search-model').fadeIn(400);
    });

    $('.search-close-switch').on('click', function () {
        $('.search-model').fadeOut(400, function () {
            $('#search-input').val('');
        });
    });

    //Canvas Menu
    $(".canvas__open").on('click', function () {
        $(".offcanvas-menu-wrapper").addClass("active");
        $(".offcanvas-menu-overlay").addClass("active");
    });

    $(".offcanvas-menu-overlay").on('click', function () {
        $(".offcanvas-menu-wrapper").removeClass("active");
        $(".offcanvas-menu-overlay").removeClass("active");
    });


    /*------------------
		Navigation
	--------------------*/
    $(".mobile-menu").slicknav({
        prependTo: '#mobile-menu-wrap',
        allowParentLinks: true
    });

    /*-----------------------
        Hero Slider
    ------------------------*/
    $(".hero__slider").owlCarousel({
        loop: true,
        margin: 0,
        items: 1,
        dots: false,
        nav: true,
        navText: ["<i class='fa fa-angle-left'><i/>", "<i class='fa fa-angle-right'><i/>"],
        animateOut: 'fadeOut',
        animateIn: 'fadeIn',
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: false
    });

    /*--------------------------
        Categories Slider
    ----------------------------*/
    $(".categories__slider").owlCarousel({
        loop: true,
        margin: 22,
        items: 5,
        dots: false,
        nav: true,
        navText: ["<span class='arrow_carrot-left'><span/>", "<span class='arrow_carrot-right'><span/>"],
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: false,
        responsive: {
            0: {
                items: 1,
                margin: 0
            },
            480: {
                items: 2
            },
            768: {
                items: 3
            },
            992: {
                items: 4
            },
            1200: {
                items: 5
            }
        }
    });

    /*-----------------------------
        Testimonial Slider
    -------------------------------*/
    $(".testimonial__slider").owlCarousel({
        loop: true,
        margin: 0,
        items: 2,
        dots: true,
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: true,
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            }
        }
    });

    /*---------------------------------
        Related Products Slider
    ----------------------------------*/
    $(".related__products__slider").owlCarousel({
        loop: true,
        margin: 0,
        items: 4,
        dots: false,
        nav: true,
        navText: ["<span class='arrow_carrot-left'><span/>", "<span class='arrow_carrot-right'><span/>"],
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: true,
        responsive: {
            0: {
                items: 1
            },
            480: {
                items: 2
            },
            768: {
                items: 3
            },
            992: {
                items: 4
            },
        }
    });

    /*--------------------------
        Select
    ----------------------------*/
    $("select").niceSelect();

    /*------------------
		Magnific
	--------------------*/
    $('.video-popup').magnificPopup({
        type: 'iframe'
    });

    /*------------------
        Barfiller
    --------------------*/
    $('#bar1').barfiller({
        barColor: '#111111',
        duration: 2000
    });
    $('#bar2').barfiller({
        barColor: '#111111',
        duration: 2000
    });
    $('#bar3').barfiller({
        barColor: '#111111',
        duration: 2000
    });


    /*------------------
		Single Product
	--------------------*/
    $('.product__details__thumb img').on('click', function () {
        $('.product__details__thumb .pt__item').removeClass('active');
        $(this).addClass('active');
        var imgurl = $(this).data('imgbigurl');
        var bigImg = $('.big_img').attr('src');
        if (imgurl != bigImg) {
            $('.big_img').attr({
                src: imgurl
            });
        }
    });

    /*-------------------
		Quantity change
	--------------------- */
    var proQty = $('.pro-qty');
    proQty.prepend('<span class="dec qtybtn">-</span>');
    proQty.append('<span class="inc qtybtn">+</span>');
    
    proQty.on('click', '.qtybtn', function () {
        var $button = $(this);
        var $input = $button.parent().find('input');
        var oldValue = parseFloat($input.val());
        var maxQty = parseFloat($input.attr('data-max'));
        var productId = $input.attr('data-product-id');
        var itemWeight = parseFloat($input.attr('data-item-weight'));
        // Determine new quantity
        var newVal = oldValue;
        if ($button.hasClass('inc')) {
            newVal = oldValue < maxQty && oldValue < 5 ? oldValue + 1 : Math.min(maxQty, 5);
        } else {
            newVal = oldValue > 1 ? oldValue - 1 : 1; // Minimum quantity of 1
        }
    
        // Update the input value
        $input.val(newVal);
    
        // Calculate new total for the item
        var itemPrice = parseFloat($input.closest('tr').find('.product__cart__item__text h5').text().replace('Rs', '').trim());
        var itemTotal = newVal *  itemPrice;
        $input.closest('tr').find('.cart__price').text(`Rs ${itemTotal.toFixed(2)}`);
    
        // Function to calculate and update total cart price
        function updateTotalCartPrice() {
            let subtotal = 0;
            $('.cart__price').each(function () {
                subtotal += parseFloat($(this).text().replace('Rs', '').trim());
            });
    
            // Update subtotal
            $('#subtotal').text(`Rs ${subtotal.toFixed(2)}`);
    
            // Handle discounts (optional)
            let discount = parseFloat($('#discount-amount').text().trim()) || 0;
            let total = subtotal;
    
            // Update total price
            $('#old-total span').text(`Rs ${total.toFixed(2)}`);
    
        } 
    
        // Update total cart price
        updateTotalCartPrice();
    
        // Send the updated quantity to the server
        $.ajax({
            url: '/cart/update',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                productId: productId,
                quantity: newVal,
                weight: itemWeight 
            }),
            success: function (response) {
                console.log('Cart updated:', response);
                // Optionally, update the total price from the server's response
                if (response.totalCartPrice) {
                    $('#subtotal').text(`Rs ${response.totalCartPrice.toFixed(2)}`);
                    $('#old-total span').text(`Rs ${response.totalCartPrice.toFixed(2)}`);
                }
            },
            error: function (err) {
                console.error('Error updating cart:', err);
            }
        });
    });
    
    

    $(".product__details__thumb").niceScroll({
        cursorborder: "",
        cursorcolor: "rgba(0, 0, 0, 0.5)",
        boxzoom: false
      });

})(jQuery);
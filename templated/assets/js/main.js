/*
	Visualize by TEMPLATED
	templated.co @templatedco
	Released for free under the Creative Commons Attribution 3.0 license (templated.co/license)
*/

$(function() {

	// Vars.
		var	$window = $(window),
			$body = $('body'),
			$wrapper = $('#wrapper');

	// Breakpoints.
		skel.breakpoints({
			xlarge:	'(max-width: 1680px)',
			large:	'(max-width: 1280px)',
			medium:	'(max-width: 980px)',
			small:	'(max-width: 736px)',
			xsmall:	'(max-width: 480px)'
		});

	// Disable animations/transitions until everything's loaded.
		$body.addClass('is-loading');

		$window.on('load', function() {
			$body.removeClass('is-loading');
		});

	// Poptrox.
		$window.on('load', function() {

			$('.thumbnails').poptrox({
				onPopupClose: function() { $body.removeClass('is-covered'); },
				onPopupOpen: function() { $body.addClass('is-covered'); },
				baseZIndex: 10001,
				useBodyOverflow: false,
				usePopupEasyClose: true,
				overlayColor: '#000000',
				overlayOpacity: 0.75,
				popupLoaderText: '',
				fadeSpeed: 500,
				usePopupDefaultStyling: false,
				windowMargin: (skel.breakpoint('small').active ? 5 : 50)
			});

		});

		var deadlineEpoch = new Date("14 Oct 2016 16:00 UTC").getTime() / 1000;

		function getTimeLeft(deadlineEpoch) {
			 var diffSeconds = deadlineEpoch - Math.round(Date.now()/1000);
			 var days = Math.round(diffSeconds / (3600*24));
			 var hours = Math.round((diffSeconds % (days*3600*24)) / 3600);
			 var minutes = Math.round((diffSeconds % (hours*3600)) / 60);
			 var seconds = diffSeconds % (60);
			 return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds left`
		}

		setInterval(function() { $("#time").html(getTimeLeft(deadlineEpoch));}, 1000);

});

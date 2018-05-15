(function(){

	function Minimalist(config) {

		this.config = {};
		this.config.ajaxTransition    = config.ajaxTransition || false;
		this.config.fixedMobileHeader = config.fixedMobileHeader || false;

		this.dom = {};
		this.dom.overlay 			= document.querySelector('.overlay');
		this.dom.longLoading 		= this.dom.overlay.querySelector('.long-loading-container');
		this.dom.containerToInsert 	= document.querySelector('.content-insert');

		document.addEventListener('DOMContentLoaded', function(){
			this.initTestimonialSlider();
		}.bind(this));

		this.hostName      = location.hostname;
		this.loadTimeout   = null;
		this.xhttp         = null;
		this.pageLoaded    = null;
		this.mobileNavOpen = false;
		this.isBack        = false;

		this.oldLinks = [];

		if (this.config.ajaxTransition) {
			window.onpopstate = function() {

				if (this.oldLinks.length > 0) {

					this.isBack = true;
					this.handleUrl(this.oldLinks[this.oldLinks.length - 1]);
				}
			}.bind(this);

			this.initPageTransition();
		}
		
		this.initNavigation();
	}

	Minimalist.prototype.initTestimonialSlider = function() {

		var owlContainer = $(".testimonials");

		if (owlContainer.length <= 0 ) {
			return null;
		}

		owlContainer.owlCarousel({ 
			loop:    true,
			nav:     true,
			navText: ['', ''],
			items:   1
		});
	}

	Minimalist.prototype.initPageTransition = function() {

		var links, link, url;

		links = document.querySelectorAll('a');

		if (links.length <= 0 ) {
			return null;
		}

		for (var i = 0, max = links.length; i < max; i++) {

			link = links[i];
			url  = link.href;

			if (url.indexOf('#') >= 0 || url.indexOf(this.hostName) < 0 || link.getAttribute('data-disabled') == 'true' || link.classList.contains('nav-list__link')) {
				continue;
			}

			links[i].onclick = function(e){
				e.preventDefault();

				var url = e.currentTarget.href;	

				this.isBack = false;
				this.handleUrl(url);
			}.bind(this);
		}		
	}

	Minimalist.prototype.handleUrl = function(url) {

		var transitionEnd;

		this.showOverlay();

		transitionEnd = function(){
			this.request(url, this.pageTransition, this.pageFailedTransition);	
			this.dom.overlay.removeEventListener('transitionend', transitionEnd);
		}.bind(this);

		this.dom.overlay.addEventListener('transitionend', transitionEnd, false);

		this.loadTimeout = setTimeout(function() {

			var backBtn, directBtn;

			backBtn   = this.dom.longLoading.querySelector('.js-overlay-hide');
			directBtn = this.dom.longLoading.querySelector('.js-direct');

			this.dom.longLoading.classList.remove('is-hidden');
			this.dom.overlay.firstElementChild.classList.add('is-hidden');

			directBtn.onclick = function() {
				this.hideOverlay();
				this.xhttp.removeEventListener('load', this.pageLoaded);
				location.replace(url);
			}.bind(this);

			backBtn.onclick = function() {
				this.hideOverlay();
				this.xhttp.removeEventListener('load', this.pageLoaded);
			}.bind(this);
			
		}.bind(this), 5000);    
	}

	Minimalist.prototype.pageTransition = function(responseHTML, url) {

		var fragment;

		this.isLoaded = true;

		window.scrollTo(0, 0);
		clearTimeout(this.loadTimeout);

        fragment = document.createElement('div');
        fragment.innerHTML = responseHTML;

        responseContainer = fragment.querySelector('.content-insert');
        this.dom.containerToInsert.innerHTML = '';
        this.dom.containerToInsert.innerHTML = responseContainer.innerHTML;

        this.dom.longLoading.classList.add('is-hidden');
        this.hideOverlay();

        // Restart function
        this.initPageTransition();
        this.initNavigation();
        this.initTestimonialSlider();

        if (this.isBack) {
        	this.oldLinks.pop();	
		} else {
			this.oldLinks.push(window.location.href);
		}

        window.history.pushState(null, null, url);    
	}

	Minimalist.prototype.pageFailedTransition = function(message) {
		console.error(message);
	}

	Minimalist.prototype.showOverlay = function() {
		this.dom.overlay.classList.remove('is-hidden');
		this.dom.overlay.classList.add('is-vissible');
	}

	Minimalist.prototype.hideOverlay = function() {
		this.dom.overlay.classList.remove('is-vissible');
        this.dom.overlay.classList.add('is-hidden'); 
	}


	// --------------------------- NAVIGATION ---------------------------
	Minimalist.prototype.initNavigation = function(selector) {

		var navToggle;

		this.dom.navContainer = document.querySelector('.navigation');

		navToggle = this.dom.navContainer.querySelector('.nav__toggle');

		navToggle.addEventListener('click', function(){
			this.toggleNavigation();
		}.bind(this)); 

		if (this.config.fixedMobileHeader) {
			this.initStickHeader();
		}

		this.clickMenuItem();
	}

	Minimalist.prototype.toggleNavigation = function() {

		if (!this.dom.navContainer.classList.contains('is-open')) {
			this.dom.navContainer.classList.add('is-open');
			document.body.classList.add('nav-open');
			this.mobileNavOpen = true;
		} else {
			this.dom.navContainer.classList.remove('is-open');
			document.body.classList.remove('nav-open');
			this.mobileNavOpen = false;
		}
	}

	Minimalist.prototype.clickMenuItem = function() {
		var navLinks = this.dom.navContainer.querySelectorAll('.nav-list__link');

		for (var i = 0, max = navLinks.length; i < max; i++) {
			navLinks[i].addEventListener('click', function(){
				this.toggleNavigation();
			}.bind(this));
		}
	}

	Minimalist.prototype.initStickHeader = function() {

		var header, headerHeight,
			isStick = false;

		header = document.querySelector('.header');
		headerHeight = header.offsetHeight;

		if ( !isStick && window.pageYOffset > headerHeight *2 ) {

			header.classList.add('is-stick');
			isStick = true;
		} else if (isStick && window.pageYOffset <= headerHeight) {

			header.classList.remove('is-stick');
			isStick = false;
		}

		window.addEventListener('scroll', function(e){
			if ( !isStick && window.pageYOffset > headerHeight * 2) {
				header.classList.add('is-stick');
				isStick = true;
			} else if (isStick && window.pageYOffset == 0) {
				header.classList.remove('is-stick');
				isStick = false;
			}
		});
	}

	Minimalist.prototype.request = function(url, callback, failCallback) {

		this.xhttp = new XMLHttpRequest();

		this.pageLoaded = function() {

	        if (this.xhttp.status >= 200 && this.xhttp.status < 400) {

				callback.call(this, this.xhttp.responseText, url);
	        } else if (this.xhttp.status == 404) {
	        	failCallback(url);
	        }
		}.bind(this);

		this.xhttp.addEventListener('load', this.pageLoaded);

		this.xhttp.onerror = function() {
            failCallback(url);
        };
      
		this.xhttp.open("GET", url, true);
		this.xhttp.send();
	}

	// matches polyfill
    this.Element && function(ElementPrototype) {
        ElementPrototype.matches = ElementPrototype.matches ||
        ElementPrototype.matchesSelector ||
        ElementPrototype.webkitMatchesSelector ||
        ElementPrototype.msMatchesSelector ||
        function(selector) {
            var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
            while (nodes[++i] && nodes[i] != node);
            return !!nodes[i];
        }
    }(Element.prototype);
    
    // closest polyfill
    this.Element && function(ElementPrototype) {
        ElementPrototype.closest = ElementPrototype.closest ||
        function(selector) {
            var el = this;
            while (el.matches && !el.matches(selector)) el = el.parentNode;
            return el.matches ? el : null;
        }
    }(Element.prototype);

	/*-----------------------------------------------------------*/
	/*--------------------- INITIALIZATION ----------------------*/
	/*-----------------------------------------------------------*/
	var minimalist = new Minimalist({
		ajaxTransition:    true,
		fixedMobileHeader: true,
	});	
})();
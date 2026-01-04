

import firebase from "firebase/compat/app"
import "firebase/compat/messaging"

let m = false;


function isBadIosXX() {
	var regex = /(iPhone|iPad|iPod);[^OS]*OS (\d)/;
	var matches = navigator.userAgent.match(regex);

	if (!matches) return false;
	return true;
}

function isWebView() {
	var userAgent = navigator.userAgent || '';
	var isAndroidWebView = (userAgent.includes('Android') && userAgent.includes('Version/')) || userAgent.includes('wv');
	var isiOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(userAgent);
	return isAndroidWebView || isiOSWebView;
  }
  
  

// eslint-disable-next-line no-undef
// console.log(isBadIosXX());

// eslint-disable-next-line no-undef
if (window.location.protocol === 'https:' && !isBadIosXX() && !isWebView()) {
	// console.log('Inicializando o Firebase na aplicação web');
	// eslint-disable-next-line no-undef
	firebase.initializeApp(firebaseConfig)
	m = firebase.messaging();
} else {
	// console.log('Não inicializando o Firebase no webview');
  }
export default m
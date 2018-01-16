var defaultBaseUrl = "http://app.maderatto.com.br";


function onDeviceReady() {
    if (window.cordova.logger) {
        window.cordova.logger.__onDeviceReady();
    }
    
    var baseUrl = window.localStorage.getItem("baseUrl");
    if (!baseUrl || baseUrl == "" || baseUrl == "undefined") {
    	baseUrl = defaultBaseUrl;
    	window.localStorage.setItem("baseUrl", baseUrl);	
    }
    
    var url = baseUrl + "/Maderatto/rest/mobile";
    window.localStorage.setItem("serviceUrl", url);
	initFastClick();
}

var nome;
var matricula;
var empresa; 
var logado;
var roles =[];

var app ={
		initialize: function(){
		inicializar();
		}
}

function inicializar(){
	document.addEventListener("deviceready", onDeviceReady, false);
	document.addEventListener("backbutton", onBackKeyDown, false);
}

function initFastClick(){
	window.addEventListener('load', function(){
		fastClick.attach(document.body);
	}, false);
}

function loginApp() {
	$('.gif-load').css('display', 'block');
	$('#form-login').css('display', 'none');
	var matriculaUsuario = $('#matricula').val();
	$.ajax({
		type : "POST",
		dataType : "json",
		url : window.localStorage.getItem("serviceUrl") + "/login",
		data : {
			matricula : matriculaUsuario,
		},
		crossDomain : true,
		success : function(result) {
			if (result.erro == 0) {
				nome = result.info['nome'];
			    matricula = result.info['matricula'];
			    empresa = result.info['empresa'];
			    roles = result.info['roles'];
			    logado = true;
			    saveData(nome, matricula, empresa, logado, roles);
			    $('#usuarioLogado').text(nome);
			   window.location.href = "home.html";
			} else {
				$('#form-login').css('display', 'block');
				$('.gif-load').css('display', 'none');
				var title ="Ops...";
				var message = "Matrícula inválida";
				var button ="OK";
				showAlert(title, message, button);
			}
		},
		error : function(result){
			$('.gif-load').css('display', 'none');
			$('#form-login').css('display', 'block');
			$('#matricula').val("");
			var title ="Ops...";
			var message = "Falha ao comunicar com o servidor: " + result;
			var button ="OK";
			showAlert(title, message, button);
		}
	});
}

function saveData(nome, matricula, empresa, logado, roles) {
	window.localStorage.setItem("nome", nome);
	window.localStorage.setItem("matricula", matricula);
	window.localStorage.setItem("empresa", empresa);
	window.localStorage.setItem("logado", logado);
	window.localStorage.setItem("roles", roles);
}

function saveRoles(roles){
	window.localStorage.removeItem('roles');
	window.localStorage.setItem("roles", roles);
}


function sair(){
	// Antes de dar um clear no local storage, salvamos a baseUrl e devolvemos ao storage
	var baseUrl = window.localStorage.getItem("baseUrl");
	localStorage.clear();
	var baseUrl = window.localStorage.setItem("baseUrl", baseUrl);
	
	window.localStorage.setItem("logado", false);
	window.location.href="index.html";
}

// Método para salvar a baseUrl
function salvarBaseUrl() {
	window.localStorage.setItem("baseUrl", $('#base-url').val());		// Altera a base URL
	window.location.href = "index.html";			// Recarrega a página com a nova base URL
}

// Método para restaurar a baseUrl padrão
function restaurarBaseUrlPadrao() {
	window.localStorage.setItem("baseUrl", defaultBaseUrl);		// Altera a base URL
	window.location.href = "index.html";			// Recarrega a página com a nova base URL
}

//Beep three times
function playBeep() {
    navigator.notification.beep(3);
}

// alert dialog dismissed
function alertDismissed() {
    // do something
}

function vibrate() {
	navigator.vibrate(500);
}

function showAlert(title, message, buttonName) {
	vibrate();
    navigator.notification.alert(
        message,  // message
        alertDismissed,         // callback
        title,            // title
        buttonName                  // buttonName
    );
}

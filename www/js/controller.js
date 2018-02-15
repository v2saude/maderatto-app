
function onDeviceReady() {
    if (window.cordova.logger) {
        window.cordova.logger.__onDeviceReady();
    }
}

document.addEventListener('deviceready', onDeviceReady, false);

var nome = window.localStorage.getItem('nome');
var matricula = window.localStorage.getItem('matricula');
var senha = window.localStorage.getItem('senha');
var empresa = window.localStorage.getItem('empresa');
var horasTrabalhadasHj;
var itensProjeto = new Array();
var lotesProducao = new Array();
var alteracaoApontamento = false;
var horas_salvar="00:00";

function verificaUsuario(){
	if(window.localStorage.getItem("logado") == 'false' && window.localStorage.getItem("matricula") == '' || window.localStorage.getItem("matricula") == null){
		window.location.href="index.html";
	}
}

function atualizaMenu(){
	nome = window.localStorage.getItem('nome');
	$('.usuarioLogado').text("Bem vindo "+nome);
}

/* enhance panel and its' contents */
$(function () {
    $("body>[data-role='panel']").panel().enhanceWithin();
});


$(document).on("pagecontainerbeforeshow" ,function(){
	// Antes de mostrar a página solicitada verifica a permissões do usuário
	//atualizaPermissao();
});

$( document ).on( "pagecontainercreate", "body", function() {
	verificaUsuario();
	atualizaMenu();
	totalHorasTrabalhadas();
  $( document ).on( "swiperight", "body", function( e ) {
      if ( $( ".ui-page-active" ).jqmData( "panel" ) !== "open" ) {
          if ( e.type === "swiperight" ) {
              $( "#menu-principal" ).panel( "open" );
          } 
      }
  });
  
  /* close panel where close button is clicked */
  $('.panel-close').on('click', function () {
      $(this)
          .closest(".ui-sub-panel")
          .addClass('ui-sub-panel-close ui-sub-panel-animate')
          .removeClass("ui-sub-panel-open");
  });
  
  $(function(){
		$( "[data-role='header']").toolbar();
	});
  
});

function truncate(text, maxlength) {
	if(text != '' && text != null && text != undefined){
		if (text.length > maxlength) {
			var trimmedString = text.substr(0, maxlength);
			trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));
			if (text.length > maxlength) {
				trimmedString += "...";
			}
			return trimmedString;
		}else
			return text;
	} else {
		return text;
	}
}

function totalHorasTrabalhadas(){
	$.ajax({
		type : "POST",
		dataType : "json",
		url : window.localStorage.getItem("serviceUrl") + "/projeto/horastrabalhadashj",
		data : {
			matricula : matricula,
			senha : senha,
		},
		crossDomain : true,
		success : function(result ) {
			if (result.erro == 0) {
				$('.horasTrabalhadas').text("Total de horas trabalhadas hoje: "+ result.info['horas_trabalhadas']);
			} else{
				$('.horasTrabalhadas').text("Total de horas trabalhadas hoje: 00:00");
			}
		},
		error : function(result){
			$('.gif-load').css('display', 'none');
			var title ="Ops...";
			var message = "Ocorreu um erro, por favor tente novamente."
			var button ="OK";
			showAlert(title, message, button);
		}
	});
}

function pesquisaProjetos(){
	clearUL('lista-projetos');
	$.ajax({
		type : "POST",
		dataType : "json",
		url : window.localStorage.getItem("serviceUrl") + "/projeto/pesquisa",
		data : {
			matricula : matricula,
			senha : senha,
		},
		crossDomain : true,
		success : function(result ) {
			if (result.erro == 0) {
				var numeroProjetos = result.info.projetos.length;
				var permissoes = result.info['roles'];
			    projetos = [];
				for (var i=0; i < numeroProjetos; i++){
					var cliente = '';
					var codigo = result.info.projetos[i].id;
					if(result.info.projetos[i].cliente != undefined)
						cliente = truncate(result.info.projetos[i].cliente, 20);
					var strHTML = "<li><a href='#' class='ui-btn ui-btn-icon-right ui-icon-carat-r' onclick='carregaItensProjeto("+codigo+")' class='ui-btn ui-shadow ui-corner-all'>"+codigo+" - "+cliente+"</a></li";
					projetos.push(strHTML);
				}
				preencheDados(projetos, "lista-projetos");
			} else{
				var html ="<a href='#transitionExample' data-transition='slideup' class='ui-btn ui-corner-all ui-shadow ui-btn-inline' data-rel='popup'>"+result.mensagem+"</a>";
				$('#lista-projeto').html(html);
			}
		},
		error : function(result){
			$('.gif-load').css('display', 'none');
			var title ="Ops...";
			var message = "Ocorreu um erro, por favor tente novamente."
			var button ="OK";
			showAlert(title, message, button);
		}
	});
}

function pesquisaLotesProducao(){
	clearUL('lista-lotes');
	$.ajax({
		type : "POST",
		dataType : "json",
		url : window.localStorage.getItem("serviceUrl") + "/lote/pesquisa",
		data : {
			matricula : matricula,
			senha : senha,
		},
		crossDomain : true,
		success : function(result ) {
			if (result.erro == 0) {
				var numeroLotes = result.info.lotes.length;
				var permissoes = result.info['roles'];
			    lotes = [];
				for (var i=0; i < numeroLotes; i++){
					var descricao = '';
					var observacao = '';
					var tempo_total="00:00";
					var horas_trabalhadas_hoje="00:00";
					var codigo = result.info.lotes[i].id;
					
					if(result.info.lotes[i].descricao != undefined)
						descricao = truncate(result.info.lotes[i].descricao, 20);
					if(result.info.lotes[i].observacao != undefined)
						observacao = truncate(result.info.lotes[i].observacao, 30);
					if(result.info.lotes[i].tempo_total != undefined && result.info.lotes[i].tempo_total != '')
						tempo_total = result.info.lotes[i].tempo_total;
					if(result.info.lotes[i].horas_trabalhadas_hoje != undefined && result.info.lotes[i].horas_trabalhadas_hoje != '')
						horas_trabalhadas_hoje = result.info.lotes[i].horas_trabalhadas_hoje;
					
					lotesProducao.push(result.info.lotes[i]);
					var strHTML = "<li class='ui-li-has-alt ui-first-child ui-last-child'><a class='ui-btn' href='#'><h2>"+descricao+"</h2>" +
					"<p><strong>"+observacao+"</strong></p>" +
					"<p>Horas trabalhadas hoje: "+horas_trabalhadas_hoje+"</p>"+
					"<p>Total de horas trabalhadas: "+tempo_total+"</p>" +
					"<a href='#purchase-lote' onclick='atualizaModalHoraLote("+codigo+")' class='ui-btn ui-btn-icon-notext ui-icon-clock ui-btn-b ' value='' href='#' data-theme='b' data-rel='popup' data-position-to='window' " +
					"data-transition='pop'>Purchase album</a></li>";
					lotes.push(strHTML);
				}
				preencheDados(lotes, "lista-lotes");
			} else{
				var html ="<a href='#transitionExample' data-transition='slideup' class='ui-btn ui-corner-all ui-shadow ui-btn-inline' data-rel='popup'>"+result.mensagem+"</a>";
				$('#lista-lote').html(html);
			}
		},
		error : function(result){
			$('.gif-load').css('display', 'none');
			var title ="Ops...";
			var message = "Ocorreu um erro, por favor tente novamente."
			var button ="OK";
			showAlert(title, message, button);
		}
	});
}

function carregaItensProjeto(codigo){
	alteracaoApontamento = false;
	clearUL("itens-projeto");
	$.ajax({
		type : "POST",
		dataType : "json",
		url : window.localStorage.getItem("serviceUrl") + "/projeto/pesquisa/itens",
		data : {
			matricula : matricula,
			senha :senha,
			codigo : codigo,
		},
		crossDomain : true,
		success : function(result ) {
			if (result.erro == 0) {
				var numeroItens = result.info.itens.length;
				var permissoes = result.info['roles'];
				itens = [];
				var codigoProjeto = result.info.codigo;
				var cliente = result.info.cliente;
				var total_horas_projeto= result.info.total_horas_projeto;
				
				var infoProjeto ="<p>"+codigo+" - "+cliente+"</p><p>Horas trabalhadas no projeto: "+total_horas_projeto+"</p>"
				 $('#info-projeto').html(infoProjeto);
				for (var i=0; i < numeroItens; i++){
					var nome = '';
					var descricao = '';
					var tempo_total="00:00";
					var horas_trabalhadas_hoje="00:00";
					var codigo = result.info.itens[i].id;
					
					if(result.info.itens[i].nome != undefined)
						nome = truncate(result.info.itens[i].nome, 100);
					if(result.info.itens[i].descricao != undefined)
						descricao = truncate(result.info.itens[i].descricao, 100);
					if(result.info.itens[i].tempo_total != undefined && result.info.itens[i].tempo_total != '')
						tempo_total = result.info.itens[i].tempo_total;
					if(result.info.itens[i].horas_trabalhadas_hoje != undefined && result.info.itens[i].horas_trabalhadas_hoje != '')
						horas_trabalhadas_hoje = result.info.itens[i].horas_trabalhadas_hoje;
					
					itensProjeto.push(result.info.itens[i]);
					
					var strHTML = "<li class='ui-li-has-alt ui-first-child ui-last-child'><a class='ui-btn' href='#'><h2>"+nome+"</h2>" +
							"<p><strong>"+descricao+"</strong></p>" +
							"<p>Horas trabalhadas hoje: "+horas_trabalhadas_hoje+"</p>"+
							"<p>Total de horas trabalhadas: "+tempo_total+"</p>" +
							"<a href='#purchase-projeto' onclick='atualizaModalHora("+codigo+", "+codigoProjeto+")' class='ui-btn ui-btn-icon-notext ui-icon-clock ui-btn-b ' value='"+hora_inicial+"' href='#' data-theme='b' data-rel='popup' data-position-to='window' " +
							"data-transition='pop'>Purchase album</a></li>";
					itens.push(strHTML);
				}
				atualizaMenu();
				preencheDados(itens, "itens-projeto");
				totalHorasTrabalhadas();
				$.mobile.changePage("#page-itens", { transition: "slideup", changeHash: true, reolad :true });
			} else{
				var html ="<a href='#transitionExample' data-transition='slideup' class='ui-btn ui-corner-all ui-shadow ui-btn-inline' data-rel='popup'>"+result.mensagem+"</a>";
				$('#lista-projeto').html(html);
			}
		},
		error : function(result){
			$('.gif-load').css('display', 'none');
			var title ="Ops...";
			var message = "Ocorreu um erro, por favor tente novamente."
			var button ="OK";
			showAlert(title, message, button);
		}
	});
}

function atualizaModalHora(codigo, projeto){
	var numeroItens = itensProjeto.length;
	for(i=0;i< numeroItens; i++){
		if(itensProjeto[i].id == codigo){
			$("#codigo_projeto").val(projeto);
			$("#codigo_hora_projeto").val(codigo);
			$("#descricao-projeto").text(itensProjeto[i].nome);
		}
	}
	
}

function atualizaModalHoraLote(codigo){
	var numeroItens = lotesProducao.length;
	for(i=0;i< numeroItens; i++){
		if(lotesProducao[i].id == codigo){
			$("#codigo_lote").val(codigo);
			$("#descricao-lote").text(lotesProducao[i].descricao);
		}
	}
}

function atualizarHora(){
	var hora_inicial = $('#hora_inicial_projeto').val();
	var hora_final = $('#hora_final_projeto').val();
	var observacoes = $('#observacoes').val();
	var codigoProjeto = $("#codigo_projeto").val();
	var operacao = $("#operacao_projeto").val();
	
	if(operacao == ""){
		var title ="Atenção";
		var message = "Favor informar a operação!";
		var button ="OK";
		showConfirm(title, message, button, inicializarModal());
	}else{
		var numeroItens = itensProjeto.length;
		for(i=0;i< numeroItens; i++){
			if(itensProjeto[i].id == $('#codigo_hora_projeto').val()){
				itensProjeto[i].hora_inicial = hora_inicial
				itensProjeto[i].hora_final = hora_final;
				itensProjeto[i].observacoes = observacoes;
				itensProjeto[i].operacao = operacao;
				salvarApontamento(itensProjeto[i], codigoProjeto);
				totalHorasTrabalhadas();
				inicializarModal();
			}
		}
	}
	inicializarModal();
}

function atualizarHoraLote(){
	var hora_inicial = $('#hora_inicial').val();
	var hora_final = $('#hora_final').val();
	var observacoes = $('#observacoes').val();
	var codigoLote = $("#codigo_lote").val();
	var operacao = $("#operacao").val();
	var finalizado = $("#finalizado").val();
	if(operacao == ""){
		var title ="Atenção";
		var message = "Favor informar a operação!";
		var button ="OK";
		showConfirm(title, message, button, inicializarModalLote());
	}else{
		var numeroItens = lotesProducao.length;
		for(i=0;i< numeroItens; i++){
			if(lotesProducao[i].id == $('#codigo_lote').val()){
				lotesProducao[i].hora_inicial = hora_inicial
				lotesProducao[i].hora_final = hora_final;
				lotesProducao[i].observacoes = observacoes;
				lotesProducao[i].operacao = operacao;
				lotesProducao[i].finalizado = finalizado;
				salvarApontamentoLote(lotesProducao[i]);
				totalHorasTrabalhadas();
				inicializarModalLote();
			}
		}
	}
	inicializarModalLote();
}

function diferencaHora(horaInicial, horaFinal){
	var horai = new Date();
	var horaf = new Date();
	var horaini = horaInicial.split(":");
	var horafim = horaFinal.split(":");
	horai.setHours(horaini[0], horaini[1]);
	horaf.setHours(horafim[0], horafim[1]);
	
	var dif = Math.abs(horaf.getTime() - horai.getTime());
	var hora = new Date(dif);
	var diferenca = hora.getTime() + (hora.getTimezoneOffset() * 60000);
	total = new Date(diferenca + (3600000*0));
	
	var h = addZero(total.getHours());
    var m = addZero(total.getMinutes());
    var result = h + ":" + m;
	return result;
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function inicializarModal(){
	$('#hora_inicial_projeto').val("");
	$('#hora_final_projeto').val("");
	$('#codigo_hora_projeto').val("");
	$('#observacoes').val("");
	$("#codigo_projeto").val("");
	// reseta valore do select e slider
	var myselect = $( "#operacao_projeto" );
	
	myselect[0].selectedIndex = 0;
	myselect.selectmenu( "refresh" );
}

function inicializarModalLote(){
	$('#hora_inicial').val("");
	$('#hora_final').val("");
	$('#observacoes').val("");
	$("#codigo_lote").val("");
	// reseta valore do select e slider
	var myselect = $( "#operacao" );
	var myswitch = $( "#finalizado" );
	
	myswitch[ 0 ].selectedIndex = 0;
	myswitch.slider( "refresh" );
	myselect[0].selectedIndex = 0;
	myselect.selectmenu( "refresh" );
}

function cancelarApontamento(){
		itensProjeto = new Array();
		inicializarModal();
		inicializarModalLote();
		totalHorasTrabalhadas();
}

function salvarApontamento(apontamento, codigoProjeto){
	$('#btn-voltar').addClass('ui-state-disabled');
	itensProjeto = new Array();
	clearUL("itens-projeto");
	$('#itens-projeto').css('display', 'none');
	$('.gif-load').css('display', 'block');
	var projeto = codigoProjeto;
	
	var id = apontamento['id'];
	var horaInicial = apontamento['hora_inicial'];
	var horaFinal = apontamento['hora_final'];
	var observacoes = apontamento['observacoes'];
	var operacao = apontamento['operacao'];
	$.ajax({
		type : "POST",
		dataType : "json",
		url : window.localStorage.getItem("serviceUrl") + "/projeto/salvar/apontamento",
		data : {
			matricula : matricula,
			senha : senha,
			id : id,
			horaInicial : horaInicial,
			horaFinal : horaFinal,
			observacoes: observacoes,
			operacao : operacao,
		},
		crossDomain : true,
		success : function(result ) {
			$('#btn-voltar').removeClass('ui-state-disabled');
			itensProjeto = new Array();
			var title ="Info";
			var message = result.info.msg
			var button ="OK";
			showConfirm(title, message, button, carregaItensProjeto(projeto));
			$('.gif-load').css('display', 'none');
			$('#itens-projeto').css('display', 'block');
		},

		error : function(result){
			$('#btn-voltar').removeClass('ui-state-disabled');
			var title ="Ops...";
			var message = "Ocorreu um erro, o horário informado já pode ter sido lançado. Favor verificar.";
			var button ="OK";
			
			showConfirm(title, message, button, carregaItensProjeto(projeto));
			$('.gif-load').css('display', 'none');
			$('#itens-projeto').css('display', 'block');
		}
	});
}

function salvarApontamentoLote(lote){
	lotesProducao = new Array();
	clearUL("lista-lotes");
	$('#lista-lotes').css('display', 'none');
	$('.gif-load').css('display', 'block');
	
	var id = lote['id'];
	var horaInicial = lote['hora_inicial'];
	var horaFinal = lote['hora_final'];
	var observacoes = lote['observacoes'];
	var operacao = lote['operacao'];
	var finalizado = lote['finalizado'];
	$.ajax({
		type : "POST",
		dataType : "json",
		url : window.localStorage.getItem("serviceUrl") + "/lote/salvar/apontamento",
		data : {
			matricula : matricula,
			senha : senha,
			id : id,
			horaInicial : horaInicial,
			horaFinal : horaFinal,
			observacoes: observacoes,
			operacao : operacao,
			finalizado : finalizado,
		},
		crossDomain : true,
		success : function(result ) {
			lotesProducao = new Array();
			var title ="Info";
			var message = result.info.msg
			var button ="OK";
			showConfirm(title, message, button, pesquisaLotesProducao());
			$('.gif-load').css('display', 'none');
			$('#lista-lotes').css('display', 'block');
		},

		error : function(result){
			var title ="Ops...";
			var message = "Ocorreu um erro, o horário informado já pode ter sido lançado. Favor verificar.";
			var button ="OK";
			
			showConfirm(title, message, button, carregaItensProjeto(projeto));
			$('.gif-load').css('display', 'none');
			$('#lista-lotes').css('display', 'block');
		}
	});
}

function clearUL(lista){
	if(document.getElementById(lista) != null){
		var thelist = document.getElementById(lista);
		while (thelist.hasChildNodes()){
			thelist.removeChild(thelist.lastChild);
		}
	}
}

function preencheDados(lista, id_lista){
  for (var i=0; i < lista.length; i++){
    $('#'+id_lista).append(lista[i]);
  }
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

//process the confirmation dialog result
function onConfirm(buttonIndex) {
    alert('You selected button ' + buttonIndex);
}

function showConfirm(title, message, buttonName, onConfirm) {
	vibrate();
    navigator.notification.confirm(
        message, // message
         onConfirm,            // callback to invoke with index of button pressed
        title,           // title
        buttonName         // buttonLabels
    );
}


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
var itensLote = new Array();
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

function formatarData(date) {
	if (date != '') {
		data = date.split("-"); // "2010-01-18"
		var dia = data[2];
		var mes = data[1];
		var ano = data[0];
		if(data[2].length == 1)
			dia = "0"+data[2];
		if(data[1].length == 1)
			mes = "0"+data[1];
		return dia + "/" + mes + "/" + ano; // "18/01/2010"
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
	$( ".btn-pesquisa" ).collapsible( "option", "collapsed", true );
	var dataInicio = $('#dataInicial').val();
	var dataFim = $('#dataFinal').val();
	var filtroProjeto = $("#filtroProjeto").val();
	if(dataInicio != '')
		dataInicio = new Date(dataInicio).toLocaleString();
	if(dataFim != '')
		dataFim = new Date(dataFim).toLocaleString();
	$.ajax({
		type : "POST",
		dataType : "json",
		url : window.localStorage.getItem("serviceUrl") + "/projeto/pesquisa",
		data : {
			matricula : matricula,
			senha : senha,
			projeto : filtroProjeto,
			dataInicial : dataInicio,
			dataFinal : dataFim,
			isManutencao : false,
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
					var manutencao = result.info.projetos[i].manutencao;
					if(result.info.projetos[i].cliente != undefined)
						cliente = truncate(result.info.projetos[i].cliente, 20);
					
					var classBtn = ''
					if(i == 0)
						classBtn = 'ui-first-child';
					else if(i == numeroProjetos-1)
						classBtn = 'ui-last-child';
					var strHTML = "<li class='"+classBtn+"'><a href='#' class='ui-btn ui-btn-icon-right ui-icon-carat-r' onclick='carregaItensProjeto("+codigo+")' class='ui-btn ui-shadow ui-corner-all'>"+codigo+" - "+cliente+"<p>Manutenção: "+manutencao+"</p></a></li";
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

function pesquisaProjetosManutencao(){
	clearUL('lista-projetos-manutencao');
	$( ".btn-pesquisa" ).collapsible( "option", "collapsed", true );
	var dataInicio = $('#dataInicialManutencao').val();
	var dataFim = $('#dataFinalManutencao').val();
	var filtroProjeto = $("#filtroProjetoManutencao").val();
	if(dataInicio != '')
		dataInicio = new Date(dataInicio).toLocaleString();
	if(dataFim != '')
		dataFim = new Date(dataFim).toLocaleString();
	$.ajax({
		type : "POST",
		dataType : "json",
		url : window.localStorage.getItem("serviceUrl") + "/projeto/pesquisa",
		data : {
			matricula : matricula,
			senha : senha,
			dataInicial : dataInicio,
			dataFinal : dataFim,
			isManutencao : true,
			projeto : filtroProjeto,
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
					var manutencao = result.info.projetos[i].manutencao;
					
					var classBtn = ''
						if(i == 0)
							classBtn = 'ui-first-child';
						else if(i == numeroProjetos-1)
							classBtn = 'ui-last-child';
					
					if(result.info.projetos[i].cliente != undefined)
						cliente = truncate(result.info.projetos[i].cliente, 20);
					var strHTML = "<li class='"+classBtn+"'><a href='#' class='ui-btn ui-btn-icon-right ui-icon-carat-r' onclick='carregaItensProjeto("+codigo+")' class='ui-btn ui-shadow ui-corner-all'>"+codigo+" - "+cliente+"<p>Manutenção: "+manutencao+"</p></a></li";
					projetos.push(strHTML);
				}
				preencheDados(projetos, "lista-projetos-manutencao");
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
	$( ".btn-pesquisa" ).collapsible( "option", "collapsed", true );
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
					
					var classBtn = ''
					if(i == 0)
						classBtn = 'ui-first-child';
					else if(i == numeroLotes-1)
						classBtn = 'ui-last-child';
					var strHTML = "<li class='ui-li-has-alt "+classBtn+"'><a class='ui-btn' onclick='carregarItensLote("+codigo+");'><h2>"+descricao+"</h2>" +
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
				
				var infoProjeto ="<p>"+codigoProjeto+" - "+cliente+"</p><p>Horas trabalhadas no projeto: "+total_horas_projeto+"</p>"
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

function carregarItensLote(codigo){
	$("#itens-lote").empty();
	$.ajax({
		type : "POST",
		dataType : "json",
		url : window.localStorage.getItem("serviceUrl") + "/projeto/pesquisa/loteitens",
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
				var descricao = result.info.descricao;
				var observacao = '';
				if(result.info.observacao != undefined)
					observacao = result.info.observacao;
				var operador = result.info.operador;
				
				var infoLote ="<p>Descrição: "+descricao+"</p><p>Observação: "+observacao+"</p><p>Operador: "+operador+"</p>"
				$('#info-lote').html(infoLote);
				for (var i=0; i < numeroItens; i++){
					var projeto = '';
					var produto = '';
					var quantidade = '';
					var status = '';
					var prazo = '';
					
					if(result.info.itens[i].projeto != undefined)
						projeto = truncate(result.info.itens[i].projeto, 100);
					if(result.info.itens[i].produto != undefined)
						produto = truncate(result.info.itens[i].produto, 100);
					if(result.info.itens[i].quantidade != undefined)
						quantidade = result.info.itens[i].quantidade;
					if(result.info.itens[i].status != undefined)
						status = result.info.itens[i].status;
					if(result.info.itens[i].prazo != undefined)
						prazo = result.info.itens[i].prazo;
					
					itensLote.push(result.info.itens[i]);
					
					var strHTML = "<tr><th>"+projeto+"</th><td>"+produto+"</td><td>"+quantidade+"</td>" +
							"<td>"+status+"</td><td>"+prazo+"</td></tr>";
					itens.push(strHTML);
				}
				preencheDados(itens, "itens-lote");
				$.mobile.changePage("#page-itens-lote", { transition: "slideup", changeHash: true, reolad :true });
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

function carregarExtrato(){
	$("#extrato-horas").empty();
	$( ".btn-pesquisa" ).collapsible( "option", "collapsed", true );
	var dataInicio = $('#dataInicialExtrato').val();
	var dataFim = $('#dataFinalExtrato').val();
	if(dataInicio != ''){
		dataInicio = normalizaData(dataInicio);
		dataInicio = new Date(dataInicio).toLocaleString();
	}
	if(dataFim != ''){
		dataFim = normalizaData(dataFim);
		dataFim = new Date(dataFim).toLocaleString();
	}
	$.ajax({
		type : "POST",
		dataType : "json",
		url : window.localStorage.getItem("serviceUrl") + "/projeto/extrato",
		data : {
			matricula : matricula,
			senha :senha,
			dataInicial : dataInicio,
			dataFinal : dataFim,
		},
		crossDomain : true,
		success : function(result ) {
			if (result.erro == 0) {
				var numeroItens = result.info.itens.length;
				var total_horas= result.info.totalHoras;
				extrato = [];
				
				var strHTML = "<li data-role='list-divider' class='ui-li-divider ui-bar-inherit ui-li-has-count ui-first-child'>Total de horas Trabalhadas<span class='ui-li-count'>"+total_horas+"</span></li>";
				extrato.push(strHTML);
				for (var i=0; i < numeroItens; i++){
					var projeto = '';
					var item = '';
					var operacao = '';
					var horaInicial = '';
					var horaFinal = '';
					var tempoTotal = '';
					var totalHorasHj = '';
					var data = '';
					
					if(result.info.itens[i].projeto != undefined)
						projeto = truncate(result.info.itens[i].projeto, 100);
					if(result.info.itens[i].item != undefined)
						item = truncate(result.info.itens[i].item, 100);
					if(result.info.itens[i].operacao != undefined)
						operacao = result.info.itens[i].operacao;
					if(result.info.itens[i].horaInicial != undefined)
						horaInicial = result.info.itens[i].horaInicial;
					if(result.info.itens[i].horaFinal != undefined)
						horaFinal = result.info.itens[i].horaFinal;
					if(result.info.itens[i].tempoTotal != undefined)
						tempoTotal = result.info.itens[i].tempoTotal;
					if(result.info.itens[i].totalHorasHj != undefined)
						totalHorasHj = result.info.itens[i].totalHorasHj;
					if(result.info.itens[i].data != undefined)
						data = result.info.itens[i].data;
					
					extrato.push(result.info.itens[i]);
					
					strHTML = "<li class='ui-btn ui-li-static ui-body-inherit ui-li-has-count'>"+
						"<p><strong>Projeto: "+projeto+"</strong></p>"+
						"<p><strong>Item: "+item+"</strong></p>"+
						"<p><strong>Operacao: "+operacao+"</strong></p>"+
						"<p><strong>Data: "+data+"</strong></p>"+
						"<p>Horário: "+horaInicial+" - "+horaFinal+"</p>"+
						"<p><span class='ui-li-count'>"+tempoTotal+"</span></p>";
					extrato.push(strHTML);
				}
				preencheDados(extrato, "extrato-horas");
			} else{
				var html ="<a href='#transitionExample' data-transition='slideup' class='ui-btn ui-corner-all ui-shadow ui-btn-inline' data-rel='popup'>"+result.mensagem+"</a>";
				$('#extrato-horas').html(html);
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

function normalizaData(data){
	var parts = data.split('-');
	var date = new Date(parts[0], parts[1] - 1, parts[2]); 
	return date;
}

function atualizaModalHora(codigo, projeto){
	var numeroItens = itensProjeto.length;
	for(i=0;i< numeroItens; i++){
		if(itensProjeto[i].id == codigo){
			$("#codigo_projeto").val(projeto);
			$("#codigo_hora_projeto").val(codigo);
			$("#descricao-projeto").text(itensProjeto[i].nome);
			$("#data_instalacao").val(new Date().toISOString().substr(0, 10));
		}
	}
}

function atualizaModalHoraLote(codigo){
	var numeroItens = lotesProducao.length;
	for(i=0;i< numeroItens; i++){
		if(lotesProducao[i].id == codigo){
			$("#codigo_lote").val(codigo);
			$("#descricao-lote").text(lotesProducao[i].descricao);
			$("#data_instalacao_lote").val(new Date().toISOString().substr(0, 10));
		}
	}
}

function atualizarHora(){
	var hora_inicial = $('#hora_inicial_projeto').val();
	var hora_final = $('#hora_final_projeto').val();
	var observacoes = $('#observacoes').val();
	var codigoProjeto = $("#codigo_projeto").val();
	var operacao = $("#operacao_projeto").val();
	var data = $('#data_instalacao').val();
	
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
				itensProjeto[i].data = data;
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
	var data = $('#data_instalacao_lote').val();
	
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
				lotesProducao[i].data = data;
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
	$("#data_instalacao").val("");
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
	$("#data_instalacao_lote").val("");
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
	var data = apontamento['data'];
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
			data : data,
		},
		crossDomain : true,
		success : function(result ) {
			$('#btn-voltar').removeClass('ui-state-disabled');
			$('.gif-load').css('display', 'none');
			$('#itens-projeto').css('display', 'block');
			itensProjeto = new Array();
			var title ="Info";
			var message = result.info.msg
			var button ="OK";
			showConfirm(title, message, button, carregaItensProjeto(projeto));
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
	var data = lote['data'];
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
			data : data,
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

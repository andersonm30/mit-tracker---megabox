<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mapa com Leaflet.js</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  
    
    <!-- Icon Font Stylesheet -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">

   
  <style>
    #map { height: 100vh; position: relative; }
    #info { 
      position: fixed; 
      bottom: 10px; 
      right: 10px; 
      background-color: white; 
      padding: 5px; 
      border-radius: 10px; 
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); 
      z-index: 1000; 
      cursor: move; /* Adicionado para tornar o div movível */
      width: 250px; /* Nova largura */
      height: 150px; /* Nova altura */
    }
    #buttons { 
      position: absolute; 
      top: 60px; 
      left: 50%; 
      transform: translateX(-50%); 
      z-index: 1000; 
      background-color: white; 
      padding: 5px; 
      border-radius: 10px; 
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); 
    }
    .draggable { cursor: move; }
  </style>
</head>
<body>
 
  <?php
	
	//session_start();
	include 'api_traccar.php';

	$traccar = new traccar();
	
	$login = $traccar->login('admin','admin');	
		
	$sessionId = $login->response;

	session_start();
	$_SESSION['user'] = 'admin';
	$_SESSION['sessionId'] = $sessionId;
	$_SESSION['Basic'] = base64_encode( 'admin' . ':' . 'admin' );
			
        
	$reponse = $traccar->positions($sessionId,60,'2024-04-09T16:00:00Z','2024-04-09T22:00:00Z');
	
	//$reponse = $traccar->positions($_SESSION['sessionId'],$deviceid,$data_inicio,$data_final);

	$positions = json_decode($reponse->response);

	$var_pos ='';
	$var_dados ='';
	$i = 0;
	foreach($positions as $position){
		if( $i > 0 ){ $var_pos .= ','; $var_dados .= ','; } else { $p_lat = $position->latitude; $p_log = $position->longitude;}
		$var_pos .= '['.$position->latitude.','.$position->longitude.']';
		
		$data = $position->serverTime;
		$hora = substr($data,strpos($data,'T')+1,8);
		$hora = substr('00'.(substr($hora,0,2) - 3),-2).substr($hora,2,6) ;
		$data =  substr($data,8,2).'/'.substr($data,5,2).'/'.substr($data,0,4);
		$data = '<br><b>Data: </b>'.$data.' '.$hora.'<br><b>Endereço: </b>'.$position->address.'<br> Lat: '.$position->latitude.' - Log: '.$position->longitude;
		
		$var_dados .= '["'.$data.'"]';
		$i++;
	}	
	if ( $i == 0 ){
			echo "<script>
			 var map = L.map('map').setView([0,0], 18); // Porto Alegre coordinates

			  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href=".'"https://www.openstreetmap.org/copyright"'.">OpenStreetMap</a> contributors'
			  }).addTo(map);
			alert('Sem dados para exibir');
			</script>";
	}	
  ?>

<div id="map">
  <div id="info">Número do Ponto: <span id="pointNumber">0</span></div>
</div>
<div id="buttons" class="draggable" align="center">
  <p><b> Controles </b></p>	
  <button id="autoBtn" onclick="toggleAuto()" title="Play"><i class="bi bi-play-circle-fill" title="Play"></i></button>
  <button id="pause" onclick="togglePause()" title="Pause" disabled><i class="bi bi-pause-circle-fill"></i></button>
  <button id="addBtn" onclick="addPoint()" title="Adicionar próximo ponto"><i class="bi bi-arrow-right-circle-fill"></i></button>
  <button id="removeBtn" onclick="removePoint()" title="Remover Último ponto" disabled><i class="bi bi-arrow-left-circle-fill"></i></button>
  <button id="addAll" onclick="toggleAutoFast()" title="Adicionar todos os pontos"><i class="bi bi-play-circle-fill"></i><b> 2x</b></button>

  
</div>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script>

  var map = L.map('map').setView([<?php echo $p_lat.' , '.$p_log; ?> ], 18); // Porto Alegre coordinates

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  
    <?php echo 'var points = ['.$var_pos.'];'; ?>
    <?php echo 'var dados = ['.$var_dados.'];'; ?>

  var markers = [];
  var lines = [];
  var intervalId;
  var pointCounter = 0;

  function addPoint() {
    var lastIndex = markers.length;
    if (lastIndex < points.length) {
      var point = points[lastIndex];
	  var dado = dados[lastIndex];
	  
	  if( lastIndex == 0){
		var marker = L.marker(point, { icon: L.icon({ iconUrl: 'img/start.png', iconSize: [60, 60] }) }).addTo(map);
	  } else {
		if (lastIndex+1 ==  points.length){
			var marker = L.marker(point, { icon: L.icon({ iconUrl: 'img/finish.png', iconSize: [60, 60] }) }).addTo(map);
		} else {	
			var marker = L.marker(point, { icon: L.icon({ iconUrl: 'img/car.png', iconSize: [40, 40] }) }).addTo(map);  
		}	
	  }	  
	  marker.bindPopup('<div style="text-align: center;"><b>Ponto: </b> ' + (pointCounter + 1) + dado +'</div>').openPopup(); // Abre o popup automaticamente
      markers.push(marker);
      map.panTo(point);

      if (lastIndex > 0) {
        var previousPoint = points[lastIndex - 1];
        var line = L.polyline([previousPoint, point], { color: 'green' }).addTo(map);
        lines.push(line);
      }

      pointCounter++;
      
	  var div = document.getElementById('info');
	  div.innerHTML = '<p><b>Ponto: </b>'+ pointCounter +dado+'</p>';	
	  
      if (markers.length === points.length) {
        document.getElementById('addBtn').disabled = true;
      }
      document.getElementById('removeBtn').disabled = false;
    } 
  }

  function removePoint() {
	clearInterval(intervalId); // Parando a chamada automática  
	document.getElementById('pause').disabled = true;
	
    var lastIndex = markers.length - 1;
    if (lastIndex > 0) {
      map.removeLayer(markers[lastIndex]);
      markers.pop();

      if (lastIndex > 0) {
        map.removeLayer(lines[lastIndex - 1]);
        lines.pop();
      }
	
	  var point = points[lastIndex-1];
	  
	  	
	  map.panTo(point);	
	  	
      pointCounter--;
      
	  
	  var dado = dados[lastIndex-1];
	  var marker = markers[lastIndex-1];
	  
	  var div = document.getElementById('info');
	  div.innerHTML = '<p><b>Ponto: </b>'+ pointCounter +dado+'</p>';	
	  
	  marker.bindPopup('<div style="text-align: center;"><b>Ponto: </b> ' + (pointCounter) + dado +'</div>').openPopup(); // Abre o popup automaticamente

      document.getElementById('addBtn').disabled = false;
      if (markers.length === 0) {
        document.getElementById('removeBtn').disabled = true;
      }
    }
  }

  function toggleAuto() {
      intervalId = setInterval(addPoint, 500); // Chamando addPoint a cada meio segundo 
	  document.getElementById('pause').disabled = false;
	  document.getElementById('addBtn').disabled = true;
	  document.getElementById('removeBtn').disabled = true;
	  document.getElementById('autoBtn').disabled = true;
	  document.getElementById('addAll').disabled = true;
  }
  function togglePause() {
      clearInterval(intervalId); // Chamando addPoint a cada segundo 
	  document.getElementById('pause').disabled = true;
	  document.getElementById('addBtn').disabled = false;
	  document.getElementById('removeBtn').disabled = false;
	  document.getElementById('autoBtn').disabled = false;
	  document.getElementById('addAll').disabled = false;
  }
   function toggleAutoFast() {
    intervalId = setInterval(addPoint, 50); // Chamando addPoint a cada segundo
	document.getElementById('pause').disabled = false;
	document.getElementById('addBtn').disabled = true;
	document.getElementById('removeBtn').disabled = true;
	document.getElementById('autoBtn').disabled = true;
	document.getElementById('addAll').disabled = true;
  }
     
  // Função para tornar o div "draggable"
  function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
      // Se existir o cabeçalho, este será usado como o ponto de arrasto
      document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
      // Caso contrário, use o próprio elemento como ponto de arrasto
      elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // Obtenha a posição inicial do mouse
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // Chame a função sempre que o mouse se mover
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // Calcule a nova posição do elemento
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // Defina a posição do elemento
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      // Pare de mover quando o botão do mouse for liberado
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  dragElement(document.getElementById("buttons"));
  dragElement(document.getElementById("info"));

</script>

</body>
</html>


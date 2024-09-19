<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Eventos</title>
    <style>
        .device-info {
            border: 1px solid #ccc;
            border-radius: 10px;
            padding: 10px;
            margin-bottom: 20px;
        }
        .map-container {
            width: 270px;
            height: 170px;
        }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>

<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

<script>
// Function to create a custom icon with dynamic color
function createCustomIcon(className, color) {
    return L.divIcon({
        html: '<i class="fa ' + className + ' fa-icon" style="color:' + color + '; font-size: 40px;"></i>', // Aumenta o tamanho da fonte para 40px
        className: 'custom-icon',
        iconSize: [30, 30], // Aumenta o tamanho do ícone para o dobro
        iconAnchor: [20, 20] // Centraliza o ícone
    });
}
</script>

<?php

function formata_data($data_raw,$year_len){
	if( $year_len == 2 ) {$pos_ini = $year_len;} else {$pos_ini = 0;}
	$data =  substr($data_raw,8,2).'/'.substr($data_raw,5,2).'/'.substr($data_raw,$pos_ini,$year_len);
	$hora = substr($data_raw,strpos($data_raw,'T')+1,8);
	return $data.' '.$hora;
}	

	include 'api_traccar.php';

	$traccar = new traccar();

	$login = $traccar->login('administrador','$uporte80');

	$sessionId = $login->response;

	session_start();
	$_SESSION['user'] = 'admin';
	$_SESSION['sessionId'] = $sessionId;
	$_SESSION['Basic'] = base64_encode( 'admin' . ':' . 'admin' );
	$deviceid = $_GET['deviceid'];
	$dt_ini = $_GET['data_inicial'];
	$dt_fim = $_GET['data_final'];

	$reponse = $traccar->reportEventsType($sessionId,$deviceid,'alarm&type=geofenceExit&type=geofenceEnter',$dt_ini,$dt_fim);

	$eventos = json_decode($reponse->response);



	echo "<div>";
	echo "<table border='0' width='100%'>";
	echo "<tr>";
	echo "<td rowspan=3 width='10%' align='center' ><img src='img/logo.png' width='80px' height='80px'></img></td>";
	echo "<td colspan=2 width='80%' align='center'><h2><u>Relatório de Eventos</u></h2></td>";
	echo "</tr>";
	echo "<tr>";
	echo "<td colspan=2 align='left'></td>";
	echo "</tr>";
	echo "<tr>";
	echo "<td colspan=2 align='left'><b>&nbsp;&nbsp;Período:</b> ".formata_data($dt_ini,4)." a ".formata_data($dt_fim,4)."</td>";
	echo "</tr>";
	echo "</table>";	
	echo "</div><br><hr><br>";


	$reponse_geofences = $traccar->geofences($sessionId);

	$geofences = json_decode($reponse_geofences->response);

	$arr_geocercas = ["9999999" => ""];

	foreach($geofences as $geofence){
			//$cor = $geofence->attributes->color;
			$geo = $geofence->name.'#'.$geofence->area.'#green';
			$arr_geocercas += ["$geofence->id" => "$geo"];
	}


	$i = 0;
    $deviceId_ant = 0;

foreach($eventos as $evento){
		$i++;
		$tipo = $evento->type;
		$icon = 'img/alerta.png';

		if( isset($evento->attributes->alarm) ){ $attributes = $evento->attributes->alarm; } else { $attributes = "";}

		If( $tipo == 'alarm') { $tipo = 'Alarme'; $icon = 'img/alarme.png'; } elseif ( $tipo == 'geofenceEnter') { $tipo = 'Entrada '; $icon = 'img/entrada.png';} elseif ( $tipo == 'geofenceExit') { $tipo = 'Saida '; $icon = 'img/entrada.png';}
		$attributes =  str_replace('sos','SOS',str_replace('alarmInrange','Aproximação',str_replace('removing',' de remoção',str_replace('"','',str_replace('}','',str_replace('{',' ',str_replace('"alarm":"','',$attributes)))))));
		$attributes =  str_replace('lock','Dispositivo Fechado',str_replace('unlock','Dispositivo Aberto',str_replace('powerOn','Dispositivo Ligado',str_replace('powerOff','Dispositivo Desligado',$attributes))));
		$attributes =  str_replace('lowBattery','Bateria Baixa',$attributes);
	
	$data_comand = $evento->eventTime;
		$data_comand = date('d/m/Y H:i:s', strtotime("$data_comand"));
		
		
		$id = $evento->id;
		$deviceId = $evento->deviceId;

		if( $deviceId != $deviceId_ant ){
				$response_devices = $traccar->devices($sessionId,$deviceId);

				$devices = json_decode($response_devices->response);

				foreach($devices as $device){
						$name = $device->name.' - '.$device->nomeCompleto;
				}

		}

		$deviceId_ant = $deviceId;

		$positionId = $evento->positionId;

		if( $positionId > 0 ){
				$reponse_position = $traccar->position($sessionId,$positionId);

				$positions = json_decode($reponse_position->response);


				foreach($positions as $position){
						//var_dump($position);
						$latitude = $position->latitude;
						$longitude = $position->longitude;
						$endereco = $position->address;
						$coordenadas[] = array(
												'latitude' => $latitude, // Gerando latitude aleatória entre -90 e 90
												'longitude' => $longitude // Gerando longitude aleatória entre -180 e 180
											);
				}
		}


		if( $evento->geofenceId > 0 ){
				$geocerca = $arr_geocercas[$evento->geofenceId];
				list($geocerca_nome,$geocerca_area,$cor_geocerca) = explode('#',$geocerca);
				$attributes .= ' '.$geocerca_nome;
		}

		imprimir_mapa($name,$data_comand,$endereco,$id,$coordenadas,$geocerca_area,$tipo.': '.$attributes);	
		unset ($coordenadas);	
}





function imprimir_mapa($nomeDevice,$horario,$endereco,$id,$coordenadas,$geocerca_area,$attributes){
	$marcadores = '';
	$variaveis = '';
	
	$icon = 'fa-exclamation-triangle';
	$color = 'red';
	
	if ( strpos($attributes,'Bater')) { 
		$icon = 'fa-battery-empty';

		if( strpos($attributes,'50') ){	$icon = 'fa-battery-half'; 	$color = 'blue';}
		if( strpos($attributes,'40') ){	$icon = 'fa-battery-half'; 	$color = 'blue';}
		if( strpos($attributes,'35') ){	$icon = 'fa-battery-half'; 	$color = 'yellow';}
		if( strpos($attributes,'30') ){	$icon = 'fa-battery-quarter'; $color = 'yellow'; 	}
		if( strpos($attributes,'25') ){	$icon = 'fa-battery-quarter';  $color = 'yellow';	}
		if( strpos($attributes,'20') ){	$icon = 'fa-battery-quarter'; 	}
		if( strpos($attributes,'15') ){	$icon = 'fa-battery-empty'; 	}
		if( strpos($attributes,'10') ){	$icon = 'fa-battery-empty'; 	}
	}	
	if ( strpos($attributes,'Fechado')) { $icon = 'fa-lock'; $color = 'green'; }
	if ( strpos($attributes,'Aberto')) { $icon = 'fa-unlock'; $color = 'red'; }
	if ( strpos($attributes,'Desligad')) { $icon = 'fa-power-off'; }
	if ( strpos($attributes,'Ligad')) { $icon = 'fa-power-off'; $color = 'green';}
	if ( strpos($attributes,'ntrad')) { $icon = 'fa-exclamation-circle '; }
	if ( strpos($attributes,'aida')) { $icon = 'fa-exclamation-circle '; }

	
	foreach ($coordenadas as $coordenada) {
		$latitude = $coordenada['latitude'];
		$longitude = $coordenada['longitude'];
		
		$variaveis .= "var customIcon$id = createCustomIcon('$icon','$color'); ";	
		
		$marcadores .= "L.marker([$latitude, $longitude],{icon: customIcon$id}).addTo(map$id); ";
		
	}
	
	if ( strpos($geocerca_area,'IRCLE') > 0) {
			$dado = str_replace('CIRCLE (','',$geocerca_area);
			$icon = '../img/circle.png';
			$lat_circ = substr($dado,0,strpos($dado,' '));
			$dado = str_replace($lat_circ,'',$dado);
			$long_circ = substr($dado,0,strpos($dado,','));
			$dado = str_replace($long_circ,'',$dado);
			$radius = substr($dado,1,strpos($dado,')')-1);
			$marcadores .= "L.circle([$lat_circ, $long_circ], {radius: '$radius',fillColor: '#ff0000',color: '#000',opacity: 1,fillOpacity: 0.1}).addTo(map$id);";
	}	
	
	if ( strpos($geocerca_area,'LYGON') > 0 ) {
				$icon = '../img/circle.png';
				$geocerca_area = str_replace('))','',str_replace('POLYGON((','',$geocerca_area));
				
				$pos_poly = explode(',',$geocerca_area);
				
				$coord = '';
				$coordinates ='';
				
				foreach($pos_poly as $pos) {
					if( $coordinates != '' ) { $coordinates .= ',';}
					
					$lat_poly = substr(trim($pos),0,strpos(trim($pos),' '));
					$long_poly = str_replace($lat_poly,'',$pos);
					
					$coordinates .= '['.$long_poly.','.$lat_poly.']';
				}
				
				$marcadores .= "L.polygon([$coordinates]).addTo(map$id);";	
	}			
	
	
	echo "<div class='device-info'>
				<table border='0'>
					<tr>
						<td width='800px'>    
							<p><strong>Nome do device: </strong>$nomeDevice</p>
							<p><strong>Evento: </strong>$attributes</p>
							<p><strong>Horário: </strong>$horario</p>
							<p><strong>Endereço: </strong>$endereco</p>
						</td>
						<td width='50px' align>    
						<div id='map-$id' class='map-container' align='right'></div>
						<script> 
							// Creating map options
							 var mapOptions = {
								center: [17.385044, 78.486671],
								zoom: 18,
								zoomControl: false
							 }
							
							const map$id = new L.map('map-$id', mapOptions).setView([$latitude, $longitude], 18);
							
													
							L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 18}).addTo(map$id);
							//var markerIcon = L.icon({iconUrl: '$icon',iconSize: [40, 40], iconAnchor: [19, 38]});
							
							
							$variaveis
							
							$marcadores
							
							</script>		
						</td>
					</tr>   
				</table>    
			</div>";
	
}
if( $i == 0) {	
	echo 'SEM DADOS';
}	
?>

</body>
</html>

<?php 

$file = 'Relatorio_evento_'.$_GET['deviceid'].'_'.rand().'.xls';

header("Content-Type:   application/vnd.ms-excel; charset=utf-8");
header("Content-Disposition: attachment; filename=$file");  //File name extension was wrong
header("Expires: 0");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Cache-Control: private",false);

?>

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
</head>
<body>

<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

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
		
		if($i == 1){
			echo "<table border='1'>
					<tr>
					<td>Id Evento</td>
					<td>Nome Device</td>
					<td>Horário</td>
					<td>Tipo Evento</td>
					<td>Latitude</td>
					<td>Longitude</td>
					<td>Endereço</td>
				</tr>";
		}		
		
		if( isset($evento->attributes->alarm) ){ $attributes = $evento->attributes->alarm; } else { $attributes = "";}

		If( $tipo == 'alarm') { $tipo = 'Alarme'; $icon = 'img/alarme.png'; } elseif ( $tipo == 'geofenceEnter') { $tipo = 'Entrada '; $icon = 'img/entrada.png';} elseif ( $tipo == 'geofenceExit') { $tipo = 'Saida '; $icon = 'img/entrada.png';}
		$attributes =  str_replace('sos','SOS',str_replace('alarmInrange','Aproximação',str_replace('removing',' de remoção',str_replace('"','',str_replace('}','',str_replace('{',' ',str_replace('"alarm":"','',$attributes)))))));

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
	$icon = 'img/alerta.png';
	foreach ($coordenadas as $coordenada) {
		$latitude = $coordenada['latitude'];
		$longitude = $coordenada['longitude'];	
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
	
	$attributes =  str_replace('sos','SOS',str_replace('alarmInrange','Aproximação',str_replace('removing',' de remoção',str_replace('"','',str_replace('}','',str_replace('{',' ',str_replace('"alarm":"','',$attributes)))))));
	$attributes =  str_replace('lock','Dispositivo Bloqueado',str_replace('unlock','Dispositivo Desbloqueado',str_replace('powerOn','Dispositivo Ligado',str_replace('powerOff','Dispositivo Desligado',$attributes))));
	$attributes =  str_replace('lowBattery','Bateria Baixa',$attributes);
	
	echo "<tr>
			<td>$id</td>
			<td>$nomeDevice</td>
			<td>$horario</td>
			<td>$attributes</td>
			<td>$latitude</td>
			<td>$longitude</td>
			<td>$endereco</td>
		</tr>";
	
}

if( $i == 0) {	
	echo 'SEM DADOS';
}	
?>

</body>
</html>


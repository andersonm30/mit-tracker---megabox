<?php

	include 'api_traccar.php';

	$traccar = new traccar();
	
	$login = $traccar->login('admin','admin');	
		
	$sessionId = $login->response;

	session_start();
	$_SESSION['user'] = 'admin';
	$_SESSION['sessionId'] = $sessionId;
	$_SESSION['Basic'] = base64_encode( 'admin' . ':' . 'admin' );
	$deviceid = $_GET['deviceid'];
	$dt_ini = $_GET['dt_ini'];
	$dt_fim = $_GET['dt_fim'];
        
	$reponse = $traccar->reportEventsType($sessionId,$deviceid,'alarm&type=geofenceExit&type=geofenceEnter',$dt_ini,$dt_fim);
	
	
	
	$eventos = json_decode($reponse->response);
	
	$geoJSON = '{
	"type": "FeatureCollection",
	"features": [';
	
	$i = 0;
	$deviceId_ant = 0;
	
	foreach($eventos as $evento){
		
		if( $i == 0){ 
			$reponse_geofences = $traccar->geofences($sessionId);
	
			$geofences = json_decode($reponse_geofences->response);
				
			$arr_geocercas = ["9999999" => ""];

			foreach($geofences as $geofence){
				//$cor = $geofence->attributes->color;
				$geo = $geofence->name.'#'.$geofence->area.'#green';
				$arr_geocercas += ["$geofence->id" => "$geo"];
			}
		}
		
		$i++;
		$tipo = $evento->type; 
		$icon = 'img/alerta.png';
		
		if( isset($evento->attributes->alarm) ){ $attributes = $evento->attributes->alarm; } else { $attributes = "";}
		
		If( $tipo == 'alarm') { $tipo = 'Alarme'; $icon = 'img/alerta.png'; } elseif ( $tipo == 'geofenceEnter') { $tipo = 'Entrada '; $icon = 'img/entrada.png';} elseif ( $tipo == 'geofenceExit') { $tipo = 'Saida '; $icon = 'img/entrada.png';} 
		$attributes =  str_replace('sos','SOS',str_replace('alarmInrange','Aproximação',str_replace('removing',' de remoção',str_replace('"','',str_replace('}','',str_replace('{',' ',str_replace('"alarm":"','',$attributes)))))));
		$attributes =  str_replace('lock','Dispositivo Bloqueado',str_replace('unlock','Dispositivo Desbloqueado',str_replace('powerOn','Dispositivo Ligado',str_replace('powerOff','Dispositivo Desligado',$attributes))));
		$attributes =  str_replace('lowBattery','Bateria Baixa',$attributes);
		
		$data_comand = $evento->eventTime;
		$data_comand = date('d/m/Y H:i:s', strtotime("$data_comand"));
		
		$id = $evento->id;
		$deviceId = $evento->deviceId;
		
		if( $deviceId != $deviceId_ant ){
			$response_devices = $traccar->devices($sessionId,$deviceId);
			
			$devices = json_decode($response_devices->response);
			
			foreach($devices as $device){
				$name = $device->name;		
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
			}
		}
		

		if( $evento->geofenceId > 0 ){
			$geocerca = $arr_geocercas[$evento->geofenceId];
			list($geocerca_nome,$geocerca_area,$cor_geocerca) = explode('#',$geocerca);
			$attributes .= ' '.$geocerca_nome;
		}	



		
		if ( $i > 1 ) { 	$geoJSON .= ','; }
		
	
		$geoJSON .= '{
						  "type": "Feature",
						  "properties": {
							"popupContent": "'.$data_comand.' : <b>'.$name.' </b> - '.$tipo.' - '.$attributes.'",
							"icon": "'.$icon.'",
							"style": {
							  "color": "#3388ff"
							}
						  },
						  "geometry": {
							"type": "Point",
							"coordinates": [
							  '.$longitude.',
							  '.$latitude.'
							],"radius": 0
						  },
						  "id": '.$id.'
						}';
						
		if ( strpos($geocerca_area,'IRCLE') > 0) {
			$dado = str_replace('CIRCLE (','',$geocerca_area);
			
			$lat_circ = substr($dado,0,strpos($dado,' '));
			$dado = str_replace($lat_circ,'',$dado);
			$long_circ = substr($dado,0,strpos($dado,','));
			$dado = str_replace($long_circ,'',$dado);
			$radius = substr($dado,1,strpos($dado,')')-1);
					
		$geoJSON .= ',{
						  "type": "Feature",
						  "properties": {
							"popupContent": "'.$geocerca_nome.'",
							"style": {
							  "color": "#3388ff"
							}
						  },
						  "geometry": {
							"type": "Point",
							"coordinates": [
							  '.$long_circ.',
							  '.$lat_circ.'
							],"radius": '.$radius.'
						  },
						  "id": '.$id.'111'.'
						}';
		}
		
		
		if ( strpos($geocerca_area,'LYGON') > 0 ) {
			
				
			
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
					
				
				$geoJSON .= ',
								{
								  "type": "Feature",
								  "properties": {
									"popupContent": "'.$geocerca_nome.'",
									"style": {
									  "color": "#33ff33"
									}
								  },
								  "geometry": {
									"type": "Polygon",
									"coordinates": [['.$coordinates.']]
								  }
								}';
			
		}
	
	}
	
	$geoJSON .= ']}';

	echo $geoJSON;
	
	
	
?>

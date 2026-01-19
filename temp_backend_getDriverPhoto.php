
    public function getDriverPhoto(Request $request, $driverId){
        // Define path da imagem (com fallback para evitar 404 com proxy)
        $ip = $request->ip() ?: 'default';
        $directory = 'assets/'.$ip.'/assets/drivers/';
        $imagePath = storage_path().'/app/'.$directory.$driverId.'.jpg';
        
        // Verifica se arquivo existe
        if(file_exists($imagePath)){
            return response()->file($imagePath, [
                'Content-Type' => 'image/jpeg',
                'Cache-Control' => 'private, max-age=31536000' // private = mais seguro
            ]);
        }
        
        // Retorna 404 se não encontrar
        return response()->json(['error' => 'Photo not found'], 404);
    }

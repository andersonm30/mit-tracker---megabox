
    public function uploadDriverPhoto(Request $request, $driverId){
        
        // 1. Validação robusta
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png|max:10240', // 10MB max
        ]);
        
        // 2. Verifica se driver existe
        $driver = \App\Models\TcDeviceDriver::where('id', $driverId)->first();
        if (!$driver) {
            return response()->json(['error' => 'Driver not found'], 404);
        }
        
        // 3. Define path (diretório separado)
        $directory = 'assets/'.$request->ip().'/assets/drivers/';
        if(!\Illuminate\Support\Facades\Storage::exists($directory)){
            \Illuminate\Support\Facades\Storage::makeDirectory($directory);
        }
        
        // 4. Processa imagem (800x800 para drivers)
        $path = storage_path().'/app/'.$directory . $driverId .'.jpg';
        \Intervention\Image\Facades\Image::make($request->file('image'))
            ->fit(800, 800)
            ->encode('jpg', 70)
            ->save($path);
        
        // 5. Registra em log
        UserLog::create([
            'user_id' => auth()->id() ?? 0,
            'action' => 'driver_photo_upload',
            'entity_id' => $driverId,
            'entity_type' => 'driver'
        ]);
        
        // 6. Retorna sucesso com URL e timestamp
        return response()->json([
            'success' => true,
            'photo_url' => '/storage/'.$directory.$driverId.'.jpg',
            'timestamp' => time() * 1000
        ], 200);
    }

Route::group(['prefix'=>'drivers'],function(){
    Route::post("/",[DriverController::class,'post']);
    Route::put("/{driverId}",[DriverController::class,'put']);
    Route::post("/{driverId}/photo",[DriverController::class,'uploadDriverPhoto']);
    Route::get("/{driverId}/photo",[DriverController::class,'getDriverPhoto']);
});

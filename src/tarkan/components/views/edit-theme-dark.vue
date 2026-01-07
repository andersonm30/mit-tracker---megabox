<template>
  <el-dialog :lock-scroll="true" width="750px" v-model="show">

    <template v-slot:title>
      <div  style="border-bottom: #e0e0e0 1px solid;padding: 20px;">
        <div class="modal-title" >{{title}}</div>
      </div>
    </template>
    <template v-slot:footer>
      <div  style="border-top: #e0e0e0 1px solid;padding: 20px;display: flex;justify-content: space-between;">

        <el-button type="danger" plain @click="doCancel()">{{KT('cancel')}}</el-button>
        <el-button type="primary" @click="doSave()">{{KT('save')}}</el-button>
      </div>
    </template>

    <el-tabs v-model="tab">

      <el-tab-pane :label="KT('theme.general')" name="general">

        <el-form label-width="150px" label-position="left">


          <div style="display: flex;justify-content: space-between">
            <div style="position: relative;background: var(--el-bg-color);width: 300px;height: 150px;">
              <img style="width: 100px;position: absolute;top: 50%;left: calc(50% - 100px);transform: translateY(-50%);" :src="'/tarkan/assets/custom/icons/android-chrome-192x192.png?uncache='+uncache">
            </div>

            <div>



              <el-form-item :label="KT('theme.icon')">
                <el-upload
                    class="upload-demo"
                    action="/tarkan/theme/upload?type=fav-icon"
                    :on-success = "onSuccess"
                >
                  <el-button type="primary">{{KT('select')}}</el-button>
                </el-upload>
              </el-form-item>
            </div>

          </div>

          <el-form-item :label="KT('theme.appName')">
            <el-input v-model="labelConf.title"></el-input>
          </el-form-item>

          <el-form-item :label="KT('theme.companyName')">
            <el-input v-model="labelConf.companyName"></el-input>
          </el-form-item>

          <el-form-item :label="KT('theme.whatsapp')">
            <el-input v-model="labelConf.whatsapp"></el-input>
          </el-form-item>

          <el-form-item :label="KT('theme.androidApp')">
            <div style="display: flex; align-items: center;">
              <el-switch v-model="labelConf.androidApp.enabled" style="margin-right: 15px;"></el-switch>
              <el-input v-if="labelConf.androidApp.enabled" v-model="labelConf.androidApp.url" placeholder="https://play.google.com/store/apps/..." style="flex: 1;"></el-input>
            </div>
          </el-form-item>

          <el-form-item :label="KT('theme.appleApp')">
            <div style="display: flex; align-items: center;">
              <el-switch v-model="labelConf.appleApp.enabled" style="margin-right: 15px;"></el-switch>
              <el-input v-if="labelConf.appleApp.enabled" v-model="labelConf.appleApp.url" placeholder="https://apps.apple.com/app/..." style="flex: 1;"></el-input>
            </div>
          </el-form-item>

          <el-form-item :label="KT('theme.dataPolicy')">
            <div style="display: flex; align-items: center;">
              <el-switch v-model="labelConf.dataPolicy.enabled" style="margin-right: 15px;"></el-switch>
              <el-input v-if="labelConf.dataPolicy.enabled" v-model="labelConf.dataPolicy.url" placeholder="https://example.com/privacy-policy" style="flex: 1;"></el-input>
            </div>
          </el-form-item>

          <el-form-item :label="KT('theme.internalLogo')">
            <el-switch v-model="labelConf.headLogo.image" :active-value="false" :inactive-value="true" :inactive-text="KT('theme.logoAsImage')" :active-text="KT('theme.logoAsText')"></el-switch>
            <div style="height: 10px;"></div>
            <el-input v-if="!labelConf.headLogo.image" v-model="labelConf.headLogo.text"></el-input>
          </el-form-item>
        </el-form>
      </el-tab-pane>





      <el-tab-pane :label="KT('theme.login')" name="first">
        <el-form label-width="150px" label-position="left">
          
          <!-- Título de la sección -->
          <div style="margin-bottom: 20px; padding: 10px; background: #f5f7fa; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">{{ KT('theme.backgroundSelection') || 'Selección de Fondo' }}</h3>
            <p style="margin: 0; color: #666; font-size: 13px;">
              {{ KT('theme.backgroundSelectionDesc') || 'Elige entre un fondo estático o efectos animados para la pantalla de login' }}
            </p>
          </div>

          <!-- Contenedor de opciones visuales -->
          <div style="display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap;">
            
            <!-- Opción 1: Imagen Estática -->
            <div 
              class="background-option" 
              :class="{ 'active': labelConf.loginBackground.mode === 'static' }"
              @click="setBackgroundMode('static')"
              style="flex: 1; min-width: 250px; cursor: pointer; border: 2px solid #dcdfe6; border-radius: 8px; padding: 10px; transition: all 0.3s;"
            >
              <div style="position: relative; width: 100%; height: 200px; border-radius: 6px; overflow: hidden; margin-bottom: 10px;">
                <div 
                  style="width: 100%; height: 100%; background-size: cover; background-position: center;"
                  :style="'background-image: url(/tarkan/assets/custom/bg.jpg?uncache='+uncache+');'"
                ></div>
                <div v-if="labelConf.loginBackground.mode === 'static'" 
                     style="position: absolute; top: 10px; right: 10px; background: #67c23a; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  ✓ {{ KT('active') || 'Activo' }}
                </div>
              </div>
              <h4 style="margin: 0 0 5px 0; text-align: center;">{{ KT('theme.staticImage') || 'Imagen Estática' }}</h4>
              <p style="margin: 0; text-align: center; color: #909399; font-size: 12px;">
                {{ KT('theme.staticImageDesc') || 'Fondo personalizable con imagen' }}
              </p>
              <div v-if="labelConf.loginBackground.mode === 'static'" style="margin-top: 20px; padding: 15px; background: #f5f7fa; border-radius: 8px;">
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 500; color: #606266; margin-bottom: 12px;">
                    <i class="fas fa-image" style="margin-right: 5px; color: var(--el-color-primary);"></i>
                    {{ KT('theme.backgroundImage') || 'Imagen de fondo (1600x900px recomendado)' }}
                  </label>
                  
                  <!-- Preview de imagen actual -->
                  <div style="width: 100%; aspect-ratio: 16/9; background: #fff; border-radius: 4px; overflow: hidden; border: 1px solid #dcdfe6; margin-bottom: 10px;">
                    <img :src="'/tarkan/assets/custom/bg.jpg?t=' + Date.now()" 
                         style="width: 100%; height: 100%; object-fit: cover;"
                         onerror="this.style.display='none'">
                  </div>
                  
                  <!-- Botón de carga -->
                  <el-upload
                    class="upload-demo"
                    action="/tarkan/theme/upload?type=bg-login"
                    :on-success="onSuccess"
                    :show-file-list="false"
                    style="width: 100%;"
                  >
                    <el-button type="primary" style="width: 100%;">
                      <i class="fas fa-upload" style="margin-right: 5px;"></i>
                      {{ KT('theme.changeImage') || 'Cambiar Imagen' }}
                    </el-button>
                  </el-upload>
                  
                  <div style="margin-top: 10px; padding: 10px; background: #ecf5ff; border-radius: 4px;">
                    <p style="margin: 0; color: #409eff; font-size: 12px;">
                      <i class="fas fa-info-circle" style="margin-right: 5px;"></i>
                      {{ KT('theme.staticTip') || 'La imagen se mostrará como fondo fijo sin animaciones' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Opción 2: Efectos Animados -->
            <div 
              class="background-option" 
              :class="{ 'active': labelConf.loginBackground.mode === 'animated' }"
              @click="setBackgroundMode('animated')"
              style="flex: 1; min-width: 250px; cursor: pointer; border: 2px solid #dcdfe6; border-radius: 8px; padding: 10px; transition: all 0.3s;"
            >
              <div style="position: relative; width: 100%; height: 200px; border-radius: 6px; overflow: hidden; margin-bottom: 10px;">
                <!-- Simulación del efecto animado -->
                <div style="width: 100%; height: 100%; background: linear-gradient(to top, #4A90E2 0%, #2E7BD6 15%, #1B5FB0 30%, #0D4799 50%, #061F3D 70%, #020817 85%, #000308 100%); position: relative;">
                  <!-- Estrellas simuladas -->
                  <div style="position: absolute; width: 100%; height: 100%;">
                    <div style="position: absolute; width: 2px; height: 2px; background: white; border-radius: 50%; top: 20%; left: 30%; box-shadow: 0 0 3px white;"></div>
                    <div style="position: absolute; width: 3px; height: 3px; background: white; border-radius: 50%; top: 40%; left: 60%; box-shadow: 0 0 4px white;"></div>
                    <div style="position: absolute; width: 2px; height: 2px; background: white; border-radius: 50%; top: 10%; left: 70%; box-shadow: 0 0 3px white;"></div>
                    <div style="position: absolute; width: 1px; height: 1px; background: white; border-radius: 50%; top: 60%; left: 20%; box-shadow: 0 0 2px white;"></div>
                    <div style="position: absolute; width: 2px; height: 2px; background: white; border-radius: 50%; top: 30%; left: 80%; box-shadow: 0 0 3px white;"></div>
                    <div style="position: absolute; width: 3px; height: 3px; background: white; border-radius: 50%; top: 70%; left: 50%; box-shadow: 0 0 4px white;"></div>
                    <div style="position: absolute; width: 1px; height: 1px; background: white; border-radius: 50%; top: 15%; left: 45%; box-shadow: 0 0 2px white;"></div>
                    <div style="position: absolute; width: 2px; height: 2px; background: white; border-radius: 50%; top: 80%; left: 75%; box-shadow: 0 0 3px white;"></div>
                  </div>
                  <!-- Efecto geométrico simulado -->
                  <div style="position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);">
                    <div style="width: 60px; height: 60px; border: 1px solid rgba(74, 144, 226, 0.3); border-radius: 50%; position: relative;">
                      <div style="width: 40px; height: 40px; border: 1px solid rgba(74, 144, 226, 0.5); border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
                    </div>
                  </div>
                </div>
                <div v-if="labelConf.loginBackground.mode === 'animated'" 
                     style="position: absolute; top: 10px; right: 10px; background: #67c23a; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  ✓ {{ KT('active') || 'Activo' }}
                </div>
              </div>
              <h4 style="margin: 0 0 5px 0; text-align: center;">{{ KT('theme.animatedEffects') || 'Efectos Animados' }}</h4>
              <p style="margin: 0; text-align: center; color: #909399; font-size: 12px;">
                {{ KT('theme.animatedEffectsDesc') || 'Cielo estrellado con efectos interactivos' }}
              </p>
              <p style="margin: 5px 0 0 0; text-align: center; color: #E6A23C; font-size: 11px; font-weight: bold;">
                "Angelo Farias"
              </p>
              <div v-if="labelConf.loginBackground.mode === 'animated'" style="margin-top: 20px; padding: 15px; background: #f5f7fa; border-radius: 8px;">
                <div style="text-align: center;">
                  <i class="fas fa-magic" style="font-size: 32px; color: var(--el-color-primary); margin-bottom: 10px;"></i>
                  <p style="margin: 10px 0; color: #606266; font-size: 13px;">
                    {{ KT('theme.animatedActiveDesc') || 'Los efectos animados están activos' }}
                  </p>
                  <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 15px;">
                    <el-tag type="success">
                      <i class="fas fa-star" style="margin-right: 5px;"></i>
                      {{ KT('theme.starsEffect') || 'Estrellas animadas' }}
                    </el-tag>
                    <el-tag type="success">
                      <i class="fas fa-mouse-pointer" style="margin-right: 5px;"></i>
                      {{ KT('theme.mouseInteraction') || 'Interacción con mouse' }}
                    </el-tag>
                    <el-tag type="success">
                      <i class="fas fa-project-diagram" style="margin-right: 5px;"></i>
                      {{ KT('theme.geometricPatterns') || 'Patrones geométricos' }}
                    </el-tag>
                  </div>
                  <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dcdfe6;">
                    <el-tag size="small" type="info">
                      <i class="fas fa-clock" style="margin-right: 5px;"></i>
                      {{ KT('theme.moreAnimationsComing') || 'Más animaciones próximamente' }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>

            <!-- Opción 3: Slider de Imágenes -->
            <div 
              class="background-option" 
              :class="{ 'active': labelConf.loginBackground.mode === 'slider' }"
              @click="setBackgroundMode('slider')"
              style="flex: 1; min-width: 250px; cursor: pointer; border: 2px solid #dcdfe6; border-radius: 8px; padding: 10px; transition: all 0.3s;"
            >
              <div style="position: relative; width: 100%; height: 200px; border-radius: 6px; overflow: hidden; margin-bottom: 10px;">
                <!-- Simulación del slider -->
                <div style="width: 100%; height: 100%; position: relative; background: #1a1a1a;">
                  <!-- Imagen 1 -->
                  <div style="position: absolute; width: 33.33%; height: 100%; left: 0; background-size: cover; background-position: center; opacity: 0.8;"
                       :style="'background-image: url(/tarkan/assets/custom/bg.jpg?uncache='+uncache+');'"></div>
                  <!-- Imagen 2 -->
                  <div style="position: absolute; width: 33.33%; height: 100%; left: 33.33%; background-size: cover; background-position: center; opacity: 0.8;"
                       :style="'background-image: url(/tarkan/assets/custom/bg1.jpg?uncache='+uncache+');'"></div>
                  <!-- Imagen 3 -->
                  <div style="position: absolute; width: 33.33%; height: 100%; left: 66.66%; background-size: cover; background-position: center; opacity: 0.8;"
                       :style="'background-image: url(/tarkan/assets/custom/bg2.jpg?uncache='+uncache+');'"></div>
                  <!-- Indicador de movimiento -->
                  <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px;">
                    <i class="fas fa-chevron-left" style="color: white; opacity: 0.6;"></i>
                    <i class="fas fa-chevron-left" style="color: white; opacity: 0.8;"></i>
                    <i class="fas fa-chevron-left" style="color: white;"></i>
                  </div>
                </div>
                <div v-if="labelConf.loginBackground.mode === 'slider'" 
                     style="position: absolute; top: 10px; right: 10px; background: #67c23a; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                  ✓ {{ KT('active') || 'Activo' }}
                </div>
              </div>
              <h4 style="margin: 0 0 5px 0; text-align: center;">{{ KT('theme.imageSlider') || 'Slider de Imágenes' }}</h4>
              <p style="margin: 0; text-align: center; color: #909399; font-size: 12px;">
                {{ KT('theme.imageSliderDesc') || 'Transición suave entre 3 imágenes' }}
              </p>
              <p style="margin: 5px 0 0 0; text-align: center; color: #409EFF; font-size: 11px; font-weight: bold;">
                "modo Michell Olivera"
              </p>
              <div v-if="labelConf.loginBackground.mode === 'slider'" style="margin-top: 20px; padding: 15px; background: #f5f7fa; border-radius: 8px;">
                <!-- Configuración de velocidad -->
                <div style="margin-bottom: 25px;">
                  <label style="display: block; font-size: 13px; font-weight: 500; color: #606266; margin-bottom: 12px;">
                    <i class="fas fa-clock" style="margin-right: 5px; color: var(--el-color-primary);"></i>
                    {{ KT('theme.sliderSpeed') || 'Velocidad de transición' }}
                  </label>
                  <el-slider 
                    v-model="labelConf.loginBackground.sliderSpeed"
                    :min="3000"
                    :max="10000"
                    :step="1000"
                    :marks="{3000: '3s', 5000: '5s', 7000: '7s', 10000: '10s'}"
                    show-stops
                    style="padding: 0 10px;"
                  ></el-slider>
                </div>
                
                <!-- Configuración de dirección -->
                <div style="margin-bottom: 25px;">
                  <label style="display: block; font-size: 13px; font-weight: 500; color: #606266; margin-bottom: 12px;">
                    <i class="fas fa-arrows-alt-h" style="margin-right: 5px; color: var(--el-color-primary);"></i>
                    {{ KT('theme.sliderDirection') || 'Dirección del movimiento' }}
                  </label>
                  <el-radio-group v-model="labelConf.loginBackground.sliderDirection" style="width: 100%; display: flex; gap: 10px;">
                    <el-radio-button label="rightToLeft" style="flex: 1; text-align: center;">
                      <i class="fas fa-arrow-left" style="margin-right: 5px;"></i>
                      {{ KT('theme.rightToLeft') || 'Derecha a Izquierda' }}
                    </el-radio-button>
                    <el-radio-button label="leftToRight" style="flex: 1; text-align: center;">
                      <i class="fas fa-arrow-right" style="margin-right: 5px;"></i>
                      {{ KT('theme.leftToRight') || 'Izquierda a Derecha' }}
                    </el-radio-button>
                  </el-radio-group>
                </div>
                
                <!-- Carga de imágenes -->
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 500; color: #606266; margin-bottom: 12px;">
                    <i class="fas fa-images" style="margin-right: 5px; color: var(--el-color-primary);"></i>
                    {{ KT('theme.sliderImages') || 'Imágenes del slider (1600x900px recomendado)' }}
                  </label>
                  
                  <!-- Preview de imágenes -->
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px;">
                    <div style="aspect-ratio: 16/9; background: #fff; border-radius: 4px; overflow: hidden; border: 1px solid #dcdfe6; position: relative;">
                      <img :src="'/tarkan/assets/custom/bg.jpg?t=' + Date.now()" 
                           style="width: 100%; height: 100%; object-fit: cover;"
                           onerror="this.style.display='none'">
                      <div style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
                        Imagen 1
                      </div>
                    </div>
                    <div style="aspect-ratio: 16/9; background: #fff; border-radius: 4px; overflow: hidden; border: 1px solid #dcdfe6; position: relative;">
                      <img :src="'/tarkan/assets/custom/bg1.jpg?t=' + Date.now()" 
                           style="width: 100%; height: 100%; object-fit: cover;"
                           onerror="this.style.display='none'">
                      <div style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
                        Imagen 2
                      </div>
                    </div>
                    <div style="aspect-ratio: 16/9; background: #fff; border-radius: 4px; overflow: hidden; border: 1px solid #dcdfe6; position: relative;">
                      <img :src="'/tarkan/assets/custom/bg2.jpg?t=' + Date.now()" 
                           style="width: 100%; height: 100%; object-fit: cover;"
                           onerror="this.style.display='none'">
                      <div style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
                        Imagen 3
                      </div>
                    </div>
                  </div>
                  
                  <!-- Botones de carga -->
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    <el-upload
                      class="upload-demo"
                      action="/tarkan/theme/upload?type=bg-login"
                      :on-success="onSuccess"
                      :show-file-list="false"
                    >
                      <el-button size="small" type="primary" style="width: 100%;">
                        <i class="fas fa-upload" style="margin-right: 5px;"></i>
                        Cambiar 1
                      </el-button>
                    </el-upload>
                    <el-upload
                      class="upload-demo"
                      action="/tarkan/theme/upload?type=bg1-login"
                      :on-success="onSuccess"
                      :show-file-list="false"
                    >
                      <el-button size="small" type="primary" style="width: 100%;">
                        <i class="fas fa-upload" style="margin-right: 5px;"></i>
                        Cambiar 2
                      </el-button>
                    </el-upload>
                    <el-upload
                      class="upload-demo"
                      action="/tarkan/theme/upload?type=bg2-login"
                      :on-success="onSuccess"
                      :show-file-list="false"
                    >
                      <el-button size="small" type="primary" style="width: 100%;">
                        <i class="fas fa-upload" style="margin-right: 5px;"></i>
                        Cambiar 3
                      </el-button>
                    </el-upload>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Configuraciones adicionales -->
          <div style="border-top: 1px solid #ebeef5; padding-top: 20px;">
            <el-form-item :label="KT('theme.filterColor')">
              <div style="display: flex; align-items: center; gap: 10px;">
                <el-color-picker 
                  @active-change="updateGlobal()" 
                  :show-alpha="true" 
                  @change="updateGlobal()" 
                  v-model="formData['--tk-login-filter']"
                ></el-color-picker>
                <span style="color: #909399; font-size: 12px;">
                  {{ KT('theme.filterColorDesc') || 'Aplica un filtro de color sobre el fondo' }}
                </span>
              </div>
            </el-form-item>
          </div>

        </el-form>
      </el-tab-pane>

      <el-tab-pane :label="KT('theme.logos')" name="first3">
        <el-form label-width="150px" label-position="left">

          <div style="display: flex;justify-content: space-between">
            <div class="loginfake" style="position: relative;width: 300px;height: 150px;" :style="'background-image: url(/tarkan/assets/custom/bg.jpg?uncache='+uncache+');'">
              <img style="z-index: 9999999;width: 200px;position: absolute;top: 50%;left: calc(50% - 100px);transform: translateY(-50%);" :src="'/tarkan/assets/custom/logoWhite.png?uncache='+uncache">
            </div>

            <div>



              <el-form-item :label="KT('theme.logoOnLogin')">
                <el-upload
                    class="upload-demo"
                    action="/tarkan/theme/upload?type=logo-login"

                    :on-success = "onSuccess"
                >
                  <el-button type="primary">{{KT('select')}}</el-button>

                </el-upload>
              </el-form-item>

              <el-form-item :label="KT('theme.logoSize')">
                <el-slider v-model="sizeLogo" @change="changeLogo($event)" :min="10" :max="100"></el-slider>
              </el-form-item>
            </div>

          </div>





          <div style="display: flex;justify-content: space-between">
            <div style="position: relative;background: var(--el-bg-color);width: 300px;height: 150px;">
              <img style="width: 200px;position: absolute;top: 50%;left: calc(50% - 100px);transform: translateY(-50%);" :src="'/tarkan/assets/custom/logo.png?uncache='+uncache">
            </div>

            <div>



              <el-form-item :label="KT('theme.logoOnHead')">
                <el-upload
                    class="upload-demo"
                    action="/tarkan/theme/upload?type=logo-interno"

                    :on-success = "onSuccess"
                >
                  <el-button type="primary">{{KT('select')}}</el-button>

                </el-upload>
              </el-form-item>
            </div>

          </div>
        </el-form>


      </el-tab-pane>

      <el-tab-pane :label="KT('theme.generalColors')" name="first2">
        <el-form label-width="150px" label-position="left">
          <div style="display: flex;justify-content: space-between">
            <el-form-item  :label="KT('theme.backgroundColor')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-bg-color']" ></el-color-picker>
            </el-form-item>

            <el-form-item  :label="KT('theme.textColor')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-text-color-primary']" ></el-color-picker>
            </el-form-item>
          </div>

          <div style="display: flex;justify-content: space-between">
            <el-form-item  :label="KT('theme.generalWhite')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-white']" ></el-color-picker>
            </el-form-item>

            <el-form-item  :label="KT('theme.generalBlack')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-black']" ></el-color-picker>
            </el-form-item>
          </div>


          <div style="display: flex;justify-content: space-between">
            <el-form-item  :label="KT('theme.primary')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-primary']" ></el-color-picker>
            </el-form-item>

            <el-form-item  :label="KT('theme.variant1')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-primary-light-1']" ></el-color-picker>
            </el-form-item>
          </div>



          <div style="display: flex;justify-content: space-between">
            <el-form-item  :label="KT('theme.variant2')"  >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-primary-light-2']" ></el-color-picker>
            </el-form-item>

            <el-form-item  :label="KT('theme.variant3')"  >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-primary-light-3']" ></el-color-picker>
            </el-form-item>
          </div>



          <div style="display: flex;justify-content: space-between">
            <el-form-item  :label="KT('theme.variant4')"  >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-primary-light-4']" ></el-color-picker>
            </el-form-item>

            <el-form-item  :label="KT('theme.variant5')"  >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-primary-light-5']" ></el-color-picker>
            </el-form-item>
          </div>


          <div style="display: flex;justify-content: space-between">
            <el-form-item  :label="KT('theme.variant6')"  >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-primary-light-6']" ></el-color-picker>
            </el-form-item>

            <el-form-item  :label="KT('theme.variant7')"  >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-primary-light-7']" ></el-color-picker>
            </el-form-item>
          </div>


          <div style="display: flex;justify-content: space-between">
            <el-form-item :label="KT('theme.variant8')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-primary-light-8']" ></el-color-picker>
            </el-form-item>

            <el-form-item :label="KT('theme.variant9')"  >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-primary-light-9']" ></el-color-picker>
            </el-form-item>
          </div>




        </el-form>


      </el-tab-pane>


      <el-tab-pane :label="KT('theme.textColors')" name="second">
        <el-form label-width="170px" label-position="left">
          <div style="display: flex;justify-content: space-between">
            <el-form-item  :label="KT('theme.textPrimary')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-text-color-primary']" ></el-color-picker>
            </el-form-item>

            <el-form-item   :label="KT('theme.textRegular')"  >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-text-color-regular']" ></el-color-picker>
            </el-form-item>
          </div>

          <div style="display: flex;justify-content: space-between">
            <el-form-item  :label="KT('theme.textSecondary')"  >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-text-color-secondary']" ></el-color-picker>
            </el-form-item>

            <el-form-item   :label="KT('theme.textWhite')"  >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-text-color-placeholder']" ></el-color-picker>
            </el-form-item>
          </div>

        </el-form>
      </el-tab-pane>


      <el-tab-pane :label="KT('theme.otherColors')" name="third">
        <el-form label-width="170px" label-position="left">
          <div style="display: flex;justify-content: space-between">
            <el-form-item  :label="KT('theme.success')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-success']" ></el-color-picker>
            </el-form-item>

            <el-form-item  :label="KT('theme.successVariant1')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-success-light']" ></el-color-picker>
            </el-form-item>


            <el-form-item  :label="KT('theme.successVariant2')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-success-lighter']" ></el-color-picker>
            </el-form-item>
          </div>

          <div style="display: flex;justify-content: space-between">
            <el-form-item  :label="KT('theme.alert')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-warning']" ></el-color-picker>
            </el-form-item>

            <el-form-item  :label="KT('theme.alertVariant1')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-warning-light']" ></el-color-picker>
            </el-form-item>


            <el-form-item  :label="KT('theme.alertVariant2')">
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-warning-lighter']" ></el-color-picker>
            </el-form-item>
          </div>


          <div style="display: flex;justify-content: space-between">
            <el-form-item  :label="KT('theme.danger')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-danger']" ></el-color-picker>
            </el-form-item>

            <el-form-item  :label="KT('theme.dangerVariant1')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-danger-light']" ></el-color-picker>
            </el-form-item>


            <el-form-item  :label="KT('theme.dangerVariant2')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-danger-lighter']" ></el-color-picker>
            </el-form-item>
          </div>



          <div style="display: flex;justify-content: space-between">
            <el-form-item  :label="KT('theme.info')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-info']" ></el-color-picker>
            </el-form-item>

            <el-form-item :label="KT('theme.infoVariant1')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-info-light']" ></el-color-picker>
            </el-form-item>


            <el-form-item  :label="KT('theme.infoVariant2')" >
              <el-color-picker @active-change="updateGlobal()" @change="updateGlobal()" v-model="formData['--el-color-info-lighter']" ></el-color-picker>
            </el-form-item>
          </div>



        </el-form>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>


<script setup>


import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/switch/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/tab-pane/style/css'
import 'element-plus/es/components/tabs/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/color-picker/style/css'
import 'element-plus/es/components/upload/style/css'
import 'element-plus/es/components/slider/style/css'
import 'element-plus/es/components/radio/style/css'
import 'element-plus/es/components/radio-group/style/css'
import 'element-plus/es/components/radio-button/style/css'
import 'element-plus/es/components/tag/style/css'

import {ElDialog,ElTabs,ElTabPane,ElForm,ElSwitch,ElFormItem,ElButton,ElInput,ElSlider,ElUpload,ElColorPicker,ElRadioGroup,ElRadioButton,ElTag} from "element-plus";


import KT from '../../func/kt';

import {ref,defineExpose} from 'vue';
import {useStore} from 'vuex';

const store = useStore();

const title = ref('');

const show = ref(false);
const tab = ref('general');

const uncache = ref(new Date().getTime());

// Objeto de configuración por defecto
const defaultConfig = {
  title: 'Demo - Tarkan.APP',
  companyName: '',
  headLogo: {
    image: false,
    text: 'Tarkan'
  },
  whatsapp: '',
  androidApp: {
    enabled: false,
    url: ''
  },
  appleApp: {
    enabled: false,
    url: ''
  },
  dataPolicy: {
    enabled: false,
    url: ''
  },
  loginBackground: {
    mode: 'static', // 'static', 'animated', 'slider'
    sliderSpeed: 5000, // velocidad en milisegundos
    sliderDirection: 'rightToLeft', // 'rightToLeft', 'leftToRight'
    useAnimatedEffect: false // mantener compatibilidad
  }
};

// Usar el objeto global CONFIG si está disponible, o el predeterminado
// eslint-disable-next-line no-undef
const labelConf = ref(typeof window !== 'undefined' && window.CONFIG ? window.CONFIG : defaultConfig);

// Definimos un objeto por defecto completo
const defaultColors = {
  "--tk-login-filter":"rgba(255, 255, 255, 0.65)",
  "--el-color-primary":"#007eff",
  "--el-color-white":"#ffffff",
  "--el-color-black":"#000000",
  "--el-color-primary-light-1":"#53a8ff",
  "--el-color-primary-light-2":"#66b1ff",
  "--el-color-primary-light-3":"#79bbff",
  "--el-color-primary-light-4":"#8cc5ff",
  "--el-color-primary-light-5":"#a0cfff",
  "--el-color-primary-light-6":"#b3d8ff",
  "--el-color-primary-light-7":"#c6e2ff",
  "--el-color-primary-light-8":"#d9ecff",
  "--el-color-primary-light-9":"#ecf5ff",
  "--el-color-success":"#67c23a",
  "--el-color-success-light":"#e1f3d8",
  "--el-color-success-lighter":"#f0f9eb",
  "--el-color-warning":"#e6a23c",
  "--el-color-warning-light":"#faecd8",
  "--el-color-warning-lighter":"#fdf6ec",
  "--el-color-danger":"#f56c6c",
  "--el-color-danger-light":"#fde2e2",
  "--el-color-danger-lighter":"#fef0f0",
  "--el-color-error":"#f56c6c",
  "--el-color-error-light":"#fde2e2",
  "--el-color-error-lighter":"#fef0f0",
  "--el-color-info":"#909399",
  "--el-color-info-light":"#e9e9eb",
  "--el-color-info-lighter":"#f4f4f5",
  "--el-bg-color":"#ffffff",
  "--el-text-color-disabled-base":"#bbb",
  "--el-text-color-primary":"#1a1a1a",
  "--el-text-color-regular":"#606266",
  "--el-text-color-secondary":"#909399",
  "--el-text-color-placeholder":"#c0c4cc",
  "--el-border-color-base":"#dcdfe6",
  "--el-border-color-light":"#e4e7ed",
  "--el-border-color-lighter":"#ebeef5",
  "--el-border-color-extra-light":"#f2f6fc"
};

// Usar el objeto definido localmente o el global si está disponible
const formData = ref(typeof window !== 'undefined' && window.defaultThemeData ? window.defaultThemeData : defaultColors);

const sizeLogo = ref(80);

const changeLogo = (e)=>{
  const tmp = JSON.parse(JSON.stringify(store.state.server.serverInfo));
  tmp.attributes['tarkan.logoWidth'] = e;

  store.dispatch("server/save",tmp);
}

const updateGlobal = ()=>{

  let tmp = [];

  // eslint-disable-next-line no-undef
  for(var v of Object.keys(defaultThemeData)){
    tmp.push(v+':'+formData.value[v]+';');
  }

  document.querySelector(":root").style=tmp.join("");
}

const onSuccess = ()=>{
  uncache.value = new Date().getTime();
}

const setBackgroundMode = (mode) => {
  labelConf.value.loginBackground.mode = mode;
  // Mantener compatibilidad con useAnimatedEffect
  labelConf.value.loginBackground.useAnimatedEffect = (mode === 'animated');
}

const showTheme = ()=>{
  console.log("🎨 Abriendo modal de tema...");
  title.value = KT('theme.edit');
  tab.value = 'general';
  // eslint-disable-next-line no-undef
  formData.value = JSON.parse(JSON.stringify(defaultThemeData));

  // Inicializar configuraciones de app y política de datos si no existen
  if (!labelConf.value.companyName) {
    labelConf.value.companyName = '';
  }
  
  if (!labelConf.value.androidApp) {
    labelConf.value.androidApp = { enabled: false, url: '' };
  }
  
  if (!labelConf.value.appleApp) {
    labelConf.value.appleApp = { enabled: false, url: '' };
  }
  
  if (!labelConf.value.dataPolicy) {
    labelConf.value.dataPolicy = { enabled: false, url: '' };
  }
  
  if (!labelConf.value.loginBackground) {
    labelConf.value.loginBackground = { 
      mode: 'static',
      sliderSpeed: 5000,
      sliderDirection: 'rightToLeft',
      useAnimatedEffect: false 
    };
  } else {
    // Migrar de la estructura antigua a la nueva
    if (labelConf.value.loginBackground.useAnimatedEffect && !labelConf.value.loginBackground.mode) {
      labelConf.value.loginBackground.mode = 'animated';
    } else if (!labelConf.value.loginBackground.mode) {
      labelConf.value.loginBackground.mode = 'static';
    }
    if (!labelConf.value.loginBackground.sliderSpeed) {
      labelConf.value.loginBackground.sliderSpeed = 5000;
    }
    if (!labelConf.value.loginBackground.sliderDirection) {
      labelConf.value.loginBackground.sliderDirection = 'rightToLeft';
    }
  }

  show.value = true;
  sizeLogo.value = store.state.server.serverInfo.attributes['tarkan.logoWidth'] || 80;
}

defineExpose({
  showTheme
});


const doCancel = ()=>{
  show.value = false;
}





const doSave = async ()=>{
  // Asegurar que todas las propiedades necesarias estén definidas antes de guardar
  if (!labelConf.value.companyName) {
    labelConf.value.companyName = '';
  }
  
  if (!labelConf.value.androidApp) {
    labelConf.value.androidApp = { enabled: false, url: '' };
  }
  
  if (!labelConf.value.appleApp) {
    labelConf.value.appleApp = { enabled: false, url: '' };
  }
  
  if (!labelConf.value.dataPolicy) {
    labelConf.value.dataPolicy = { enabled: false, url: '' };
  }
  
  if (!labelConf.value.loginBackground) {
    labelConf.value.loginBackground = { 
      mode: 'static',
      sliderSpeed: 5000,
      sliderDirection: 'rightToLeft',
      useAnimatedEffect: false 
    };
  } else {
    // Migrar de la estructura antigua a la nueva
    if (labelConf.value.loginBackground.useAnimatedEffect && !labelConf.value.loginBackground.mode) {
      labelConf.value.loginBackground.mode = 'animated';
    } else if (!labelConf.value.loginBackground.mode) {
      labelConf.value.loginBackground.mode = 'static';
    }
    if (!labelConf.value.loginBackground.sliderSpeed) {
      labelConf.value.loginBackground.sliderSpeed = 5000;
    }
    if (!labelConf.value.loginBackground.sliderDirection) {
      labelConf.value.loginBackground.sliderDirection = 'rightToLeft';
    }
  }
  
  
  try {
    await window.$tarkan.saveTheme({config: labelConf.value, colors: formData.value});
    
    // Actualizar la configuración global para que los cambios sean visibles inmediatamente
    // eslint-disable-next-line no-undef
    window.CONFIG = JSON.parse(JSON.stringify(labelConf.value));
    
    // Aplicar los cambios de colores inmediatamente
    updateGlobal();
    
    show.value = false;
    
  } catch (error) {
    alert(`Error al guardar: ${error.response?.status || error.message}`);
  }
}


</script>

<style>

.el-select.el-select--large{
  width: 100%;
}

.el-dialog__header,.el-dialog__body,.el-dialog__footer{
  padding: 0px !important;
}

.el-dialog__footer{
  margin-top: 20px;
}

.el-tabs__nav-wrap{
  padding-left: 20px;
  padding-right: 20px;
}

.el-tabs__content{
  padding-left: 20px;
  padding-right: 20px;
}

/* Estilos para las opciones de fondo */
.background-option {
  position: relative;
  opacity: 0.7;
}

.background-option:hover {
  opacity: 1;
  border-color: #409eff !important;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.background-option.active {
  opacity: 1;
  border-color: #409eff !important;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
  background: #f0f9ff;
}

.loginfake{

  background-size: cover;
  width: 300px;
  height: 150px;
}

.loginfake:after {
  content: " ";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 170px;
  box-sizing: border-box;
  background: var(--tk-login-filter);
}

</style>
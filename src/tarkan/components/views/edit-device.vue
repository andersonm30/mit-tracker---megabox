<template>
  <BaseModal
    v-model="show"
    :title="title"
    icon="fas fa-location-arrow"
    width="70%"
    variant="device"
    @closed="onDialogClosed"
  >
    <template #footer>
      <div class="device-footer">
        <div class="device-footer-left">
          <el-button type="info" plain @click="generatePDF()" v-if="formData.id">
            <i class="fas fa-file-pdf"></i> {{KT('device.generatePDF')}}
          </el-button>
        </div>
        <div class="device-footer-right">
          <el-button type="danger" plain @click="doCancel()">{{KT('cancel')}}</el-button>
          <el-button type="primary" @click="doSave()">{{KT('save')}}</el-button>
        </div>
      </div>
    </template>

    <el-form  ref="formRef" :model="formData" :rules="rules" label-width="120px" label-position="top">
    <el-tabs v-model="tab">
   



      <el-tab-pane :name="'first'">
  <template #label>
    <i class="fas fa-location-arrow"></i> {{ KT('device.device') }}
  </template>

  <!-- Primeira linha: uniqueId, nome e switch (em uma única linha) -->
  <div class="form-row">
    <el-form-item :label="KT('device.imei')" prop="uniqueId" class="form-col-70">
      <el-input v-model="formData.uniqueId"></el-input>
    </el-form-item>
    <el-form-item :label="KT('device.name')" prop="name" class="form-col-70">
      <el-input v-model="formData.name"></el-input>
    </el-form-item>
    <el-form-item v-if="store.state.auth.administrator" :label="KT('device.status')" class="form-col-70">
      <el-switch
        v-model="formData.disabled"
        :inactive-text="KT('disabled')"
        :active-text="KT('enabled')"
        :active-value="false"
        :inactive-value="true"
      />
    </el-form-item>
  </div>

  <!-- Nova seção para o estado do dispositivo -->
  <div v-if="store.state.auth.administrator" class="device-state-section">
    <el-form-item :label="KT('device.state')" class="form-full">
      <el-select v-model="formData.attributes['device.state']" placeholder="Estado do dispositivo" style="width: 100%;">
        <el-option label="Instalado em Cliente" value="installed"></el-option>
        <el-option label="Em Serviço Técnico" value="in_service"></el-option>
        <el-option label="Em Estoque" value="in_stock"></el-option>
        <el-option label="Com Falhas" value="with_failures"></el-option>
        <el-option label="Em Empresa" value="company"></el-option>
        <el-option label="Retirado" value="withdrawn"></el-option>
      </el-select>
    </el-form-item>
  </div>

  <!-- Campos de Marca e Modelo de GPS -->
  <div class="form-row">
    <el-form-item label="Marca GPS" class="form-col-70">
      <el-select 
        v-model="selectedGpsBrand" 
        filterable 
        allow-create
        default-first-option
        placeholder="Selecione a marca do GPS" 
        style="width: 100%;" 
        @change="updateGpsBrand">
        <el-option v-for="brand in gpsBrands" :key="brand" :label="brand" :value="brand"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item :label="KT('device.model')" class="form-col-70">
      <el-select 
        v-model="formData.attributes['device.model']" 
        filterable 
        allow-create
        default-first-option
        placeholder="Selecione o modelo do GPS" 
        style="width: 100%;">
        <el-option 
          v-for="model in availableGpsModels" 
          :key="model" 
          :label="model" 
          :value="model">
        </el-option>
      </el-select>
    </el-form-item>
  </div>
  
  <!-- Campos de Tecnologia e Protocolo -->
  <div class="form-row">
    <el-form-item :label="KT('device.technology')" class="form-col-70">
      <el-select v-model="formData.attributes['device.technology']" placeholder="Tecnologia" style="width: 100%;">
        <el-option label="2G" value="2G"></el-option>
        <el-option label="3G" value="3G"></el-option>
        <el-option label="2/4G" value="2-4G"></el-option>
        <el-option label="4G" value="4G"></el-option>
        <el-option label="5G" value="5G"></el-option>
        <el-option label="LBS" value="LBS"></el-option>
        <el-option label="WiFi" value="WiFi"></el-option>
        <el-option label="Tag RFID" value="Tag_RFID"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item :label="KT('device.protocol')" class="form-col-70">
      <el-select v-model="formData.attributes['device.protocol']" filterable placeholder="Protocolo" style="width: 100%;">
        <el-option v-for="protocol in protocols" :key="protocol" :label="protocol" :value="protocol"></el-option>
      </el-select>
    </el-form-item>
  </div>

  <!-- Segunda linha: grupo (largura completa) -->
  <div class="form-row">
    <el-form-item :label="KT('group.group')" class="form-full">
      <el-select v-model="formData.groupId" :value-key="'id'" filterable :placeholder="KT('group.group')" :size="'large'" :no-match-text="KT('NO_MATCH_TEXT')" :no-data-text="KT('NO_DATA_TEXT')">
        <el-option :label="KT('no')" :value="0"></el-option>
        <el-option v-for="item in store.state.groups.groupList" :key="item.id" :label="item.name" :value="item.id"></el-option>
      </el-select>
    </el-form-item>
  </div>

</el-tab-pane>





      


    <el-tab-pane :name="'second-one'">
      <template #label>
        <i class="fas fa-sim-card"></i> {{ KT('device.chip') }}
      </template>

  <el-form :model="formData">
    <!-- Linha 1: ICCID e Número SIM -->
    <div class="form-row">
      <el-form-item :label="KT('device.iccid')" class="form-col-70">
        <el-input v-model="formData.attributes['iccid']" placeholder="Insira o ICCID"></el-input>
      </el-form-item>

      <el-form-item :label="KT('device.phone')" class="form-col-70">
        <el-input v-model="formData.attributes['phone']" placeholder="Insira o Número do SIM"></el-input>
      </el-form-item>
    </div>

    <!-- Linha Velocidade: Velocidade de Notificação (PR-09B + PR-09C Guardrails) -->
    <div class="form-row">
      <el-form-item label="Velocidade de Notificação (km/h)" class="form-col-70">
        <div class="speed-limit-input">
          <el-input-number 
            v-model="formData.attributes.speedLimitKmh" 
            :min="0" 
            :max="300" 
            :step="1" 
            controls-position="right"
            placeholder="Ex: 80"
            class="form-full"
            @blur="handleSpeedLimitBlur"
          />
          <!-- Badge de status (PR-09C) -->
          <el-tag 
            v-if="speedLimitStatus.hasLimit" 
            type="success" 
            size="small"
            effect="plain"
          >
            Configurado
          </el-tag>
          <el-tag 
            v-else 
            type="info" 
            size="small"
            effect="plain"
          >
            Sem limite
          </el-tag>
        </div>
        
        <!-- Helper text + tooltip (PR-09C) -->
        <div class="speed-limit-helper">
          Usada para alertas de excesso de velocidade<br/>
          <span style="color: #606266;">💡 Valores comuns: urbano 40–60, rodovia 80–110</span>
        </div>
        
        <!-- Warnings não bloqueantes (PR-09C) -->
        <el-alert 
          v-if="speedLimitStatus.warnings.low" 
          type="warning" 
          :closable="false"
          show-icon
          style="margin-top: 8px;"
        >
          <template #title>
            Valor muito baixo (&lt; 20 km/h) - provável erro
          </template>
        </el-alert>
        <el-alert 
          v-if="speedLimitStatus.warnings.high" 
          type="warning" 
          :closable="false"
          show-icon
          style="margin-top: 8px;"
        >
          <template #title>
            Valor muito alto (> 180 km/h) - provável erro
          </template>
        </el-alert>
      </el-form-item>
      <div class="form-col-70"></div>
    </div>

    <!-- Linha 2: Broker e Operadora -->
    <div class="form-row">
      <el-form-item :label="KT('device.brocker')" class="form-col-70">
        <el-input v-model="formData.attributes['broker']" :placeholder="KT('device.brocker')"></el-input>
      </el-form-item>

      <el-form-item :label="KT('device.operator')" class="form-col-70">
        <el-input v-model="formData.attributes['operator']" placeholder="Insira a Operadora"></el-input>
      </el-form-item>
    </div>

    <!-- Linha 3: APN e Valor Mensal -->
    <div class="form-row">
      <el-form-item :label="KT('device.apn')" class="form-col-70">
        <el-input v-model="formData.attributes['APN']" placeholder="Insira o APN"></el-input>
      </el-form-item>

      <el-form-item :label="KT('device.ValoMensual')" class="form-col-70">
        <el-input v-model="formData.attributes['ValoMensual']" placeholder="Valor Mensal"></el-input>
      </el-form-item>
    </div>

    <!-- Linha 4: Data de Ativação e Data de Vencimento -->
    <div class="form-row">
      <el-form-item :label="KT('device.dataSimAct')" class="form-col-70">
        <el-input v-model="formData.attributes['dataSimAct']" 
                  type="date" 
                  placeholder="Data de Ativação" 
                  :size="'small'" >
        </el-input>
      </el-form-item>

      <el-form-item :label="KT('device.dataSimVal')" class="form-col-70">
        <el-input v-model="formData.attributes['dataSimVal']" 
                  type="date" 
                  placeholder="Data de Vencimento" 
                  :size="'small'">
        </el-input>
      </el-form-item>
    </div>
  </el-form>
</el-tab-pane>







     
      <el-tab-pane :name="'second-two'">
      <template #label>
        <i class="fas fa-user-plus"></i> {{ KT('user.user') }}
      </template>

        <div class="user-form-container">
          <!-- Vincular Usuário do Sistema -->
          <div class="user-section">
            <h4 class="section-title">Vincular Usuário ao Veículo</h4>
            <p style="color: #909399; font-size: 13px; margin-bottom: 15px;">
              Selecione um usuário para conceder permissão de acesso a este veículo. O usuário poderá visualizar e gerenciar este dispositivo no sistema.
            </p>
            
            <el-form-item label="Usuário Vinculado" class="user-form-item">
              <el-select 
                v-model="linkedUserId" 
                filterable 
                clearable
                :placeholder="'Selecione um usuário...'"
                :size="'large'" 
                :no-match-text="KT('NO_MATCH_TEXT')" 
                :no-data-text="KT('NO_DATA_TEXT')"
                @change="handleUserLink"
                style="width: 100%"
              >
                <el-option
                  v-for="user in store.state.users.userList"
                  :key="user.id"
                  :label="`${user.name} (${user.email})`"
                  :value="user.id"
                >
                  <div class="user-option">
                    <span>{{ user.name }}</span>
                    <span class="user-email">{{ user.email }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            
            <el-alert
              v-if="linkedUserId"
              title="Usuário vinculado com sucesso!"
              type="success"
              :closable="false"
              show-icon
              style="margin-top: 10px;"
            >
              Este usuário terá permissão para acessar e gerenciar este veículo.
            </el-alert>
          </div>
          
          <!-- Informações do Proprietário (opcional) -->
          <div class="user-section" style="margin-top: 30px;">
            <h4 class="section-title">Dados do Proprietário (Opcional)</h4>
            <p style="color: #909399; font-size: 13px; margin-bottom: 15px;">
              Informações cadastrais do proprietário do veículo para relatórios e documentação.
            </p>
            
            <el-form-item :label="KT('user.name')" class="user-form-item">
              <el-input v-model="formData.attributes['tarkan.name']" placeholder="Nome completo"></el-input>
            </el-form-item>
            <el-form-item :label="KT('user.phone')" class="user-form-item">
              <el-input v-model="formData.contact" placeholder="(00) 00000-0000"></el-input>
            </el-form-item>
            <el-form-item :label="KT('user.email')" class="user-form-item">
              <el-input v-model="formData.attributes['tarkan.email']" placeholder="email@exemplo.com"></el-input>
            </el-form-item>
          </div>
          
          <!-- Endereço -->
          <div class="user-section" style="margin-top: 20px;">
            <h4 class="section-title">Endereço do Proprietário</h4>
            <div class="address-row">
              <el-form-item label="CEP" class="user-form-item cep-field">
                <el-input v-model="formData.attributes['tarkan.cep']" placeholder="00000-000"></el-input>
              </el-form-item>
              <el-form-item label="Rua" class="user-form-item street-field">
                <el-input v-model="formData.attributes['tarkan.rua']"></el-input>
              </el-form-item>
              <el-form-item label="Número" class="user-form-item number-field">
                <el-input v-model="formData.attributes['tarkan.numero']"></el-input>
              </el-form-item>
            </div>
            <div class="address-row">
              <el-form-item label="Complemento" class="user-form-item">
                <el-input v-model="formData.attributes['tarkan.complemento']"></el-input>
              </el-form-item>
              <el-form-item label="Bairro" class="user-form-item">
                <el-input v-model="formData.attributes['tarkan.bairro']"></el-input>
              </el-form-item>
            </div>
            <div class="address-row">
              <el-form-item :label="KT('user.cidade')" class="user-form-item">
                <el-input v-model="formData.attributes['tarkan.cidade']"></el-input>
              </el-form-item>
              <el-form-item :label="KT('user.estado')" class="user-form-item">
                <el-input v-model="formData.attributes['tarkan.estado']"></el-input>
              </el-form-item>
            </div>
          </div>
        </div>
      </el-tab-pane>




      
   


   
      <el-tab-pane  :name="'second'">
        <template #label>
        <i class="fas fa-car"></i> {{ KT('device.details') }}
      </template>

      <div class="form-row">
    <el-form-item label="Marca do Veículo" class="form-col-50">
        <el-select 
            v-model="selectedVehicleBrand" 
            filterable 
            placeholder="Selecione a marca" 
            style="width: 100%;" 
            @change="loadVehicleModels"
            :loading="loadingBrands">
            <el-option v-for="brand in vehicleBrands" :key="brand.codigo" :label="brand.nome" :value="brand.codigo"></el-option>
        </el-select>
    </el-form-item>

    <el-form-item :label="KT('device.model')" class="form-col-50">
        <el-select 
            v-model="formData.model" 
            filterable 
            placeholder="Selecione o modelo" 
            style="width: 100%;"
            :loading="loadingModels"
            :disabled="!selectedVehicleBrand">
            <el-option v-for="model in vehicleModels" :key="model.codigo" :label="model.nome" :value="model.nome"></el-option>
        </el-select>
    </el-form-item>
</div>

<div class="form-row">
    

    <el-form-item :label="KT('device.date')" class="form-col-70">
        <el-input v-model="formData.attributes['date']"></el-input>
    </el-form-item>

    <el-form-item :label="KT('device.vin')" class="form-col-70">
        <el-input v-model="formData.attributes['vin']"></el-input>
    </el-form-item>
    <el-form-item :label="KT('device.chassis')" class="form-col-70">
        <el-input v-model="formData.attributes['chassis']"></el-input>
    </el-form-item>

    <el-form-item :label="KT('device.plate')" class="form-col-70">
        <el-input v-model="formData.attributes['placa']"></el-input>
    </el-form-item>
</div>

<!-- Linha com consumo médio, preço de combustível e tanque -->
<div class="form-row">
    <el-form-item label="Consumo Médio (Opcional)" class="form-col-33">
        <el-input v-model.number="formData.attributes['litersx100km']" 
                  placeholder="Padrão: 10.0"
                  type="number"
                  step="0.1">
          <template #append>L/100km</template>
        </el-input>
        <div class="field-helper">
          Se vazio, usa 10 L/100km
        </div>
    </el-form-item>
    <el-form-item :label="KT('device.fuelPrice')" class="form-col-33">
        <el-input v-model.number="formData.attributes['fuelPrice']" 
                  placeholder="Ex: 6.50"
                  type="number"
                  step="0.01">
          <template #prepend>R$</template>
        </el-input>
    </el-form-item>
    <el-form-item :label="KT('device.tank')" class="form-col-33">
        <el-input v-model.number="formData.attributes['fuelTank']" 
                  placeholder="Ex: 50"
                  type="number"
                  step="1">
          <template #append>Litros</template>
        </el-input>
    </el-form-item>
</div>

<div class="form-row">
    <el-form-item :label="KT('device.odometer')" class="form-col-80">
        <div class="accumulator-input">
            <el-input 
                v-model.number="odometerData" 
                :disabled="!showOdometerEdit"
                :class="{ 'changed-input': odometerHasChanged }"
                placeholder="Quilometragem atual">
                <template #suffix v-if="odometerHasChanged && !showOdometerEdit">
                    <el-tooltip 
                        content="Mudança pendente"
                        placement="top"
                        effect="dark">
                        <i class="fas fa-exclamation-triangle changed-indicator"></i>
                    </el-tooltip>
                </template>
            </el-input>
            <el-tooltip 
                content="Editar KM"
                placement="top"
                effect="dark">
                <el-button 
                    @click="showOdometerEdit = !showOdometerEdit" 
                    circle
                    size="small"
                    :type="showOdometerEdit ? 'success' : (odometerHasChanged ? 'warning' : 'default')">
                    <i :class="showOdometerEdit ? 'fas fa-lock-open' : 'fas fa-lock'"></i>
                </el-button>
            </el-tooltip>
        </div>
    </el-form-item>
    
    <el-form-item :label="KT('device.hoursMovement')" class="form-col-60">
        <div class="accumulator-input">
            <el-input 
                v-model.number="hoursData" 
                :disabled="!showHoursEdit"
                :class="{ 'changed-input': hoursHasChanged }"
                placeholder="Horas de operação">
                <template #suffix v-if="hoursHasChanged && !showHoursEdit">
                    <el-tooltip 
                        content="Mudança pendente"
                        placement="top"
                        effect="dark">
                        <i class="fas fa-exclamation-triangle changed-indicator"></i>
                    </el-tooltip>
                </template>
            </el-input>
            <el-tooltip 
                content="Editar Hs"
                placement="top"
                effect="dark">
                <el-button 
                    @click="showHoursEdit = !showHoursEdit" 
                    circle
                    size="small"
                    :type="showHoursEdit ? 'success' : (hoursHasChanged ? 'warning' : 'default')">
                    <i :class="showHoursEdit ? 'fas fa-lock-open' : 'fas fa-lock'"></i>
                </el-button>
            </el-tooltip>
        </div>
    </el-form-item>
    
    <el-form-item label="Modo de Exibição" class="form-col-40">
        <el-select 
            v-model="formData.attributes['tarkan.displayMode']" 
            placeholder="Selecione"
            class="full-width-select">
            <el-option 
                label="KM" 
                value="odometer">
            </el-option>
            <el-option 
                label="Hs Motor" 
                value="hours">
            </el-option>
            <el-option 
                label="KM + Hs" 
                value="both">
            </el-option>
        </el-select>
    </el-form-item>
</div>

<!-- Seletor de categoria de veículo -->
<div style="margin-top: 30px;">
    <h3 style="margin-bottom: 15px; color: var(--el-text-color-primary); font-size: 16px; font-weight: 600;">
        Selecionar Veículo
    </h3>
    
    <!-- Abas para Ícones Padrão e V2 -->
    <el-tabs v-model="activeIconTab" type="card" class="icon-tabs">
        <!-- Aba Ícones Padrão -->
        <el-tab-pane label="Ícones Padrão" name="default">
            <div class="el-form-item">
                <div class="el-form-item__content icon-grid-container">
                    <dv-car v-for="(cc,ck) in availableCars" :key="ck" :img="cc.img"
                            :selected="formData.category === cc.key"
                            @click="formData.category = cc.key"
                            @mouseleave="hideTip" @mouseenter.stop="showTip($event,KT('map.devices.'+cc.key))"
                            :color1="cc.color1"
                            :color2="cc.color2"
                            :filter1="'hue-rotate('+hue+'deg) saturate('+(saturation/100).toFixed(2)+') brightness('+(brightnes/100).toFixed(2)+')'"
                            :filter2="'hue-rotate('+hue2+'deg) saturate('+(saturation2/100).toFixed(2)+') brightness('+(brightnes2/100).toFixed(2)+')'"></dv-car>
                </div>
            </div>
        </el-tab-pane>
        
        <!-- Aba Ícones V2 - 523 ícones com scroll -->
        <el-tab-pane name="v2">
            <template #label>
                <span>Ícones V2 <el-tag size="small" type="info">{{availableCarsV2.length}}</el-tag></span>
            </template>
            <div class="el-form-item">
                <div class="el-form-item__content icon-grid-container icon-grid-v2">
                    <dv-car v-for="(cc,ck) in availableCarsV2" :key="'v2-'+ck" :img="cc.img"
                            :selected="formData.category === cc.key"
                            @click="formData.category = cc.key"
                            @mouseleave="hideTip" @mouseenter.stop="showTip($event,cc.key)"
                            :color1="cc.color1"
                            :color2="cc.color2"
                            :is-v2="true"
                            :filter1="'hue-rotate('+hue+'deg) saturate('+(saturation/100).toFixed(2)+') brightness('+(brightnes/100).toFixed(2)+')'"
                            :filter2="'hue-rotate('+hue2+'deg) saturate('+(saturation2/100).toFixed(2)+') brightness('+(brightnes2/100).toFixed(2)+')'"></dv-car>
                </div>
            </div>
        </el-tab-pane>
    </el-tabs>
</div>


 







<!-- Seção de ícones movida mais abaixo -->

        
          <div class="color-customization">
            <div class="color-section">
          <label class="el-form-item__label color-label">
            {{KT('device.color1')}}
            <div class="color-switch">
              <el-switch v-model="useCustomColor1"  :active-text="KT('customize')"></el-switch>
            </div>
          </label>
          <div v-if="useCustomColor1" class="color-sliders">

            <div class="el-form-item slider-item">
              <label class="el-form-item__label slider-label">{{KT('device.hue')}}</label>
              <div class="el-form-item__content" >

                <el-slider v-model="hue" :max="360"></el-slider>
              </div>
            </div>


            <div class="el-form-item slider-item">
              <label class="el-form-item__label slider-label">{{KT('device.saturate')}}</label>
              <div class="el-form-item__content" >

                <el-slider v-model="saturation" :max="300"></el-slider>
              </div>
            </div>


            <div class="form-full">
              <label class="el-form-item__label slider-label">{{KT('device.brightness')}}</label>
              <div>
                <el-slider v-model="brightnes" :max="200"></el-slider>
              </div>
            </div>

          </div>
          <div v-else class="color-palette">
            <div v-for="(c,ck) in availableColors" :key="'color1'+ck" class="color-swatch" @click="setColor1(c);" :style="{'filter': 'hue-rotate('+c.hue+'deg) saturate('+(c.saturation)+') brightness('+(c.brightness)+')'}">
              <div class="color-box"></div>
            </div>
          </div>

            </div>
            <div style="flex: 1;margin-left: 30px;">
          <label class="el-form-item__label color-label">
            {{KT('device.color2')}}
            <div class="color-switch">
              <el-switch v-model="useCustomColor2"  :active-text="KT('customize')"></el-switch>
            </div>
          </label>
          <div v-if="useCustomColor2" class="color-sliders">

            <div class="el-form-item slider-item">
              <label class="el-form-item__label slider-label">{{KT('device.hue')}}</label>
              <div class="el-form-item__content" >

                <el-slider v-model="hue2" :max="360"></el-slider>
              </div>
            </div>


            <div class="el-form-item slider-item">
              <label class="el-form-item__label slider-label">{{KT('device.saturate')}}</label>
              <div class="el-form-item__content" >

                <el-slider v-model="saturation2" :max="300"></el-slider>
              </div>
            </div>


            <div class="form-full">
              <label class="el-form-item__label slider-label">{{KT('device.brightness')}}</label>
              <div>
                <el-slider v-model="brightnes2" :max="200"></el-slider>
              </div>
            </div>

          </div>
          <div v-else style="margin-top: 15px;display: flex;margin-bottom: 10px;flex-wrap: wrap;">
            <div v-for="(c,ck) in availableColors" :key="'color2'+ck" class="color-swatch" @click="setColor2(c);" :style="{'filter': 'hue-rotate('+c.hue+'deg) saturate('+(c.saturation)+') brightness('+(c.brightness)+')'}">
              <div class="color-box"></div>
            </div>
          </div>
            </div>
          </div>


        

      </el-tab-pane>
      
      <el-tab-pane :name="'attributes'">
                  <template #label>
                  <i class="fas fa-list"></i> {{ KT('attribute.attributes') }}
                </template>
                  <tab-attributes v-model="formData.attributes" :type="'device'"></tab-attributes>
      </el-tab-pane>

         <el-tab-pane  >
          <template #label>
                  <i class="fas fa-list"></i> {{ KT('instalations.install') }}
                </template>

                <el-form-item :label="KT('instalations.empresa')" :size="'small'">
          <el-input v-model="formData.attributes['instalation.empresa']"></el-input>

        </el-form-item>
        <el-form-item :label="KT('instalations.installer')" :size="'small'">
          <el-input v-model="formData.attributes['instalation.instalador']" ></el-input>
        </el-form-item>
        <el-form-item :label="KT('instalations.phone')" :size="'small'">
          <el-input v-model="formData.attributes['instalation.phone']" ></el-input>
        </el-form-item>
        <el-form-item :label="KT('instalations.email')" :size="'small'">
          <el-input v-model="formData.attributes['instalation.email']"></el-input>
        </el-form-item>
        <el-form-item :label="KT('instalations.data')" :size="'small'">
          <el-input v-model="formData.attributes['instalation.data']" 
            type="date"
            placeholder="aaaaaaaaa">
          </el-input>
        </el-form-item>

        <el-form-item :label="KT('instalations.observation')" :size="'small'" ></el-form-item>
        <el-input v-model="formData.attributes['instalation.observation']" :type="'textarea'"></el-input>
      

        </el-tab-pane>

        <!-- Nova aba para fotos de instalação e vistoria -->
        <el-tab-pane>
          <template #label>
            <i class="fas fa-camera"></i> Fotos de Instalação
          </template>

          <div class="photos-container">
            <!-- Seção: Fotos da Instalação do Rastreador -->
            <div class="photo-section">
              <h4 class="section-title">
                <i class="fas fa-map-marker-alt"></i> Fotos do Local de Instalação
              </h4>
              <p class="section-description">
                Adicione até 3 fotos mostrando onde o rastreador foi instalado no veículo (ex: debaixo do painel, porta-luvas, etc.)
              </p>

              <div class="upload-grid">
                <!-- Foto 1 -->
                <div class="upload-item">
                  <div class="upload-label">Foto 1</div>
                  <el-upload
                    class="photo-uploader"
                    :action="`/tarkan/device-photo-upload.php?deviceId=${formData.id}&type=installation&index=1`"
                    :show-file-list="false"
                    :on-success="(response) => handlePhotoSuccess(response, 'installation', 1)"
                    :before-upload="beforePhotoUpload"
                    accept="image/*"
                  >
                    <img v-if="installationPhotos[0]" :src="installationPhotos[0]" class="uploaded-image" />
                    <div v-else class="upload-placeholder">
                      <i class="fas fa-plus"></i>
                      <div class="upload-text">Adicionar Foto</div>
                    </div>
                  </el-upload>
                  <el-button 
                    v-if="installationPhotos[0]" 
                    type="danger" 
                    size="small" 
                    plain
                    @click="removePhoto('installation', 0)"
                    class="remove-photo-btn"
                  >
                    <i class="fas fa-trash"></i> Remover
                  </el-button>
                  <el-input
                    v-model="formData.attributes['installation.photo1.description']"
                    placeholder="Descrição da foto (opcional)"
                    size="small"
                    class="photo-description-input"
                  />
                </div>

                <!-- Foto 2 -->
                <div class="upload-item">
                  <div class="upload-label">Foto 2</div>
                  <el-upload
                    class="photo-uploader"
                    :action="`/tarkan/device-photo-upload.php?deviceId=${formData.id}&type=installation&index=2`"
                    :show-file-list="false"
                    :on-success="(response) => handlePhotoSuccess(response, 'installation', 2)"
                    :before-upload="beforePhotoUpload"
                    accept="image/*"
                  >
                    <img v-if="installationPhotos[1]" :src="installationPhotos[1]" class="uploaded-image" />
                    <div v-else class="upload-placeholder">
                      <i class="fas fa-plus"></i>
                      <div class="upload-text">Adicionar Foto</div>
                    </div>
                  </el-upload>
                  <el-button 
                    v-if="installationPhotos[1]" 
                    type="danger" 
                    size="small" 
                    plain
                    @click="removePhoto('installation', 1)"
                    class="remove-photo-btn"
                  >
                    <i class="fas fa-trash"></i> Remover
                  </el-button>
                  <el-input
                    v-model="formData.attributes['installation.photo2.description']"
                    placeholder="Descrição da foto (opcional)"
                    size="small"
                    class="photo-description-input"
                  />
                </div>

                <!-- Foto 3 -->
                <div class="upload-item">
                  <div class="upload-label">Foto 3</div>
                  <el-upload
                    class="photo-uploader"
                    :action="`/tarkan/device-photo-upload.php?deviceId=${formData.id}&type=installation&index=3`"
                    :show-file-list="false"
                    :on-success="(response) => handlePhotoSuccess(response, 'installation', 3)"
                    :before-upload="beforePhotoUpload"
                    accept="image/*"
                  >
                    <img v-if="installationPhotos[2]" :src="installationPhotos[2]" class="uploaded-image" />
                    <div v-else class="upload-placeholder">
                      <i class="fas fa-plus"></i>
                      <div class="upload-text">Adicionar Foto</div>
                    </div>
                  </el-upload>
                  <el-button 
                    v-if="installationPhotos[2]" 
                    type="danger" 
                    size="small" 
                    plain
                    @click="removePhoto('installation', 2)"
                    class="remove-photo-btn"
                  >
                    <i class="fas fa-trash"></i> Remover
                  </el-button>
                  <el-input
                    v-model="formData.attributes['installation.photo3.description']"
                    placeholder="Descrição da foto (opcional)"
                    size="small"
                    class="photo-description-input"
                  />
                </div>
              </div>
            </div>

            <el-divider />

            <!-- Seção: Fotos de Vistoria da Instalação -->
            <div class="photo-section">
              <h4 class="section-title">
                <i class="fas fa-clipboard-check"></i> Fotos de Vistoria da Instalação
              </h4>
              <p class="section-description">
                Adicione até 3 fotos da vistoria técnica realizada após a instalação (ex: testes, conexões, etc.)
              </p>

              <div class="upload-grid">
                <!-- Vistoria 1 -->
                <div class="upload-item">
                  <div class="upload-label">Vistoria 1</div>
                  <el-upload
                    class="photo-uploader"
                    :action="`/tarkan/device-photo-upload.php?deviceId=${formData.id}&type=inspection&index=1`"
                    :show-file-list="false"
                    :on-success="(response) => handlePhotoSuccess(response, 'inspection', 1)"
                    :before-upload="beforePhotoUpload"
                    accept="image/*"
                  >
                    <img v-if="inspectionPhotos[0]" :src="inspectionPhotos[0]" class="uploaded-image" />
                    <div v-else class="upload-placeholder">
                      <i class="fas fa-plus"></i>
                      <div class="upload-text">Adicionar Foto</div>
                    </div>
                  </el-upload>
                  <el-button 
                    v-if="inspectionPhotos[0]" 
                    type="danger" 
                    size="small" 
                    plain
                    @click="removePhoto('inspection', 0)"
                    class="remove-photo-btn"
                  >
                    <i class="fas fa-trash"></i> Remover
                  </el-button>
                  <el-input
                    v-model="formData.attributes['inspection.photo1.description']"
                    placeholder="Descrição da foto (opcional)"
                    size="small"
                    class="photo-description-input"
                  />
                </div>

                <!-- Vistoria 2 -->
                <div class="upload-item">
                  <div class="upload-label">Vistoria 2</div>
                  <el-upload
                    class="photo-uploader"
                    :action="`/tarkan/device-photo-upload.php?deviceId=${formData.id}&type=inspection&index=2`"
                    :show-file-list="false"
                    :on-success="(response) => handlePhotoSuccess(response, 'inspection', 2)"
                    :before-upload="beforePhotoUpload"
                    accept="image/*"
                  >
                    <img v-if="inspectionPhotos[1]" :src="inspectionPhotos[1]" class="uploaded-image" />
                    <div v-else class="upload-placeholder">
                      <i class="fas fa-plus"></i>
                      <div class="upload-text">Adicionar Foto</div>
                    </div>
                  </el-upload>
                  <el-button 
                    v-if="inspectionPhotos[1]" 
                    type="danger" 
                    size="small" 
                    plain
                    @click="removePhoto('inspection', 1)"
                    class="remove-photo-btn"
                  >
                    <i class="fas fa-trash"></i> Remover
                  </el-button>
                  <el-input
                    v-model="formData.attributes['inspection.photo2.description']"
                    placeholder="Descrição da foto (opcional)"
                    size="small"
                    class="photo-description-input"
                  />
                </div>

                <!-- Vistoria 3 -->
                <div class="upload-item">
                  <div class="upload-label">Vistoria 3</div>
                  <el-upload
                    class="photo-uploader"
                    :action="`/tarkan/device-photo-upload.php?deviceId=${formData.id}&type=inspection&index=3`"
                    :show-file-list="false"
                    :on-success="(response) => handlePhotoSuccess(response, 'inspection', 3)"
                    :before-upload="beforePhotoUpload"
                    accept="image/*"
                  >
                    <img v-if="inspectionPhotos[2]" :src="inspectionPhotos[2]" class="uploaded-image" />
                    <div v-else class="upload-placeholder">
                      <i class="fas fa-plus"></i>
                      <div class="upload-text">Adicionar Foto</div>
                    </div>
                  </el-upload>
                  <el-button 
                    v-if="inspectionPhotos[2]" 
                    type="danger" 
                    size="small" 
                    plain
                    @click="removePhoto('inspection', 2)"
                    class="remove-photo-btn"
                  >
                    <i class="fas fa-trash"></i> Remover
                  </el-button>
                  <el-input
                    v-model="formData.attributes['inspection.photo3.description']"
                    placeholder="Descrição da foto (opcional)"
                    size="small"
                    class="photo-description-input"
                  />
                </div>
              </div>
            </div>

            <el-alert
              v-if="!formData.id"
              title="Atenção"
              type="warning"
              :closable="false"
              show-icon
              style="margin-top: 20px;"
            >
              Salve o dispositivo primeiro para poder adicionar fotos.
            </el-alert>
          </div>
        </el-tab-pane>

        <!-- PR-10B: Speed Events Tab -->
        <el-tab-pane name="speed-events">
          <template #label>
            <i class="fas fa-tachometer-alt"></i> {{ KT('speedEvents.title') }}
          </template>

          <div v-if="formData.id" style="padding: 0;">
            <!-- SpeedEventHistory component with lazy loading -->
            <SpeedEventHistory 
              v-if="tab === 'speed-events'"
              :device-id="formData.id" 
              :driver-id="formData.attributes?.driverUniqueId || null"
            />
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
            <p>{{ KT('speedEvents.saveFirstMessage') }}</p>
          </div>
        </el-tab-pane>

        <el-tab-pane  >
        <template #label>
        <i class="fas fa-check"></i> {{ KT('device.observations') }}
      </template>


       


      <el-input v-model="formData.attributes['observation']" :type="'textarea'"></el-input>



        </el-tab-pane>

    </el-tabs>

    </el-form>
  </BaseModal>

  


</template>


  

<script setup>






import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/input-number/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/switch/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/tab-pane/style/css'
import 'element-plus/es/components/tabs/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/slider/style/css'
import 'element-plus/es/components/upload/style/css'
import 'element-plus/es/components/divider/style/css'
import 'element-plus/es/components/alert/style/css'
import 'element-plus/es/components/tag/style/css'
import {ElSlider,ElMessage,ElMessageBox,ElNotification,ElTabs,ElTabPane,ElForm,ElSwitch,ElFormItem,ElSelect,ElOption,ElButton,ElInput,ElInputNumber,ElUpload,ElDivider,ElAlert,ElTag} from "element-plus";

import { toKmh } from '../../../utils/speedNormalizer';
import { parseSpeedKmh, isProbablyWrongSpeedLimit } from '../../../utils/speedHelpers';

import BaseModal from '../ui/BaseModal.vue';
import TabAttributes from "./tab-attributes";
import SpeedEventHistory from '../../../components/speed/SpeedEventHistory.vue';

import {ref, reactive, watch, computed} from 'vue';
import {useStore} from 'vuex'
import DvCar from "./dv-car";
import KT from "../../func/kt";

const store = useStore();

//import {ElDialog, ElForm, ElFormItem, ElInput, ElMessage, ElMessageBox, ElNotification} from 'element-plus'




const show = ref(false);
const tab = ref('first');
const title = ref('');
const linkedUserId = ref(null);

const formRef = ref(null);
const odometerData = ref(0);
const hoursData = ref(0);
const originalOdometerData = ref(0);
const originalHoursData = ref(0);

// Computed para detectar mudanças
const odometerHasChanged = computed(() => {
  return parseFloat(odometerData.value) !== parseFloat(originalOdometerData.value);
});

const hoursHasChanged = computed(() => {
  return parseFloat(hoursData.value) !== parseFloat(originalHoursData.value);
});
const showOdometerEdit = ref(false);
const showHoursEdit = ref(false);
const selectedGpsBrand = ref('');
const availableGpsModels = ref([]);

// Refs para API FIPE (marcas e modelos de veículos)
const selectedVehicleBrand = ref('');
const vehicleBrands = ref([]);
const vehicleModels = ref([]);
const loadingBrands = ref(false);
const loadingModels = ref(false);

// Refs para fotos de instalação e vistoria
const installationPhotos = ref(['', '', '']);
const inspectionPhotos = ref(['', '', '']);

// Função para atualizar os modelos disponíveis segundo a marca selecionada
const updateGpsModels = (brand) => {
  if (brand && gpsModels[brand]) {
    availableGpsModels.value = gpsModels[brand];
  } else {
    availableGpsModels.value = defaultModels;
  }
};

// Função para carregar marcas de veículos da API FIPE
const loadVehicleBrands = async () => {
  try {
    loadingBrands.value = true;
    const response = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas');
    const data = await response.json();
    vehicleBrands.value = data;
  } catch (error) {
    console.error('Erro ao carregar marcas:', error);
    ElMessage.error('Erro ao carregar marcas de veículos');
  } finally {
    loadingBrands.value = false;
  }
};

// Função para carregar modelos de veículos da API FIPE baseado na marca
const loadVehicleModels = async (brandCode) => {
  if (!brandCode) {
    vehicleModels.value = [];
    formData.value.model = '';
    return;
  }
  
  try {
    loadingModels.value = true;
    const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandCode}/modelos`);
    const data = await response.json();
    vehicleModels.value = data.modelos || [];
    
    // Salvar a marca no attributes
    const selectedBrand = vehicleBrands.value.find(b => b.codigo === brandCode);
    if (selectedBrand) {
      formData.value.attributes['brand'] = selectedBrand.nome;
    }
  } catch (error) {
    console.error('Erro ao carregar modelos:', error);
    ElMessage.error('Erro ao carregar modelos de veículos');
  } finally {
    loadingModels.value = false;
  }
};

// Função para atualizar a marca nos atributos do dispositivo
const updateGpsBrand = (brand) => {
  if (brand) {
    formData.value.attributes['device.gpsBrand'] = brand;
    updateGpsModels(brand);
  } else {
    formData.value.attributes['device.gpsBrand'] = '';
    availableGpsModels.value = defaultModels;
  }
};

// Lista de protocolos disponíveis do traccar
const protocols = [
  "gps103", "gt06", "tk103", "gl100", "gl200", "t55", "xexun", "totem", "enfora", "meiligao", "trv", 
  "suntech", "progress", "h02", "jt600", "huabao", "v680", "pt502", "tr20", "navis", "meitrack", 
  "skypatrol", "gt02", "gt09", "megastek", "navigil", "gpsgate", "teltonika", "mta6", "mta6can", 
  "tlt2h", "syrus", "wondex", "cellocator", "galileo", "ywt", "tk102", "intellitrac", "gpsmta", 
  "wialon", "carscop", "apel", "manpower", "globalsat", "atrack", "pt3000", "ruptela", "topflytech", 
  "laipac", "aplicom", "gotop", "sanav", "gator", "noran", "m2m", "osmand", "easytrack", "gpsmarker", 
  "khd", "piligrim", "stl060", "cartrack", "minifinder", "hiren", "dl2000", "boxcar", "freedom", 
  "telic", "trackbox", "visiontek", "orion", "riti", "ulbotech", "tramigo", "tr900", "ardi01", 
  "xt013", "autofon", "gosafe", "autofon45", "bce", "xirgo", "calamp", "mtx", "tytan", "avl301", 
  "castel", "mxt", "cityeasy", "aquila", "flextrack", "blackkite", "adm", "smartsole", "t800x", 
  "upro", "auro", "disha", "thinkrace", "pathaway", "arnavi", "nvs", "kenji", "astra", "homtecs", 
  "fox", "gnx", "arknav", "supermate", "appello", "idpl", "huasheng", "l100", "granit", "carcell", 
  "obddongle", "hunterpro", "idpl", "jt600", "v680", "pt502", "tr20", "navis", "meitrack", "skypatrol"
];

// Marcas de GPS mais utilizadas no Brasil e outros países
const gpsBrands = [
  "Coban", "Concox", "Queclink", "Sinotrack", "Eelink", "Teltonika", "Meitrack", "Gosafe", 
  "JiMi/Concox", "TK Star", "GT06", "Aotego", "Jointech", "Suntech", "GlobaSat", "Aika", 
  "Orion", "Neoway", "Aplicom", "Sanav", "Calamp", "TotemTrack", "Ruptela", "ZKTeco",
  "Outro/Other"
];

// Modelos por marca (estrutura aninhada)
const gpsModels = {
  "Coban": ["TK102", "TK103", "GPS303", "TK303", "TK303F", "TK303G", "TK305", "TK306", "TK307", "TK310", "TK315", "TK319", "GPS306", "GPS307"],
  
  "Concox": ["GT06", "GT06N", "GT06E", "GT08", "GT08E", "X1", "X3", "AT4", "AT6", "JM-VL01", "TR02", "TR06", "GV25", "GV55", "GV55 Lite", "GV75", "GV300", "GV300W", "GT02", "GT02A", "GT02D", "GT09", "GT300", "GT800", "GT820", "ET100", "ET200", "GS503", "GS550", "GS550W", "GS850", "GS900"],
  
  "Queclink": ["GV55", "GV55 Lite", "GV75", "GV300", "GV300W", "GV350", "GV600", "GV300M", "GL50", "GL50MG", "GL100", "GL100M", "GL200", "GL300", "GL300W", "GL500", "GL505", "GL505M", "GV20", "GV25", "GV500", "GV500MA", "GV200", "GL50B", "GL50LC", "GL300M", "GL300MG", "GV30W", "GV55MA", "GV65", "GV65Plus"],
  
  "Sinotrack": ["ST-901", "ST-902", "ST-906", "ST-907", "ST-909", "ST-910", "ST-915", "ST-818", "ST-919", "ST-919G", "ST-901A", "ST-902A", "ST-905", "ST-908", "ST-920", "ST-922", "ST-930", "ST-935", "ST-940"],
  
  "Eelink": ["TK115", "TK116", "TK116 Pro", "TK119", "TK119-H", "TK116 3G", "TK116 4G", "M588N", "M588T", "TK117", "TK118", "TK119-L", "TK120", "TK121", "TK210", "TK220", "TK319", "TK369", "TK419", "M558", "M588S", "M588G"],
  
  "Teltonika": ["FMB001", "FMB002", "FMB003", "FMB010", "FMB110", "FMB120", "FMB122", "FMB125", "FMB130", "FMB140", "FMB204", "FMB208", "FMM001", "FMC001", "FMM125", "FMP100", "FMB920", "FMB921", "FMB640", "FMB630", "FMB150", "FMB202", "FMB900", "FMB910", "FMU125", "FMU126", "FMA120", "FMA130", "TMT250", "GH5200", "TAT100"],
  
  "Meitrack": ["T311", "T333", "T355", "T366", "T366G", "T622G", "MVT100", "MVT340", "MVT380", "MVT600", "MVT800", "T311U", "T322", "T333G", "T344", "T388", "T633L", "MVT340G", "MVT380G", "MVT400", "MVT500", "MVT700", "P88L", "P99G", "T1", "T3"],
  
  "Gosafe": ["G1", "G6", "G737", "G787", "G797", "G7A", "G7B", "G79", "G79W", "G79W+", "G3", "G6S", "G717", "G7C", "G7D", "G79B", "G200", "G70", "G737L", "G70S", "G808", "G828"],
  
  "JiMi/Concox": ["GT06", "GT06N", "JM01", "JM-VL01", "JM-LL01", "JM-VL02", "JM-LL02", "HVT001", "HVT002", "JM02", "JM-VL03", "JM-LL03", "JM-VL04", "JM-LL04", "JM-TL01", "JM-TL02", "JM-TL03", "HVT003", "HVT004"],
  
  "TK Star": ["TK905", "TK906", "TK909", "TK911", "TK915", "TK919", "TK925", "TK218", "TK913", "TK928", "TK935", "TK102B", "TK103B", "TK105", "TK116", "TK800", "TK816", "TK916", "TK918", "TK1000"],
  
  "GT06": ["J16", "J16 iButton", "GT06", "GT06N", "GT06E", "GT09", "GT02", "GT02A", "GT02D", "GT100", "GT170", "GT500", "GT800", "GT900", "GT03A", "GT03B", "GT03C", "GT03D"],
  
  "Aotego": ["AT1", "AT2", "AT4", "AT06", "AT07", "AT09", "AT05", "AT08", "AT10", "AT11", "AT12", "AT15", "AT20", "AT30", "AT100", "AT200"],
  
  "Jointech": ["GP4000", "GP6000", "GP8000", "GP9000", "VT900", "VT1000", "GP2000", "GP3000", "GP5000", "GP7000", "GP10000", "VT300", "VT600", "VT800", "VT1100", "GT200"],
  
  "Suntech": ["ST200", "ST300", "ST340", "ST600", "ST600R", "ST650", "ST900", "ST940", "ST800", "ST850", "ST910", "ST930", "ST1100", "ST4100", "ST4300", "ST4340", "ST5100", "ST7100"],
  
  "GlobaSat": ["TR-151", "TR-203", "TR-206", "TR-207", "TR-600", "GTR-128", "GTR-129", "GTR-388", "TR-102", "TR-202", "TR-208", "TR-306", "TR-606", "GTR-100", "GTR-209", "GTR-359", "GTR-399", "TT8850"],
  
  "Aika": ["A1", "A2", "A3", "A5", "A6", "A8", "A9", "A4", "A7", "A10", "A11", "A12", "A15", "A20", "A30", "A100"],
  
  "Orion": ["Orion 2.0", "OL-3000", "OL-4000", "OL-5000", "OL-6000", "Orion 1.0", "Orion 3.0", "OL-1000", "OL-2000", "OL-7000", "OL-8000", "OL-9000", "OL-10000"],
  
  "Neoway": ["N200", "N300", "N400", "M590", "M590E", "L300", "N100", "N500", "N600", "M680", "M590G", "L500", "L600", "M100", "M110", "M680C"],
  
  "Aplicom": ["A1", "A9", "A10", "A11", "A12", "C10", "A5", "A7", "A8", "A13", "A15", "C5", "C8", "C12", "C15", "T10", "T15"],
  
  "Sanav": ["GC-101", "CT-24", "ML-10", "ST-4710", "FT-5000", "CT-24G", "CT-28", "GC-201", "GC-301", "ML-20", "ST-5500", "FT-3000", "FT-4000", "FT-6000"],
  
  "Calamp": ["LMU-200", "LMU-300", "LMU-400", "LMU-500", "LMU-700", "LMU-800", "LMU-900", "LMU-1100", "LMU-2600", "LMU-2700", "LMU-3000", "LMU-3030", "LMU-4200", "LMU-4230", "LMU-1200", "LMU-1300", "LMU-2000", "LMU-2100", "LMU-2500", "LMU-5000", "LMU-5530", "TTU-700", "TTU-1200", "TTU-2830"],
  
  "TotemTrack": ["TT12", "TT15", "TT18", "TT100", "TT120", "TT300", "TT360", "TT20", "TT25", "TT30", "TT200", "TT250", "TT400", "TT500", "TT600"],
  
  "Ruptela": ["FM-Pro3", "FM-Pro4", "FM-Tco4 HCV", "FM-Eco4", "FM-Eco4 S", "FM-Eco4 T", "FM-Eco4 Light", "FM-Eco4 Light+", "FM-Pro5", "FM-Tco5", "FM-Tco5 HCV", "FM-Eco5", "FM-Eco6", "FM-Pro6", "FM-Tco6", "FM-Tco6 HCV", "FM-Pro3G", "FM-Eco6 S"],
  
  "ZKTeco": ["VT1000", "VT200", "VT300", "VT900", "VT100", "VT400", "VT500", "VT600", "VT700", "VT800", "VT1200", "VT1500", "VT2000"],
  
  "Tramigo": ["T22", "T23", "M1", "M1 Move", "M1 Fleet", "M1 Sky", "T10", "T20", "T24", "M7", "M5", "PHOX"],
  
  "Skypatrol": ["TT8750", "TT8750 Plus", "TT9200", "TT8850", "TT8860", "TT9400", "TT9500", "TT9800", "SP7600", "SP8100"],
  
  "Xenun": ["TK10GSM", "TK20GSM", "TK30GSM", "TK510", "TK510 Plus", "TK1000", "SL48", "SL44", "EC33", "TG100", "TG200", "TG300"],
  
  "TopFlyTech": ["T8803", "T8803 Plus", "T8801", "T8806", "T8808", "T1000", "T5000", "T8800", "T8804", "T8805", "T8810", "T8900"],
  
  "Enfora": ["MT-GL", "MT-3000", "MT-4000", "GSM2338", "GSM2358", "GSM2418", "Spider AT", "Spider MT", "Spider PT", "Mini MT"],
  
  "Benway": ["BW08", "BW09", "BW10", "BW20", "GT06", "GT06E", "GT100", "GT300", "GS102", "GS103"],
  
  "Navixy": ["A1", "A5", "A7", "M1", "M3", "M5", "M7", "S1", "S3", "S5", "S7", "X1", "X3", "X5", "X7"],
  
  "ATrack": ["AX5", "AX7", "AX9", "AX11", "AX7 Plus", "AL1", "AL5", "AK1", "AK3", "AK11", "AU7", "AT1", "AT5", "AT5i"],
  
  "Xexun": ["TK102", "TK103", "TK201", "TK202", "TK203", "TK208", "TK208-2", "TK209", "TK210", "TK510", "TK510-2", "XT008", "XT009", "XT107", "XT107-2"],
  
  "Falcom": ["FOX3-2G", "FOX3-3G", "FOX3-4G", "STEPP III", "BOLERO", "MAMBO", "SAMBA", "JAZZ", "ORCA", "FOX2", "FOX4", "FOX5"],
  
  "Wonde Proud": ["TK510", "TK510-2", "TK510-3", "TK510-3G", "TK510-L", "WP-360", "WP-810", "WP-900", "WP-900G", "WP-3500"],
  
  "Topten": ["GT02A", "GT02", "GT06", "GT06E", "GT06N", "GT100", "GT100X", "GT1000", "GT300", "GT300X", "GT500", "GT900"],
  
  "Outro/Other": []
};

// Modelos predeterminados para mostrar quando nenhuma marca foi selecionada
const defaultModels = [];

const rules = reactive({
  name: [
    {
      required: true,
      message: KT('device.form.nameEmpty'),
      trigger: 'blur',
    }
  ],
  uniqueId: [
    {
      required: true,
      message: KT('device.form.uniqueIdEmpty'),
      trigger: 'blur',
    }
  ],
  });

const showTip = (evt,text)=>{
  window.$showTip(evt,text);
}

const hideTip = (evt,text)=>{
  window.$hideTip(evt,text);
}


const hue = ref(0);
const saturation = ref(100);
const brightnes = ref( 100);

const hue2 = ref(0);
const saturation2 = ref(100);
const brightnes2 = ref( 100);

const useCustomColor1 = ref(false);
const useCustomColor2 = ref(false);

const availableColors = ref([
  {hue: 13,saturation: 0,brightness: 0.3},
  {hue: 13,saturation: 0,brightness: 0.6},
  {hue: 13,saturation: 0,brightness: 1.8},

  {hue: 13,saturation: 1,brightness: 1},
  {hue: 13,saturation: 2,brightness: 1},
  {hue: 13,saturation: 2,brightness: 0.6},
  {hue: 155,saturation: 1,brightness: 1},
  {hue: 155,saturation: 2,brightness: 1},
  {hue: 155,saturation: 2,brightness: 0.6},
  {hue: -14,saturation: 1,brightness: 1},
  {hue: -14,saturation: 2,brightness: 1},
  {hue: -14,saturation: 2,brightness: 0.6},

  {hue: -95,saturation: 1,brightness: 1},
  {hue: -95,saturation: 2,brightness: 1},
  {hue: -95,saturation: 2,brightness: 0.6},


  {hue: -165,saturation: 1,brightness: 1},
  {hue: -165,saturation: 2,brightness: 1},
  {hue: -165,saturation: 2,brightness: 0.6},


  {hue: 43,saturation: 1,brightness: 1},
  {hue: 43,saturation: 2,brightness: 1},
  {hue: 43,saturation: 2,brightness: 0.6},


  {hue: 105,saturation: 1,brightness: 1},
  {hue: 105,saturation: 2,brightness: 1},
  {hue: 105,saturation: 2,brightness: 0.6},
]);


const setColor1 = (c)=>{
  hue.value = c.hue;
  saturation.value = c.saturation * 100;
  brightnes.value = c.brightness * 100;
}

const setColor2 = (c)=>{
  hue2.value = c.hue;
  saturation2.value = c.saturation * 100;
  brightnes2.value = c.brightness * 100;
}

// Default device data structure
const defaultDeviceData = {
  id: 0,
  name: '',
  uniqueId: '',
  status: '',
  disabled: false,
  lastUpdate: null,
  positionId: 0,
  groupId: 0,
  phone: '',
  model: '',
  contact: '',
  category: 'default',
  attributes: {}
};

// eslint-disable-next-line no-undef
const formData = ref(defaultDeviceData);

// Controle de aba de ícones (padrão ou v2)
const activeIconTab = ref('default');

const availableCars = ref([
  {key: 'default',img: 'default',color1: true,color2: false},
  {key: 'arrow',img: 'arrow',color1: true,color2: false},
  {key: 'animal',img: 'pet',color1: true,color2: false},
  {key: 'person',img: 'person',color1: true,color2: false},
  {key: 'bicycle',img: 'bicycle',color1: true,color2: false},
  {key: 'motorcycle',img: 'motorcycle',color1: true,color2: false},
  {key: 'scooter',img: 'scooter',color1: true,color2: false},
  {key: 'car',img:'carroPasseio',color1: true,color2: false},
  {key: 'pickup',img:'carroUtilitario',color1: true,color2: false},
  {key: 'van',img: 'vanUtilitario',color1: true,color2: false},
  {key: 'truck',img: 'caminhaoBau',color1: true,color2: true},
  {key: 'truck1',img: 'truckCavalo',color1: true,color2: false},
  {key: 'truck2',img: 'truckBau',color1: true,color2: true},
  {key: 'bus',img: 'bus',color1: true,color2: false},
  {key: 'crane',img: 'crane',color1: true,color2: false},


  {key: 'offroad',img: 'offroad',color1: true,color2: false},
  {key: 'tractor',img: 'tractor',color1: true,color2: false},

  {key: 'plane',img: 'plane',color1: true,color2: false},
  {key: 'helicopter',img: 'helicopter',color1: true,color2: false},
  {key: 'boat',img: 'boat',color1: true,color2: false},
  {key: 'ship',img: 'ship',color1: true,color2: false},
]);

// Gerar dinamicamente 523 ícones V2
const availableCarsV2 = ref(
  Array.from({ length: 523 }, (_, i) => ({
    key: `v2_icon${i + 1}`,
    img: `v2_icon${i + 1}`,
    color1: false,
    color2: false
  }))
);




const getColorsFromAttribute = ()=>{
  const attrColor = formData.value.attributes['tarkan.color'];
  const attrColorExtra = formData.value.attributes['tarkan.color_extra'];

  if(attrColor){


    const tmp = formData.value.attributes['tarkan.color'].split("|");

    hue.value = parseInt((tmp[0])?tmp[0]:0);
    saturation.value = parseInt((tmp[1])?(tmp[1]*100):100);
    brightnes.value = parseInt((tmp[2])?(tmp[2]*100):100);
  }else{
    hue.value = 0;
    saturation.value = 0;
    brightnes.value = 180;
  }


  if(attrColorExtra){

    const tmp = formData.value.attributes['tarkan.color_extra'].split("|");


    hue2.value = parseInt((tmp[0])?tmp[0]:0);
    saturation2.value = parseInt((tmp[1])?(tmp[1]*100):100);
    brightnes2.value = parseInt((tmp[2])?(tmp[2]*100):100);
  }else{
    hue2.value = 0;
    saturation2.value = 0;
    brightnes2.value = 180;
  }


}

// PR-09C: Computed para status e warnings de speedLimit
const speedLimitStatus = computed(() => {
  const value = formData.value.attributes?.speedLimitKmh;
  const check = isProbablyWrongSpeedLimit(value);
  
  return {
    hasLimit: value > 0,
    warnings: {
      low: check.low,  // < 20 km/h
      high: check.high  // > 180 km/h
    }
  };
});

// PR-09C: Handler de blur para sanitização do input
const handleSpeedLimitBlur = () => {
  if (formData.value.attributes?.speedLimitKmh !== undefined) {
    formData.value.attributes.speedLimitKmh = parseSpeedKmh(formData.value.attributes.speedLimitKmh);
  }
};


const newDevice = ()=>{

  tab.value = 'first';
  title.value = KT('device.add');
  // eslint-disable-next-line no-undef
    formData.value = JSON.parse(JSON.stringify(defaultDeviceData));
    
    // Garantir que attributes existe e inicializar valores padrão
    formData.value.attributes = {};
    formData.value.attributes['tarkan.displayMode'] = 'odometer';
    formData.value.attributes['situacao'] = 'ativo';
    
    // Reiniciar seletores de marca e modelo GPS
    selectedGpsBrand.value = '';
    availableGpsModels.value = defaultModels;
    
    // Reiniciar seletores de marca e modelo de veículo
    selectedVehicleBrand.value = '';
    vehicleModels.value = [];
    
    // Carregar marcas de veículos da API FIPE
    loadVehicleBrands();
    
    show.value = true;
    odometerData.value = 0;
    hoursData.value = 0;
    originalOdometerData.value = 0;
    originalHoursData.value = 0;
    showOdometerEdit.value = false;
    showHoursEdit.value = false;

}

const editDevice = (id)=>{

  tab.value = 'first';
  title.value = KT('device.edit');
  // eslint-disable-next-line no-undef
  formData.value = JSON.parse(JSON.stringify(defaultDeviceData));

  //const device = store.getters["devices/getDevice"](id);
  const device = store.getters['devices/getDevice'](id);

  // eslint-disable-next-line no-undef
  for(let k of Object.keys(defaultDeviceData)){
    if(k==='attributes') {
      formData.value[k] = (device[k] === null) ? {} : JSON.parse(JSON.stringify(device[k]));
      
      // PR-09B: Normalização de speedLimit para km/h
      // Compatibilidade: converter legado se necessário
      const serverUnit = store.getters['server/getAttribute']('speedUnit','kmh');
      
      if (!formData.value.attributes.speedLimitKmh && formData.value.attributes.speedLimit) {
        // Converter speedLimit legado para speedLimitKmh (sempre em km/h)
        formData.value.attributes.speedLimitKmh = toKmh(
          Number(formData.value.attributes.speedLimit), 
          serverUnit
        );
      }
      
      // Garantir que speedLimitKmh é number ou undefined
      if (formData.value.attributes.speedLimitKmh) {
        formData.value.attributes.speedLimitKmh = Number(formData.value.attributes.speedLimitKmh);
      }
      
    }else {
      formData.value[k] = (device[k] === null) ? null : device[k];
    }
  }
  
  // Garantir que attributes existe
  formData.value.attributes ??= {};
  
  // TAREFA 2: Sincronização bidirecional de phone (Traccar compatibility)
  // Se phone do device existe mas attributes['phone'] está vazio, copiar
  if (formData.value.phone && !formData.value.attributes['phone']) {
    formData.value.attributes['phone'] = formData.value.phone;
  }
  // Se attributes['phone'] existe mas formData.phone está vazio, copiar
  if (formData.value.attributes['phone'] && !formData.value.phone) {
    formData.value.phone = formData.value.attributes['phone'];
  }
  
  // FALLBACK: Compatibilidade com dados legados de instalação
  // Ler chaves antigas se as novas estiverem vazias
  const a = formData.value.attributes;
  a['instalation.empresa']     ||= a['empresainstalacao'] || '';
  a['instalation.instalador']  ||= a['instalador'] || '';
  a['instalation.phone']       ||= a['telefoneinstalador'] || '';
  a['instalation.email']       ||= a['emailinstalador'] || '';
  a['instalation.data']        ||= a['dataDatainstalacao'] || '';
  a['instalation.observation'] ||= a['observacao'] || '';

  // Carregar marca e modelo do GPS se existirem
  selectedGpsBrand.value = formData.value.attributes['device.gpsBrand'] || '';
  
  // Atualizar a lista de modelos disponíveis baseados na marca
  if (selectedGpsBrand.value && gpsModels[selectedGpsBrand.value]) {
    updateGpsModels(selectedGpsBrand.value);
  } else {
    availableGpsModels.value = defaultModels;
  }

  getColorsFromAttribute();
  const pos = store.getters["devices/getPosition"](device.id);

  odometerData.value = (pos) ? Math.round(pos.attributes['totalDistance']/1000) : 0;
  // Converter milissegundos para horas
  hoursData.value = (pos && pos.attributes['hours']) ? Math.round(pos.attributes['hours']/1000/3600) : 0;
  // Salvar valores originais para detectar mudanças
  originalOdometerData.value = odometerData.value;
  originalHoursData.value = hoursData.value;
  showOdometerEdit.value = false;
  showHoursEdit.value = false;
  
  // Carregar usuário vinculado dos atributos
  linkedUserId.value = formData.value.attributes['linkedUserId'] || null;
  
  // Carregar marcas de veículos da API FIPE
  loadVehicleBrands().then(() => {
    // Tentar encontrar a marca selecionada pelo nome
    if (formData.value.attributes['brand']) {
      const brandMatch = vehicleBrands.value.find(b => 
        b.nome.toLowerCase() === formData.value.attributes['brand'].toLowerCase()
      );
      if (brandMatch) {
        selectedVehicleBrand.value = brandMatch.codigo;
        loadVehicleModels(brandMatch.codigo);
      }
    }
  });

  // Carregar fotos de instalação e vistoria
  loadPhotos();

  show.value = true;
}

defineExpose({
  newDevice,
  editDevice
});


const doCancel = ()=>{
  show.value = false;
}

// Função para vincular/desvincular usuário ao dispositivo
const handleUserLink = async (userId) => {
  if (!formData.value.id) {
    ElMessage.warning('Salve o dispositivo antes de vincular um usuário.');
    linkedUserId.value = null;
    return;
  }

  // Salvar o userId vinculado nos atributos do dispositivo
  formData.value.attributes['linkedUserId'] = userId;
  
  if (userId) {
    ElMessage.success('Usuário selecionado! Clique em "Salvar" para confirmar o vínculo.');
  } else {
    ElMessage.info('Vínculo removido. Clique em "Salvar" para confirmar.');
  }
};

// Observar mudanças em selectedGpsBrand para atualizar modelos disponíveis
watch(selectedGpsBrand, (newBrand) => {
  if (newBrand) {
    updateGpsModels(newBrand);
    // Salvar o valor nos atributos do dispositivo
    formData.value.attributes['device.gpsBrand'] = newBrand;
  } else {
    availableGpsModels.value = defaultModels;
    formData.value.attributes['device.gpsBrand'] = '';
  }
});

// ============================================
// FUNÇÕES DE MANIPULAÇÃO DE FOTOS
// ============================================

// Carregar fotos existentes dos atributos
const loadPhotos = () => {
  // Fotos de instalação
  for (let i = 1; i <= 3; i++) {
    const photoUrl = formData.value.attributes[`installation.photo${i}`];
    if (photoUrl) {
      installationPhotos.value[i - 1] = photoUrl;
    }
  }
  
  // Fotos de vistoria
  for (let i = 1; i <= 3; i++) {
    const photoUrl = formData.value.attributes[`inspection.photo${i}`];
    if (photoUrl) {
      inspectionPhotos.value[i - 1] = photoUrl;
    }
  }
};

// Validação antes do upload
const beforePhotoUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error('Apenas arquivos de imagem são permitidos!');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('A imagem deve ter menos de 5MB!');
    return false;
  }
  
  if (!formData.value.id) {
    ElMessage.warning('Salve o dispositivo antes de adicionar fotos.');
    return false;
  }
  
  return true;
};

// Callback de sucesso no upload
const handlePhotoSuccess = (response, type, index) => {
  if (response && response.url) {
    const arrayIndex = index - 1;
    
    if (type === 'installation') {
      installationPhotos.value[arrayIndex] = response.url;
      formData.value.attributes[`installation.photo${index}`] = response.url;
    } else if (type === 'inspection') {
      inspectionPhotos.value[arrayIndex] = response.url;
      formData.value.attributes[`inspection.photo${index}`] = response.url;
    }
    
    ElMessage.success('Foto enviada com sucesso!');
  } else {
    ElMessage.error('Erro ao enviar foto. Tente novamente.');
  }
};

// Remover foto
const removePhoto = (type, index) => {
  ElMessageBox.confirm(
    'Tem certeza que deseja remover esta foto?',
    'Confirmar Remoção',
    {
      confirmButtonText: 'Remover',
      cancelButtonText: 'Cancelar',
      type: 'warning',
    }
  ).then(() => {
    const photoIndex = index + 1;
    
    if (type === 'installation') {
      installationPhotos.value[index] = '';
      delete formData.value.attributes[`installation.photo${photoIndex}`];
      delete formData.value.attributes[`installation.photo${photoIndex}.description`];
    } else if (type === 'inspection') {
      inspectionPhotos.value[index] = '';
      delete formData.value.attributes[`inspection.photo${photoIndex}`];
      delete formData.value.attributes[`inspection.photo${photoIndex}.description`];
    }
    
    ElMessage.success('Foto removida com sucesso!');
  }).catch(() => {
    // Cancelou a remoção
  });
};

const doSave = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      // Garantir que attributes existe
      formData.value.attributes ??= {};
      
      // TAREFA 3: Defaults consistentes
      if (!formData.value.attributes['situacao']) {
        formData.value.attributes['situacao'] = 'ativo';
      }
      if (!formData.value.attributes['tarkan.displayMode']) {
        formData.value.attributes['tarkan.displayMode'] = 'odometer';
      }
      
      // TAREFA 2: Sincronização bidirecional de phone (Traccar compatibility)
      // Copiar de attributes para formData (backend Traccar)
      if (formData.value.attributes['phone']) {
        formData.value.phone = formData.value.attributes['phone'];
      }
      // Copiar de formData para attributes (UI)
      if (formData.value.phone && !formData.value.attributes['phone']) {
        formData.value.attributes['phone'] = formData.value.phone;
      }
      
      // ESPELHAMENTO: Manter compatibilidade bidirecional com dados legados de instalação
      const a = formData.value.attributes;
      a['empresainstalacao']   = a['instalation.empresa']     || a['empresainstalacao'] || '';
      a['instalador']          = a['instalation.instalador']  || a['instalador'] || '';
      a['telefoneinstalador']  = a['instalation.phone']       || a['telefoneinstalador'] || '';
      a['emailinstalador']     = a['instalation.email']       || a['emailinstalador'] || '';
      a['dataDatainstalacao']  = a['instalation.data']        || a['dataDatainstalacao'] || '';
      a['observacao']          = a['instalation.observation'] || a['observacao'] || '';
      
      // Asignação de atributos de cor
      formData.value.attributes['tarkan.color'] = hue.value + '|' + (saturation.value / 100).toFixed(2) + '|' + (brightnes.value / 100).toFixed(2);
      formData.value.attributes['tarkan.color_extra'] = hue2.value + '|' + (saturation2.value / 100).toFixed(2) + '|' + (brightnes2.value / 100).toFixed(2);
      
      // IMPORTANTE: Garantir que fuelPrice, fuelTank e litersx100km sejam números (apenas se preenchidos)
      if (formData.value.attributes['fuelPrice'] && formData.value.attributes['fuelPrice'] !== '') {
        formData.value.attributes['fuelPrice'] = parseFloat(formData.value.attributes['fuelPrice']);
      } else {
        delete formData.value.attributes['fuelPrice'];
      }
      
      if (formData.value.attributes['fuelTank'] && formData.value.attributes['fuelTank'] !== '') {
        formData.value.attributes['fuelTank'] = parseFloat(formData.value.attributes['fuelTank']);
      } else {
        delete formData.value.attributes['fuelTank'];
      }
      
      if (formData.value.attributes['litersx100km'] && formData.value.attributes['litersx100km'] !== '') {
        formData.value.attributes['litersx100km'] = parseFloat(formData.value.attributes['litersx100km']);
      } else {
        delete formData.value.attributes['litersx100km'];
      }

      // PR-09B: Salvar velocidade de notificação (sempre em km/h)
      if (formData.value.attributes.speedLimitKmh !== undefined && 
          formData.value.attributes.speedLimitKmh !== null && 
          formData.value.attributes.speedLimitKmh !== '') {
        const v = Number(formData.value.attributes.speedLimitKmh);
        // Salvar em speedLimitKmh (novo padrão) e speedLimit (compatibilidade)
        formData.value.attributes.speedLimitKmh = v;
        formData.value.attributes.speedLimit = v;
      } else {
        // Se vazio/0, remover para não poluir attributes
        delete formData.value.attributes.speedLimitKmh;
        delete formData.value.attributes.speedLimit;
      }

      // Notificação de salvamento
      ElNotification({
        title: KT('info'),
        message: KT('device.saving'),
        type: 'info',
      });

      formData.value.uniqueId = formData.value.uniqueId.trim();

      // Salvar o dispositivo
      store.dispatch("devices/save", formData.value).then(async (d) => {
        // Salvar odômetro e horas se mudaram
        const accumulatorData = {};
        const odometerChanged = parseFloat(odometerData.value) !== parseFloat(originalOdometerData.value);
        const hoursChanged = parseFloat(hoursData.value) !== parseFloat(originalHoursData.value);
        
        if (odometerChanged) {
          accumulatorData.totalDistance = parseFloat(odometerData.value) * 1000; // Converter KM para metros
        }
        if (hoursChanged) {
          accumulatorData.hours = parseFloat(hoursData.value) * 3600 * 1000; // Converter horas para milissegundos
        }
        
        if (Object.keys(accumulatorData).length > 0) {
          accumulatorData.deviceId = d.id;
          // Esperar até que os acumuladores sejam atualizados
          await store.dispatch("devices/accumulators", accumulatorData);
          // Atualizar valores originais com os novos valores salvos
          originalOdometerData.value = odometerData.value;
          originalHoursData.value = hoursData.value;
          // Resetar as flags de edição
          showOdometerEdit.value = false;
          showHoursEdit.value = false;
          // Opcional: Recarregar posições para garantir sincronização
          store.dispatch("devices/positions");
        }

        // Notificação de sucesso
        ElNotification({
          title: KT('success'),
          message: KT('device.saved'),
          type: 'success',
        });

        show.value = false;
      }).catch((r) => {
        // Tratamento de erro mais robusto
        let errorMessage = 'UNKNOWN_ERROR';
        
        if (r.response && r.response.data) {
          const errorData = typeof r.response.data === 'string' ? r.response.data : JSON.stringify(r.response.data);
          
          // Verificar se é erro de IMEI duplicado
          if (errorData.includes('unique') || errorData.includes('Unique') || errorData.includes('duplicate')) {
            errorMessage = 'IMEI_DUPLICATED';
          } else {
            const err = errorData.split("-")[0].trim().replaceAll(" ", "_").toUpperCase();
            errorMessage = err;
          }
        }

        // Mostrar error si la operación falla
        ElMessageBox.alert(
          KT('device.error.' + errorMessage) || errorMessage, 
          KT('device.saveError'), 
          {
            confirmButtonText: 'OK',
          }
        );
      });
    } else {
      // Mostrar error si la validación del formulario falla
      ElMessage.error(KT('device.error.checkForm'));
    }
  });
};

// Função para limpar backdrop quando o dialog fecha (corrige bug do mapa cinza)
const onDialogClosed = () => {
  console.log('✅ CLOSED EVENT FIRED at', new Date().toISOString());
  
  // Remover qualquer backdrop residual que possa estar causando o mapa cinza
  const backdrops = document.querySelectorAll('.el-overlay');
  console.log('📊 Backdrops found:', backdrops.length);
  
  backdrops.forEach(backdrop => {
    if (backdrop && backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
  });
  
  // Garantir que o body não fique com overflow hidden
  document.body.style.overflow = '';
  document.body.classList.remove('el-popup-parent--hidden');
  
  console.log('✅ Cleanup complete');
};

const generatePDF = async () => {
  try {
    if (!formData.value.id) {
      ElMessage.error(KT('device.saveFirst'));
      return;
    }

    ElNotification({
      title: KT('info'),
      message: KT('device.generatingPDF'),
      type: 'info',
    });

    // Importar as bibliotecas diretamente
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    // Criar instância do PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Configurar fonte
    pdf.setFont('helvetica');

    // Cabeçalho com título
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setFontSize(20);
    pdf.setTextColor(60, 60, 60);
    pdf.text(KT('device.deviceReport'), margin, 25);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${KT('device.generatedAt')}: ${new Date().toLocaleString('pt-BR')}`, margin, 35);

    yPosition = 50;

    // Informações do dispositivo
    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text(KT('device.device'), margin, yPosition);
    yPosition += 10;

    const deviceInfo = [
      [KT('device.model'), formData.value.attributes?.['device.model'] || ''],
      [KT('device.technology'), formData.value.attributes?.['device.technology'] || ''],
      [KT('device.protocol'), formData.value.attributes?.['device.protocol'] || '']
    ];

    autoTable(pdf, {
      startY: yPosition,
      head: [[KT('attribute'), KT('value')]],
      body: deviceInfo,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        textColor: [60, 60, 60],
        fillColor: [250, 250, 250]
      },
      headStyles: { 
        fillColor: [200, 200, 200], 
        textColor: [40, 40, 40] 
      },
      margin: { left: margin, right: margin }
    });

    yPosition = pdf.lastAutoTable.finalY + 15;

    // Informações do chip/SIM
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.text(KT('device.chip'), margin, yPosition);
    yPosition += 10;

    const chipInfo = [
      [KT('device.iccid'), formData.value.attributes?.['iccid'] || ''],
      [KT('device.phone'), formData.value.attributes?.['phone'] || ''],
      [KT('device.brocker'), formData.value.attributes?.['broker'] || ''],
      [KT('device.operator'), formData.value.attributes?.['operator'] || ''],
      [KT('device.apn'), formData.value.attributes?.['APN'] || ''],
      [KT('device.ValoMensual'), formData.value.attributes?.['ValoMensual'] || ''],
      [KT('device.dataSimAct'), formData.value.attributes?.['dataSimAct'] || ''],
      [KT('device.dataSimVal'), formData.value.attributes?.['dataSimVal'] || '']
    ];

    autoTable(pdf, {
      startY: yPosition,
      head: [[KT('attribute'), KT('value')]],
      body: chipInfo,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        textColor: [60, 60, 60],
        fillColor: [250, 250, 250]
      },
      headStyles: { 
        fillColor: [200, 200, 200], 
        textColor: [40, 40, 40] 
      },
      margin: { left: margin, right: margin }
    });

    yPosition = pdf.lastAutoTable.finalY + 15;

    // Informações do usuário
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.text(KT('user.user'), margin, yPosition);
    yPosition += 10;

    const userInfo = [
      [KT('user.name'), formData.value.attributes?.['tarkan.name'] || ''],
      [KT('user.phone'), formData.value.contact || ''],
      [KT('user.email'), formData.value.attributes?.['tarkan.email'] || '']
    ];

    autoTable(pdf, {
      startY: yPosition,
      head: [[KT('attribute'), KT('value')]],
      body: userInfo,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        textColor: [60, 60, 60],
        fillColor: [250, 250, 250]
      },
      headStyles: { 
        fillColor: [200, 200, 200], 
        textColor: [40, 40, 40] 
      },
      margin: { left: margin, right: margin }
    });

    yPosition = pdf.lastAutoTable.finalY + 15;

    // Detalhes do veículo
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.text(KT('device.details'), margin, yPosition);
    yPosition += 10;

    const vehicleInfo = [
      [KT('device.model'), formData.value.model || ''],
      [KT('device.brand'), formData.value.attributes?.['brand'] || ''],
      [KT('device.date'), formData.value.attributes?.['date'] || ''],
      [KT('device.vin'), formData.value.attributes?.['vin'] || ''],
      [KT('device.chassis'), formData.value.attributes?.['chassis'] || ''],
      [KT('device.plate'), formData.value.attributes?.['placa'] || ''],
      [KT('device.fuelPrice'), 'R$ ' + (formData.value.attributes?.['fuelPrice'] || '0')],
      [KT('device.tank'), (formData.value.attributes?.['fuelTank'] || '0') + ' litros'],
      [KT('device.odometer'), odometerData.value + ' km' || ''],
      [KT('device.hoursMovement'), hoursData.value + ' h' || '']
    ];

    autoTable(pdf, {
      startY: yPosition,
      head: [[KT('attribute'), KT('value')]],
      body: vehicleInfo,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        textColor: [60, 60, 60],
        fillColor: [250, 250, 250]
      },
      headStyles: { 
        fillColor: [200, 200, 200], 
        textColor: [40, 40, 40] 
      },
      margin: { left: margin, right: margin }
    });

    yPosition = pdf.lastAutoTable.finalY + 15;

    // Informações de instalação
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(14);
    pdf.text(KT('instalations.install'), margin, yPosition);
    yPosition += 10;

    const installationInfo = [
      [KT('instalations.empresa'), formData.value.attributes?.['instalation.empresa'] || ''],
      [KT('instalations.installer'), formData.value.attributes?.['instalation.instalador'] || ''],
      [KT('instalations.phone'), formData.value.attributes?.['instalation.phone'] || ''],
      [KT('instalations.email'), formData.value.attributes?.['instalation.email'] || ''],
      [KT('instalations.data'), formData.value.attributes?.['instalation.data'] || ''],
      [KT('instalations.observation'), formData.value.attributes?.['instalation.observation'] || '']
    ];

    autoTable(pdf, {
      startY: yPosition,
      head: [[KT('attribute'), KT('value')]],
      body: installationInfo,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        textColor: [60, 60, 60],
        fillColor: [250, 250, 250]
      },
      headStyles: { 
        fillColor: [200, 200, 200], 
        textColor: [40, 40, 40] 
      },
      margin: { left: margin, right: margin }
    });

    yPosition = pdf.lastAutoTable.finalY + 15;

    // ============================================
    // SEÇÃO: FOTOS DE INSTALAÇÃO
    // ============================================
    // Verificar se existe pelo menos uma foto de instalação
    const hasInstallationPhotos = installationPhotos.value.some(photo => photo && photo.trim() !== '');
    if (hasInstallationPhotos) {
      // Nova página para fotos
      pdf.addPage();
      yPosition = margin;

      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text('📍 Fotos do Local de Instalação', margin, yPosition);
      yPosition += 10;

      // Adicionar cada foto de instalação
      for (let i = 0; i < 3; i++) {
        const photoUrl = installationPhotos.value[i];
        const description = formData.value.attributes?.[`installation.photo${i + 1}.description`];
        
        // Só processa se a URL existir e não for vazia
        if (photoUrl && photoUrl.trim() !== '') {
          try {
            // Verificar se precisa de nova página
            if (yPosition > pageHeight - 100) {
              pdf.addPage();
              yPosition = margin;
            }

            // Título da foto
            pdf.setFontSize(11);
            pdf.setTextColor(60, 60, 60);
            pdf.text(`Foto ${i + 1}`, margin, yPosition);
            yPosition += 7;

            // Descrição (se existir e não for vazia)
            if (description && description.trim() !== '') {
              pdf.setFontSize(9);
              pdf.setTextColor(100, 100, 100);
              const descText = pdf.splitTextToSize(`Descrição: ${description}`, pageWidth - 2 * margin);
              pdf.text(descText, margin, yPosition);
              yPosition += descText.length * 4 + 5;
            }

            // Adicionar imagem
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = 70; // Altura fixa para manter proporcional
            
            // Converter URL relativa para absoluta
            const fullPhotoUrl = photoUrl.startsWith('http') ? photoUrl : window.location.origin + photoUrl;
            
            pdf.addImage(fullPhotoUrl, 'JPEG', margin, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 15;
            
          } catch (imgError) {
            // Apenas log no console, não mostra erro no PDF para não poluir
            console.warn(`Erro ao adicionar foto ${i + 1} de instalação:`, imgError);
            // NÃO adiciona espaço vazio - apenas pula esta foto
          }
        }
      }
    }

    // ============================================
    // SEÇÃO: FOTOS DE VISTORIA
    // ============================================
    // Verificar se existe pelo menos uma foto de vistoria
    const hasInspectionPhotos = inspectionPhotos.value.some(photo => photo && photo.trim() !== '');
    if (hasInspectionPhotos) {
      // Nova página para fotos de vistoria
      pdf.addPage();
      yPosition = margin;

      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text('✅ Fotos de Vistoria da Instalação', margin, yPosition);
      yPosition += 10;

      // Adicionar cada foto de vistoria
      for (let i = 0; i < 3; i++) {
        const photoUrl = inspectionPhotos.value[i];
        const description = formData.value.attributes?.[`inspection.photo${i + 1}.description`];
        
        // Só processa se a URL existir e não for vazia
        if (photoUrl && photoUrl.trim() !== '') {
          try {
            // Verificar se precisa de nova página
            if (yPosition > pageHeight - 100) {
              pdf.addPage();
              yPosition = margin;
            }

            // Título da foto
            pdf.setFontSize(11);
            pdf.setTextColor(60, 60, 60);
            pdf.text(`Vistoria ${i + 1}`, margin, yPosition);
            yPosition += 7;

            // Descrição (se existir e não for vazia)
            if (description && description.trim() !== '') {
              pdf.setFontSize(9);
              pdf.setTextColor(100, 100, 100);
              const descText = pdf.splitTextToSize(`Descrição: ${description}`, pageWidth - 2 * margin);
              pdf.text(descText, margin, yPosition);
              yPosition += descText.length * 4 + 5;
            }

            // Adicionar imagem
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = 70;
            
            // Converter URL relativa para absoluta
            const fullPhotoUrl = photoUrl.startsWith('http') ? photoUrl : window.location.origin + photoUrl;
            
            pdf.addImage(fullPhotoUrl, 'JPEG', margin, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 15;
            
          } catch (imgError) {
            // Apenas log no console, não mostra erro no PDF
            console.warn(`Erro ao adicionar foto ${i + 1} de vistoria:`, imgError);
            // NÃO adiciona espaço vazio - apenas pula esta foto
          }
        }
      }
    }

    // Observações
    if (formData.value.attributes?.['observation']) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(14);
      pdf.text(KT('device.observations'), margin, yPosition);
      yPosition += 10;

      const observationText = formData.value.attributes['observation'];
      const splitText = pdf.splitTextToSize(observationText, pageWidth - 2 * margin);
      
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text(splitText, margin, yPosition);
      yPosition += splitText.length * 5 + 15;
    }

    // Rodapé em todas as páginas
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`${KT('page')} ${i} ${KT('of')} ${pageCount}`, pageWidth - margin - 30, pageHeight - 10);
      pdf.text(KT('device.generatedBy'), margin, pageHeight - 10);
    }

    // Salvar PDF
    const fileName = `device_${formData.value.name || formData.value.uniqueId}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    ElNotification({
      title: KT('success'),
      message: KT('device.pdfGenerated'),
      type: 'success',
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    ElMessage.error(KT('device.pdfError'));
  }
};


 

</script>

<style scoped>
/* Usando tokens do BaseModal (--m-*) */
:deep(.bm--device .bm-body) {
  min-height: 0;
  max-height: calc(100vh - 180px);
  overflow: auto;
  padding: 0 !important;
}

.device-footer {
  border-top: 1px solid var(--m-border);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  background: var(--m-bg);
}

.device-footer-left,
.device-footer-right {
  display: flex;
  gap: 10px;
}

.el-tabs__nav-wrap {
  padding-left: 20px;
  padding-right: 20px;
  background: var(--m-bg);
}

.el-tabs__content {
  padding: 20px;
  background: var(--m-bg);
}

.form-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.form-col-70 { flex: 0.7; }
.form-col-60 { flex: 0.6; }
.form-col-80 { flex: 0.8; }
.form-col-50 { flex: 0.5; }
.form-col-40 { flex: 0.4; }
.form-col-33 { flex: 0.33; }
.form-full { flex: 1; }

/* Utilities */
.full-width-select {
  width: 100%;
}

.helper-text {
  color: var(--m-subtext);
}

.device-state-section {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  padding: 10px;
  background-color: var(--m-muted-bg);
  border-radius: 5px;
}

.speed-limit-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.speed-limit-helper {
  font-size: 12px;
  color: var(--m-subtext);
  margin-top: 4px;
}

.speed-warning {
  margin-top: 8px;
}

.user-form-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.user-section {
  background: var(--m-muted-bg);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--m-border);
}

.section-title {
  margin: 0 0 20px 0;
  color: var(--m-text);
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid var(--m-border);
  padding-bottom: 8px;
}

.section-description {
  color: var(--m-subtext);
  font-size: 13px;
  margin-bottom: 15px;
  line-height: 1.5;
}

.address-row {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.user-form-item {
  flex: 1;
  min-width: 180px;
}

.cep-field {
  flex: 0 0 140px;
  min-width: 140px;
}

.street-field {
  flex: 2;
  min-width: 200px;
}

.number-field {
  flex: 0 0 100px;
  min-width: 100px;
}

.user-option {
  display: flex;
  justify-content: space-between;
}

.user-email {
  color: var(--m-subtle);
  font-size: 13px;
}

.user-linked-alert {
  margin-top: 10px;
}

.changed-input {
  border-color: #f39c12 !important;
  box-shadow: 0 0 0 2px rgba(243, 156, 18, 0.2) !important;
}

.changed-indicator {
  color: #f39c12;
  font-size: 14px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.accumulator-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

.field-helper {
  font-size: 11px;
  color: var(--m-subtext);
  margin-top: 5px;
}

.vehicle-section-title {
  margin-top: 30px;
  margin-bottom: 15px;
  color: var(--m-text);
  font-size: 16px;
  font-weight: 600;
}

.icon-tabs {
  margin-bottom: 10px;
}

.icon-grid-container {
  display: flex;
  border: 1px solid var(--m-border);
  border-radius: 3px;
  flex-wrap: wrap;
  margin-right: -10px;
  overflow-y: auto;
  max-height: 350px;
  padding: 5px;
  background: var(--m-bg);
}

.icon-grid-v2 {
  max-height: 500px;
  padding: 10px;
}

.icon-grid-container::-webkit-scrollbar {
  width: 10px;
}

.icon-grid-container::-webkit-scrollbar-track {
  background: var(--m-muted-bg);
  border-radius: 5px;
}

.icon-grid-container::-webkit-scrollbar-thumb {
  background: var(--m-subtle);
  border-radius: 5px;
}

.icon-grid-container::-webkit-scrollbar-thumb:hover {
  background: var(--m-text);
}

.color-customization {
  display: flex;
}

.color-section {
  flex: 1;
}

.color-section:first-child {
  margin-right: 30px;
}

.color-section:last-child {
  margin-left: 30px;
}

.color-label {
  margin-bottom: -15px !important;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
}

.color-switch {
  margin-top: 0px;
}

.color-sliders {
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.slider-item {
  flex: 1;
  margin-right: 5px;
}

.slider-label {
  margin-bottom: -15px !important;
}

.color-palette {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
}

.color-swatch {
  margin-right: 2px;
  margin-bottom: 2px;
  border: 1px solid var(--m-border);
  border-radius: 3px;
  cursor: pointer;
}

.color-box {
  background: #3e8db9;
  width: 30px;
  height: 30px;
}

.photos-container {
  padding: 10px;
}

.photo-section {
  background: var(--m-muted-bg);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--m-border);
  margin-bottom: 20px;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.upload-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-label {
  font-weight: 600;
  color: var(--m-text);
  font-size: 14px;
  margin-bottom: 5px;
}

.photo-uploader {
  width: 100%;
}

.photo-uploader :deep(.el-upload) {
  width: 100%;
  border: 2px dashed var(--m-border);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  background-color: var(--m-bg);
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-uploader :deep(.el-upload:hover) {
  border-color: var(--m-accent-1);
  background-color: var(--m-muted-bg);
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--m-subtext);
  text-align: center;
}

.upload-placeholder i {
  font-size: 32px;
  margin-bottom: 8px;
  color: var(--m-subtle);
}

.upload-text {
  font-size: 13px;
  color: var(--m-subtext);
}

.remove-photo-btn {
  width: 100%;
  margin-top: 5px;
}

.photo-description-input {
  margin-top: 5px;
}

.photo-alert {
  margin-top: 20px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--m-subtext);
}

.empty-state i {
  font-size: 24px;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .user-form-container {
    gap: 20px;
  }
  
  .user-section {
    padding: 15px;
  }
  
  .address-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .user-form-item,
  .cep-field,
  .street-field,
  .number-field {
    flex: none;
    min-width: 100%;
  }
  
  .section-title {
    font-size: 14px;
  }
  
  .device-footer {
    flex-direction: column !important;
    gap: 10px !important;
  }
  
  .device-footer > div {
    justify-content: center !important;
  }
  
  .el-tabs__content {
    padding-left: 10px;
    padding-right: 10px;
  }
  
  .el-tabs__nav-wrap {
    padding-left: 10px;
    padding-right: 10px;
  }
  
  .el-button {
    min-height: 44px;
    padding: 12px 20px;
  }

  .upload-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .photo-section {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .el-tabs__content {
    padding-left: 5px;
    padding-right: 5px;
  }
  
  .el-tabs__nav-wrap {
    padding-left: 5px;
    padding-right: 5px;
  }
  
  .user-section {
    padding: 10px;
    margin-bottom: 10px;
  }
  
  .section-title {
    font-size: 13px;
    margin-bottom: 15px;
  }
  
  .device-footer {
    position: sticky !important;
    bottom: 0 !important;
    background: var(--m-bg) !important;
    z-index: 1000 !important;
    border-top: 1px solid var(--m-border) !important;
    margin-top: 0 !important;
  }
  
  :deep(.bm--device .bm-body) {
    padding-bottom: 80px !important;
  }
  
  .el-button {
    min-height: 48px !important;
    font-size: 16px !important;
    width: 100% !important;
    margin-bottom: 5px !important;
  }

  .photo-section .section-title {
    font-size: 14px;
  }
  
  .photo-section .section-description {
    font-size: 12px;
  }
}
</style>